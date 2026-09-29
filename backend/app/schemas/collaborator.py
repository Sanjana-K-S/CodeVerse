from pydantic import BaseModel
from datetime import datetime


class CollaboratorInvite(BaseModel):
    project_id: int
    email: str


class CollaboratorResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True