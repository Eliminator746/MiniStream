import os
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from loguru import logger
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import User
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

COGNITO_REGION = os.getenv("AWS_DEFAULT_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")

bearer_scheme = HTTPBearer()

# cache keys — fetched once, reused forever
_cognito_keys = None


def get_cognito_region() -> str | None:
    # Prefer explicit Cognito region if provided.
    explicit = os.getenv("COGNITO_REGION")
    if explicit:
        return explicit

    if COGNITO_REGION:
        return COGNITO_REGION

    # Fallback: infer from user pool id, e.g. ap-south-1_xxxxx.
    if COGNITO_USER_POOL_ID and "_" in COGNITO_USER_POOL_ID:
        return COGNITO_USER_POOL_ID.split("_", 1)[0]

    return None


def get_jwks_url() -> str:
    region = get_cognito_region()
    if not region or not COGNITO_USER_POOL_ID:
        return ""
    return f"https://cognito-idp.{region}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"


# -----------------------------
# FETCH COGNITO PUBLIC KEYS
# -----------------------------

async def get_cognito_keys():
    global _cognito_keys
    if _cognito_keys is None:
        jwks_url = get_jwks_url()
        if not jwks_url or not COGNITO_APP_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Cognito configuration missing. "
                    "Set COGNITO_USER_POOL_ID and COGNITO_APP_CLIENT_ID, and either "
                    "COGNITO_REGION or AWS_DEFAULT_REGION."
                ),
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(jwks_url)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as e:
            logger.exception(f"Failed to fetch Cognito JWKS from {jwks_url}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch Cognito JWKS: {str(e)}")
        except ValueError:
            logger.exception(f"Invalid JSON from Cognito JWKS endpoint: {jwks_url}")
            raise HTTPException(status_code=500, detail="Invalid JSON returned by Cognito JWKS endpoint")

        keys = data.get("keys") if isinstance(data, dict) else None
        if not isinstance(keys, list) or not keys:
            logger.error(f"Invalid JWKS payload from {jwks_url}: {data}")
            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid JWKS response from Cognito. "
                    f"Check user pool/region config. URL: {jwks_url}"
                ),
            )

        _cognito_keys = keys
    return _cognito_keys


# -----------------------------
# GET CURRENT USER (COGNITO VERIFY)
# -----------------------------

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        keys = await get_cognito_keys()

        payload = jwt.decode(
            token,
            keys,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            options={"verify_at_hash": False}
        )

        email: str = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        name: str = payload.get("name", email.split("@")[0])

    except HTTPException as e:
        logger.warning(f"Auth HTTPException: {e.detail}")
        raise
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        try:
            # Backward compatibility: old DBs may still have users.password as NOT NULL.
            users_columns = {
                col["name"]: col for col in inspect(db.bind).get_columns("users")
            }
            password_col = users_columns.get("password")
            password_required = bool(password_col and not password_col.get("nullable", True))

            if password_required:
                import random
                db.execute(
                    text(
                        "INSERT INTO users (name, email, password, subscribers) "
                        "VALUES (:name, :email, :password, :subscribers)"
                    ),
                    {"name": name, "email": email, "password": "cognito_user", "subscribers": random.randint(50, 10000)},
                )
                db.commit()
                user = db.query(User).filter(User.email == email).first()
            else:
                user = User(name=name, email=email)
                db.add(user)
                db.commit()
                db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.email == email).first()
        except Exception as e:
            db.rollback()
            logger.exception("User provisioning failed")
            raise HTTPException(status_code=500, detail=f"User provisioning failed: {str(e)}")

    if not user:
        raise HTTPException(status_code=500, detail="User provisioning failed")

    return user


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }