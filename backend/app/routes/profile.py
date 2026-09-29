from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.security import verify_password, hash_password


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


class ProfileResponse(BaseModel):
    id: int
    username: str
    email: str


class ProfileUpdate(BaseModel):
    username: str
    email: EmailStr

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Username cannot be empty")

        if len(value) < 3:
            raise ValueError(
                "Username must contain at least 3 characters"
            )

        if len(value) > 30:
            raise ValueError(
                "Username cannot exceed 30 characters"
            )

        if not all(
            character.isalnum() or character == "_"
            for character in value
        ):
            raise ValueError(
                "Username can contain only letters, numbers, and underscore"
            )

        return value


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("current_password")
    @classmethod
    def validate_current_password(cls, value):
        if not value:
            raise ValueError(
                "Current password is required"
            )

        return value

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value):
        if not value:
            raise ValueError(
                "New password is required"
            )

        if len(value) < 6:
            raise ValueError(
                "New password must contain at least 6 characters"
            )

        if len(value) > 128:
            raise ValueError(
                "New password cannot exceed 128 characters"
            )

        return value


@router.get(
    "/",
    response_model=ProfileResponse
)
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }


@router.put(
    "/",
    response_model=ProfileResponse
)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_email = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.id != current_user.id
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    existing_username = (
        db.query(User)
        .filter(
            User.username == data.username,
            User.id != current_user.id
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username is already taken"
        )

    current_user.username = data.username
    current_user.email = data.email

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/password")
def change_password(
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(
        data.current_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    current_user.password = hash_password(
        data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }