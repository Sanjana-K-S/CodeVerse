from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):
        self.active_connections = {}
        self.notification_connections = {}

    # =========================================================
    # PROJECT WEBSOCKET
    # =========================================================

    async def connect(
        self,
        project_id: int,
        user_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if project_id not in self.active_connections:
            self.active_connections[project_id] = []

        # Prevent duplicate connection for the same user
        existing_connection = None

        for connection in self.active_connections[project_id]:
            if connection["user_id"] == user_id:
                existing_connection = connection
                break

        if existing_connection:
            try:
                await existing_connection["websocket"].close(
                    code=1000
                )
            except Exception:
                pass

            self.active_connections[project_id].remove(
                existing_connection
            )

        self.active_connections[project_id].append(
            {
                "user_id": user_id,
                "websocket": websocket
            }
        )

    def disconnect(
        self,
        project_id: int,
        websocket: WebSocket
    ):
        if project_id not in self.active_connections:
            return

        self.active_connections[project_id] = [
            connection
            for connection in self.active_connections[project_id]
            if connection["websocket"] != websocket
        ]

        if not self.active_connections[project_id]:
            del self.active_connections[project_id]

    def get_online_users(
        self,
        project_id: int
    ):
        return [
            connection["user_id"]
            for connection in self.active_connections.get(
                project_id,
                []
            )
        ]

    async def broadcast(
        self,
        project_id: int,
        message: dict,
        sender: WebSocket = None
    ):
        connections = list(
            self.active_connections.get(
                project_id,
                []
            )
        )

        disconnected = []

        for connection in connections:

            websocket = connection["websocket"]

            if sender is not None and websocket == sender:
                continue

            try:

                await websocket.send_json(message)

            except Exception:

                disconnected.append(websocket)

        for websocket in disconnected:

            self.disconnect(
                project_id,
                websocket
            )

    # =========================================================
    # NOTIFICATION WEBSOCKET
    # =========================================================

    async def connect_notification(
        self,
        user_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if user_id not in self.notification_connections:
            self.notification_connections[user_id] = []

        self.notification_connections[user_id].append(
            websocket
        )

    def disconnect_notification(
        self,
        user_id: int,
        websocket: WebSocket
    ):
        if user_id not in self.notification_connections:
            return

        if websocket in self.notification_connections[user_id]:

            self.notification_connections[user_id].remove(
                websocket
            )

        if not self.notification_connections[user_id]:

            del self.notification_connections[user_id]

    async def send_notification(
        self,
        user_id: int,
        message: str
    ):
        connections = self.notification_connections.get(
            user_id,
            []
        )

        disconnected = []

        for websocket in connections:

            try:

                await websocket.send_json(
                    {
                        "type": "notification",
                        "message": message
                    }
                )

            except Exception:

                disconnected.append(websocket)

        for websocket in disconnected:

            self.disconnect_notification(
                user_id,
                websocket
            )


manager = ConnectionManager()