from pydantic import BaseModel

class CodeRequest(BaseModel):
    language: str
    source_code: str


class CodeResponse(BaseModel):
    output: str