from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.project import Project
from app.models.collaborator import ProjectCollaborator
from app.schemas.project import ProjectCreate


# ============================================================
# CREATE PROJECT
# ============================================================

def create_project(
    db: Session,
    project: ProjectCreate,
    user
):

    new_project = Project(
        title=project.title,
        language=project.language,
        description=project.description,
        source_code=project.source_code,
        owner_id=user.id
    )

    db.add(
        new_project
    )

    db.commit()

    db.refresh(
        new_project
    )

    return new_project


# ============================================================
# GET PROJECTS
# ============================================================

def get_projects(
    db: Session,
    user
):

    projects = (
        db.query(Project)
        .outerjoin(
            ProjectCollaborator,
            Project.id
            == ProjectCollaborator.project_id
        )
        .filter(
            or_(
                Project.owner_id
                == user.id,

                ProjectCollaborator.user_id
                == user.id
            )
        )
        .distinct()
        .order_by(
            Project.id.desc()
        )
        .all()
    )

    return projects


# ============================================================
# GET SINGLE PROJECT
# ============================================================

def get_project(
    db: Session,
    project_id: int
):

    return (
        db.query(Project)
        .filter(
            Project.id == project_id
        )
        .first()
    )


# ============================================================
# UPDATE PROJECT
# ============================================================

def update_project(
    db: Session,
    project_id: int,
    project: ProjectCreate
):

    db_project = (
        db.query(Project)
        .filter(
            Project.id == project_id
        )
        .first()
    )

    if not db_project:

        return None

    db_project.title = (
        project.title
    )

    db_project.language = (
        project.language
    )

    db_project.description = (
        project.description
    )

    db_project.source_code = (
        project.source_code
    )

    db.commit()

    db.refresh(
        db_project
    )

    return db_project


# ============================================================
# DELETE PROJECT
# ============================================================

def delete_project(
    db: Session,
    project_id: int
):

    db_project = (
        db.query(Project)
        .filter(
            Project.id == project_id
        )
        .first()
    )

    if not db_project:

        return False

    db.delete(
        db_project
    )

    db.commit()

    return True