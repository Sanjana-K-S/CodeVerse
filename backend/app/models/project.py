from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(100), nullable=False)

    language = Column(String(50), nullable=False)

    source_code = Column(Text, default="")

    description = Column(Text)

    owner_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    owner = relationship(
        "User",
        back_populates="projects"
    )

    collaborators = relationship(
        "ProjectCollaborator",
        back_populates="project",
        cascade="all, delete-orphan"
    )