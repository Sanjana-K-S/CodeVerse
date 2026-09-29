from sqlalchemy import Column, Integer, String
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")

    projects = relationship(
        "Project",
        back_populates="owner"
    )

    collaborations = relationship(
        "ProjectCollaborator",
        back_populates="user",
        cascade="all, delete-orphan"
    )