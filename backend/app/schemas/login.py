from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):

    email: EmailStr

    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):

        if not value:
            raise ValueError("Password is required")

        if len(value) > 128:
            raise ValueError(
                "Password cannot exceed 128 characters"
            )

        return value