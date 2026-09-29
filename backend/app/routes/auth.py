from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.login import LoginRequest
from app.services.auth_service import create_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ---------------- Register ----------------

@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    new_user = create_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return new_user


# ---------------- Login ----------------

@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):
    login_result = login_user(
        db,
        user.email,
        user.password
    )

    if login_result is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "access_token": login_result["access_token"],
        "token_type": "bearer",
        "user_id": login_result["user_id"],
        "username": login_result["username"],
        "email": login_result["email"]
    }