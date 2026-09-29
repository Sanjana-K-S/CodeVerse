from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_service import ask_ai


router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


class AIRequest(BaseModel):
    prompt: str


class TranslateRequest(BaseModel):
    source_code: str
    source_language: str
    target_language: str


@router.post("/chat")
def chat_with_ai(request: AIRequest):
    response = ask_ai(request.prompt)

    return {
        "response": response
    }


@router.post("/translate")
def translate_code(request: TranslateRequest):

    prompt = f"""
You are an expert programming language translator.

Your task is to convert a COMPLETE program from
{request.source_language} to {request.target_language}.

SOURCE LANGUAGE:
{request.source_language}

TARGET LANGUAGE:
{request.target_language}

SOURCE CODE:
{request.source_code}

IMPORTANT REQUIREMENTS:

1. Translate the COMPLETE program.
2. Preserve the original program logic and functionality.
3. The output MUST be a complete, standalone, compilable/runnable program.
4. Do NOT return only individual statements or fragments.
5. Include all required libraries/imports/header files.
6. Include the required entry point for the target language.
7. For C and C++, include all required #include statements and a main() function.
8. For Java, include a complete class with a main() method when the source program has an executable entry point.
9. For Python, return a complete executable Python program.
10. Preserve variables, loops, conditions, calculations, input/output and other functionality.
11. Use correct syntax and data types for the target language.
12. Do not explain anything.
13. Do not add comments explaining the translation.
14. Do not use Markdown code fences.
15. Return ONLY the final source code.

Before returning the answer, internally check that the translated
program is syntactically complete and can be compiled/run in the
target language.

Return ONLY the translated source code.
"""

    translated_code = ask_ai(prompt)

    translated_code = translated_code.strip()

    # Remove Markdown code fences if the AI still returns them
    if translated_code.startswith("```"):
        lines = translated_code.splitlines()

        if lines:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        translated_code = "\n".join(lines).strip()

    return {
        "translated_code": translated_code
    }