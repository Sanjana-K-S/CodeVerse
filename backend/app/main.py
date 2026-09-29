from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Models
from app.models.user import User
from app.models.project import Project
from app.models.collaborator import ProjectCollaborator
from app.models.collaboration import Collaboration


# Routes
from app.routes.auth import router as auth_router
from app.routes.project import router as project_router
from app.routes.collaborator import router as collaborator_router
from app.routes.collaboration import router as collaboration_router
from app.routes.profile import router as profile_router
from app.routes.websocket import router as websocket_router
from app.routes import code
from app.routes import ai


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="CodeVerse API",
    description="Backend API for the CodeVerse Online Coding Platform",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(collaborator_router)
app.include_router(collaboration_router)
app.include_router(profile_router)
app.include_router(code.router)
app.include_router(ai.router)


# ============================================================
# WEBSOCKET ROUTES
# ============================================================

app.include_router(websocket_router)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to CodeVerse API",
        "status": "Backend Running Successfully"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "OK",
        "server": "Running"
    }