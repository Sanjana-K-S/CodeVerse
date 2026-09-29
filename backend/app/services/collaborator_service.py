from sqlalchemy.orm import Session

from app.models.user import User
from app.models.project import Project
from app.models.collaborator import ProjectCollaborator


def invite_collaborator(db: Session, project_id: int, email: str):

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        return None

    user = db.query(User).filter(User.email == email).first()

    if not user:
        return "USER_NOT_FOUND"

    existing = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.user_id == user.id
    ).first()

    if existing:
        return "ALREADY_EXISTS"

    collaborator = ProjectCollaborator(
        project_id=project_id,
        user_id=user.id,
        role="editor"
    )

    db.add(collaborator)
    db.commit()
    db.refresh(collaborator)

    return collaborator

def get_project_collaborators(db: Session, project_id: int):
    return db.query(ProjectCollaborator).filter(
        ProjectCollaborator.project_id == project_id
    ).all()