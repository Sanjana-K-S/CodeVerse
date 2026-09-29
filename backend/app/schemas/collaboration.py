from pydantic import BaseModel


class CollaborationCreate(BaseModel):
    project_id: int
    collaborator_email: str


class CollaborationResponse(BaseModel):
    id: int
    project_id: int
    owner_id: int
    collaborator_id: int
    status: str

    class Config:
        from_attributes = True