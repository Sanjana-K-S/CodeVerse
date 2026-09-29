from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Username is required")

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

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not value:
            raise ValueError("Password is required")

        if len(value) < 6:
            raise ValueError(
                "Password must contain at least 6 characters"
            )

        if len(value) > 128:
            raise ValueError(
                "Password cannot exceed 128 characters"
            )

        return value


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True