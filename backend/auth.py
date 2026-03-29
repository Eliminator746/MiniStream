import os
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
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
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL)
            _cognito_keys = response.json()["keys"]
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
        user = User(name=name, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }