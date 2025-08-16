from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from db import get_db
from models.users import Users
from routers.auth.schemas import UserRegister, TokenResponse, RegisterResponse

router = APIRouter()

agent_context = {
    "access_token": None
}


@router.post("/login", response_model=TokenResponse)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)):
    user = await db.execute(select(Users).where(Users.username == form_data.username))
    user = user.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    print(f"Access token: {access_token}")
    agent_context["access_token"] = access_token

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/register", response_model=RegisterResponse)
async def register(user: UserRegister, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(Users).where(Users.username == user.username))
    if existing_user.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    existing_email = await db.execute(select(Users).where(Users.email == user.email))
    if existing_email.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    hashed_password = get_password_hash(user.password)
    new_user = Users(username=user.username, email=user.email,
                     full_name=user.full_name, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    return RegisterResponse(status="success", message="User registered successfully")


@router.put("/change_password")
async def change_password(password: Annotated[str, Query(..., description="new password")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    hashed_password = get_password_hash(password)
    user.hashed_password = hashed_password

    await db.commit()

    return {
        "status": "success",
        "message": "Password changed successfully"
    }


def get_agent_context():
    return agent_context
