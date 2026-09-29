from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base


class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id"))

    owner_id = Column(Integer, ForeignKey("users.id"))

    collaborator_id = Column(Integer, ForeignKey("users.id"))

    status = Column(String(20), default="Pending")

    project = relationship("Project")