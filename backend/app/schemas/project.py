from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str
    language: str
    description: str | None = None
    source_code: str = ""


class ProjectUpdate(BaseModel):
    title: str | None = None
    language: str | None = None
    description: str | None = None
    source_code: str | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    language: str
    description: str | None = None
    source_code: str
    owner_id: int

    class Config:
        from_attributes = True