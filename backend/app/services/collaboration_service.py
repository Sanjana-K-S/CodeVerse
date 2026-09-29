from sqlalchemy.orm import Session

from app.models.collaboration import Collaboration
from app.models.user import User
from app.models.collaborator import ProjectCollaborator


def invite_user(
    db: Session,
    project_id: int,
    owner,
    collaborator_email: str
):
    collaborator = (
        db.query(User)
        .filter(
            User.email == collaborator_email
        )
        .first()
    )

    if collaborator is None:
        return None

    if collaborator.id == owner.id:
        return None

    existing_invitation = (
        db.query(Collaboration)
        .filter(
            Collaboration.project_id == project_id,
            Collaboration.collaborator_id == collaborator.id,
            Collaboration.status == "Pending"
        )
        .first()
    )

    if existing_invitation:
        return existing_invitation

    invitation = Collaboration(
        project_id=project_id,
        owner_id=owner.id,
        collaborator_id=collaborator.id,
        status="Pending"
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return invitation


def get_my_invitations(
    db: Session,
    user
):
    return (
        db.query(Collaboration)
        .filter(
            Collaboration.collaborator_id == user.id
        )
        .order_by(
            Collaboration.id.desc()
        )
        .all()
    )


def accept_invitation(
    db: Session,
    invitation_id: int,
    user
):
    invitation = (
        db.query(Collaboration)
        .filter(
            Collaboration.id == invitation_id,
            Collaboration.collaborator_id == user.id
        )
        .first()
    )

    if invitation is None:
        return None

    invitation.status = "Accepted"

    existing_collaborator = (
        db.query(ProjectCollaborator)
        .filter(
            ProjectCollaborator.project_id == invitation.project_id,
            ProjectCollaborator.user_id == user.id
        )
        .first()
    )

    if existing_collaborator is None:

        collaborator = ProjectCollaborator(
            project_id=invitation.project_id,
            user_id=user.id,
            role="editor"
        )

        db.add(collaborator)

    db.commit()
    db.refresh(invitation)

    return invitation


def reject_invitation(
    db: Session,
    invitation_id: int,
    user
):
    invitation = (
        db.query(Collaboration)
        .filter(
            Collaboration.id == invitation_id,
            Collaboration.collaborator_id == user.id
        )
        .first()
    )

    if invitation is None:
        return None

    invitation.status = "Rejected"

    db.commit()
    db.refresh(invitation)

    return invitation