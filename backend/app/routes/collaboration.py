from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)

from sqlalchemy.orm import Session

from jose import jwt, JWTError

from app.database import get_db
from app.dependencies import get_current_user
from app.config import SECRET_KEY, ALGORITHM

from app.models.user import User
from app.models.project import Project
from app.models.collaboration import Collaboration
from app.models.collaborator import ProjectCollaborator

from app.schemas.collaboration import (
    CollaborationCreate,
    CollaborationResponse
)

from app.services.collaboration_service import (
    invite_user,
    get_my_invitations,
    accept_invitation,
    reject_invitation
)

from app.websocket_manager import manager


router = APIRouter(
    prefix="/collaborations",
    tags=["Collaborations"]
)


# ============================================================
# SEND COLLABORATION INVITATION
# ============================================================

@router.post(
    "/invite",
    response_model=CollaborationResponse
)
async def send_invitation(
    invite: CollaborationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Check project
    project = (
        db.query(Project)
        .filter(
            Project.id == invite.project_id
        )
        .first()
    )

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Only owner can invite
    if project.owner_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="Only the project owner can invite collaborators"
        )

    collaboration = invite_user(
        db,
        invite.project_id,
        current_user,
        invite.collaborator_email
    )

    if collaboration is None:

        raise HTTPException(
            status_code=404,
            detail="Collaborator not found or invalid invitation"
        )

    # Send real-time notification
    await manager.send_notification(
        collaboration.collaborator_id,
        f"{current_user.username} invited you to project "
        f"{project.title}"
    )

    return collaboration


# ============================================================
# GET MY INVITATIONS
# ============================================================

@router.get(
    "/",
    response_model=list[CollaborationResponse]
)
def my_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return get_my_invitations(
        db,
        current_user
    )


# ============================================================
# ACCEPT INVITATION
# ============================================================

@router.put(
    "/{invitation_id}/accept"
)
def accept(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    invitation = accept_invitation(
        db,
        invitation_id,
        current_user
    )

    if invitation is None:

        raise HTTPException(
            status_code=404,
            detail="Invitation not found"
        )

    return {
        "message": "Invitation accepted",
        "project_id": invitation.project_id
    }


# ============================================================
# REJECT INVITATION
# ============================================================

@router.put(
    "/{invitation_id}/reject"
)
def reject(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    invitation = reject_invitation(
        db,
        invitation_id,
        current_user
    )

    if invitation is None:

        raise HTTPException(
            status_code=404,
            detail="Invitation not found"
        )

    return {
        "message": "Invitation rejected"
    }


# ============================================================
# REAL-TIME PROJECT COLLABORATION
# ============================================================

@router.websocket(
    "/ws/{project_id}"
)
async def collaboration_websocket(
    websocket: WebSocket,
    project_id: int
):

    token = websocket.query_params.get(
        "token"
    )

    # --------------------------------------------------------
    # Check token
    # --------------------------------------------------------

    if not token:

        await websocket.close(
            code=1008
        )

        return

    # --------------------------------------------------------
    # Decode JWT
    # --------------------------------------------------------

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get(
            "user_id"
        )

        if user_id is None:

            await websocket.close(
                code=1008
            )

            return

        user_id = int(user_id)

    except (
        JWTError,
        ValueError,
        TypeError
    ):

        await websocket.close(
            code=1008
        )

        return

    # --------------------------------------------------------
    # Open database connection
    # --------------------------------------------------------

    from app.database import SessionLocal

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Check project exists
        # ----------------------------------------------------

        project = (
            db.query(Project)
            .filter(
                Project.id == project_id
            )
            .first()
        )

        if project is None:

            await websocket.close(
                code=1008
            )

            return

        # ----------------------------------------------------
        # Check project access
        # ----------------------------------------------------

        has_access = False

        # Owner
        if project.owner_id == user_id:

            has_access = True

        else:

            collaborator = (
                db.query(ProjectCollaborator)
                .filter(
                    ProjectCollaborator.project_id
                    == project_id,

                    ProjectCollaborator.user_id
                    == user_id
                )
                .first()
            )

            if collaborator:

                has_access = True

        if not has_access:

            await websocket.close(
                code=1008
            )

            return

        # ----------------------------------------------------
        # Get users already online
        # ----------------------------------------------------

        existing_users = (
            manager.get_online_users(
                project_id
            )
        )

        # ----------------------------------------------------
        # Connect current user
        # ----------------------------------------------------

        await manager.connect(
            project_id,
            user_id,
            websocket
        )

        # ----------------------------------------------------
        # Send current online users
        # ----------------------------------------------------

        online_users = (
            manager.get_online_users(
                project_id
            )
        )

        await websocket.send_json(
            {
                "type": "online_users",
                "users": online_users
            }
        )

        # ----------------------------------------------------
        # Tell other users that someone joined
        # ----------------------------------------------------

        await manager.broadcast(
            project_id,
            {
                "type": "user_joined",
                "user_id": user_id
            },
            websocket
        )

        # ----------------------------------------------------
        # Receive collaboration messages
        # ----------------------------------------------------

        while True:

            data = await websocket.receive_json()

            message_type = data.get(
                "type"
            )

            # =================================================
            # CODE CHANGE
            # =================================================

            if message_type == "code_change":

                source_code = data.get(
                    "source_code",
                    ""
                )

                # Save latest code to database
                project.source_code = source_code

                db.commit()

                # Broadcast to other users
                await manager.broadcast(
                    project_id,
                    {
                        "type": "code_change",

                        "source_code": source_code,

                        "user_id": user_id
                    },
                    websocket
                )

            # =================================================
            # CURSOR / EDITOR ACTIVITY
            # =================================================

            elif message_type == "cursor_change":

                await manager.broadcast(
                    project_id,
                    {
                        "type": "cursor_change",

                        "user_id": user_id,

                        "position": data.get(
                            "position"
                        )
                    },
                    websocket
                )

            # =================================================
            # TYPING STATUS
            # =================================================

            elif message_type == "typing":

                await manager.broadcast(
                    project_id,
                    {
                        "type": "typing",

                        "user_id": user_id,

                        "is_typing": data.get(
                            "is_typing",
                            False
                        )
                    },
                    websocket
                )

            # =================================================
            # GENERIC COLLABORATION MESSAGE
            # =================================================

            else:

                data["user_id"] = user_id

                await manager.broadcast(
                    project_id,
                    data,
                    websocket
                )

    except WebSocketDisconnect:

        manager.disconnect(
            project_id,
            websocket
        )

        await manager.broadcast(
            project_id,
            {
                "type": "user_left",
                "user_id": user_id
            },
            websocket
        )

    except Exception:

        manager.disconnect(
            project_id,
            websocket
        )

        try:

            await manager.broadcast(
                project_id,
                {
                    "type": "user_left",
                    "user_id": user_id
                },
                websocket
            )

        except Exception:
            pass

    finally:

        db.close()


# ============================================================
# NOTIFICATION WEBSOCKET
# ============================================================

@router.websocket(
    "/notifications/ws/{user_id}"
)
async def notification_websocket(
    websocket: WebSocket,
    user_id: int
):

    await manager.connect_notification(
        user_id,
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect_notification(
            user_id,
            websocket
        )