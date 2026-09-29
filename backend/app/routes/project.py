from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.collaborator import ProjectCollaborator

from app.schemas.project import (
    ProjectCreate,
    ProjectResponse
)

from app.services.project_service import (
    create_project,
    get_projects,
    get_project,
    update_project,
    delete_project,
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# --------------------------------------------------
# CHECK PROJECT ACCESS
# --------------------------------------------------

def check_project_access(
    db: Session,
    project_id: int,
    user: User
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Owner has access
    if project.owner_id == user.id:
        return project

    # Check accepted collaborator
    collaborator = (
        db.query(ProjectCollaborator)
        .filter(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.user_id == user.id
        )
        .first()
    )

    if collaborator:
        return project

    raise HTTPException(
        status_code=403,
        detail="You do not have access to this project"
    )


# --------------------------------------------------
# CREATE PROJECT
# --------------------------------------------------

@router.post(
    "/create",
    response_model=ProjectResponse
)
def create_new_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_project(
        db,
        project,
        current_user
    )


# --------------------------------------------------
# GET USER PROJECTS
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[ProjectResponse]
)
def view_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_projects(
        db,
        current_user
    )


# --------------------------------------------------
# GET SINGLE PROJECT
# --------------------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse
)
def view_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return check_project_access(
        db,
        project_id,
        current_user
    )


# --------------------------------------------------
# UPDATE PROJECT
# --------------------------------------------------

@router.put(
    "/{project_id}",
    response_model=ProjectResponse
)
def edit_project(
    project_id: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = check_project_access(
        db,
        project_id,
        current_user
    )

    # Owner and accepted collaborators can edit
    updated_project = update_project(
        db,
        project_id,
        project
    )

    if updated_project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return updated_project


# --------------------------------------------------
# DELETE PROJECT
# --------------------------------------------------

@router.delete(
    "/{project_id}"
)
def remove_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # ONLY OWNER CAN DELETE
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the project owner can delete this project"
        )

    deleted = delete_project(
        db,
        project_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return {
        "message": "Project deleted successfully"
    }