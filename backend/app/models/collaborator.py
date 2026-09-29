from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class ProjectCollaborator(Base):
    __tablename__ = "project_collaborators"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    role = Column(
        String(20),
        default="editor"
    )

    joined_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    project = relationship(
        "Project",
        back_populates="collaborators"
    )

    user = relationship(
        "User",
        back_populates="collaborations"
    )