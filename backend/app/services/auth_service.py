from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token


def create_user(db: Session, user: UserCreate):

    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing:
        return None

    db_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def login_user(db: Session, email, password):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id
        }
    )

    return {
        "access_token": token,
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }