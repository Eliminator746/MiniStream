import os
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
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
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

bearer_scheme = HTTPBearer()

# cache keys — fetched once, reused forever
_cognito_keys = None


# -----------------------------
# FETCH COGNITO PUBLIC KEYS
# -----------------------------

async def get_cognito_keys():
    global _cognito_keys
    if _cognito_keys is None:
        if not COGNITO_REGION or not COGNITO_USER_POOL_ID or not COGNITO_APP_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Cognito configuration missing. "
                    "Set AWS_DEFAULT_REGION, COGNITO_USER_POOL_ID, and COGNITO_APP_CLIENT_ID."
                ),
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(JWKS_URL)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch Cognito JWKS: {str(e)}")
        except ValueError:
            raise HTTPException(status_code=500, detail="Invalid JSON returned by Cognito JWKS endpoint")

        keys = data.get("keys") if isinstance(data, dict) else None
        if not isinstance(keys, list) or not keys:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid JWKS response from Cognito. "
                    f"Check user pool/region config. URL: {JWKS_URL}"
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

    except HTTPException:
        raise
    except JWTError as e:
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
                db.execute(
                    text(
                        "INSERT INTO users (name, email, password) "
                        "VALUES (:name, :email, :password)"
                    ),
                    {"name": name, "email": email, "password": "cognito_user"},
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