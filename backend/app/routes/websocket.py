from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket_manager import manager


router = APIRouter(
    prefix="/collaborations",
    tags=["Real-Time Collaboration"]
)


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int
):
    user_id = websocket.query_params.get("user_id")

    if not user_id:
        await websocket.close(code=1008)
        return

    try:
        user_id = int(user_id)
    except ValueError:
        await websocket.close(code=1008)
        return

    # Connect the user
    await manager.connect(
        project_id,
        user_id,
        websocket
    )

    # Get the current online users
    online_users = manager.get_online_users(project_id)

    # Send the complete list to the newly connected user
    await websocket.send_json({
        "type": "online_users",
        "users": online_users
    })

    # Tell all other users that someone joined
    await manager.broadcast(
        project_id,
        {
            "type": "user_joined",
            "user_id": user_id
        },
        websocket
    )

    try:
        while True:

            data = await websocket.receive_json()

            data["user_id"] = user_id

            # Send collaboration data to other users
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

        # Get updated online users after disconnect
        online_users = manager.get_online_users(project_id)

        # Tell remaining users the updated list
        connections = manager.active_connections.get(
            project_id,
            []
        )

        for connection in connections:
            try:
                await connection["websocket"].send_json({
                    "type": "online_users",
                    "users": online_users
                })
            except Exception:
                pass