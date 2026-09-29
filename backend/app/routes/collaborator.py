from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User
from app.models.project import Project
from app.models.collaboration import Collaboration

from app.schemas.collaborator import CollaboratorInvite

from app.websocket_manager import manager


router = APIRouter(
    prefix="/collaborators",
    tags=["Collaborators"]
)


# ============================================================
# SEND COLLABORATION INVITATION
# ============================================================

@router.post("/invite")
async def invite(
    invite: CollaboratorInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # Check project
    # --------------------------------------------------------

    project = (
        db.query(Project)
        .filter(Project.id == invite.project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # --------------------------------------------------------
    # Only project owner can invite collaborators
    # --------------------------------------------------------

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the project owner can invite collaborators"
        )

    # --------------------------------------------------------
    # Find invited user
    # --------------------------------------------------------

    collaborator = (
        db.query(User)
        .filter(User.email == invite.email)
        .first()
    )

    if collaborator is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # Owner cannot invite themselves
    # --------------------------------------------------------

    if collaborator.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot invite yourself"
        )

    # --------------------------------------------------------
    # Check existing invitation
    # --------------------------------------------------------

    existing_invitation = (
        db.query(Collaboration)
        .filter(
            Collaboration.project_id == invite.project_id,
            Collaboration.collaborator_id == collaborator.id,
            Collaboration.status == "Pending"
        )
        .first()
    )

    if existing_invitation:
        raise HTTPException(
            status_code=400,
            detail="Invitation already sent"
        )

    # --------------------------------------------------------
    # Create invitation
    # --------------------------------------------------------

    invitation = Collaboration(
        project_id=invite.project_id,
        owner_id=current_user.id,
        collaborator_id=collaborator.id,
        status="Pending"
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # --------------------------------------------------------
    # Send real-time notification
    # --------------------------------------------------------

    await manager.send_notification(
        collaborator.id,
        f"{current_user.username} invited you to project {project.title}"
    )

    # --------------------------------------------------------
    # Return invitation
    # --------------------------------------------------------

    return {
        "id": invitation.id,
        "project_id": invitation.project_id,
        "owner_id": invitation.owner_id,
        "collaborator_id": invitation.collaborator_id,
        "status": invitation.status
    }


# ============================================================
# VIEW PROJECT COLLABORATORS
# ============================================================

@router.get("/{project_id}")
def view_collaborators(
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

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the project owner can view collaborators"
        )

    collaborators = (
        db.query(Collaboration)
        .filter(
            Collaboration.project_id == project_id,
            Collaboration.status == "Accepted"
        )
        .all()
    )

    return [
        {
            "id": collaboration.id,
            "project_id": collaboration.project_id,
            "owner_id": collaboration.owner_id,
            "collaborator_id": collaboration.collaborator_id,
            "status": collaboration.status
        }
        for collaboration in collaborators
    ]