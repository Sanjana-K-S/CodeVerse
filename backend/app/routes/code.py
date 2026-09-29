from fastapi import APIRouter

from app.schemas.code import CodeRequest

from app.services.code_service import (
    run_python,
    run_java,
    run_c,
    run_cpp
)


router = APIRouter(
    prefix="/code",
    tags=["Code Execution"]
)


@router.post("/run")
def run_code(request: CodeRequest):

    language = request.language.lower()

    # Python
    if language == "python":
        output = run_python(request.source_code)

    # Java
    elif language == "java":
        output = run_java(request.source_code)

    # C
    elif language == "c":
        output = run_c(request.source_code)

    # C++
    elif language in ["c++", "cpp"]:
        output = run_cpp(request.source_code)

    # Unsupported
    else:
        output = "Language not supported yet."

    return {
        "output": output
    }