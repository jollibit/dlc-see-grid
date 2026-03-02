from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.db_interface import DBInterface

router = APIRouter()
db = DBInterface()

robot_clients: list[WebSocket] = []

# -----------------------------
# Robot WebSocket
# -----------------------------
@router.websocket("/ws/robots/{name}/latest")
async def robot_ws_latest(websocket: WebSocket, name: str):
    await websocket.accept()
    db = DBInterface()

    last_timestamp = None

    try:
        while True:
            robot = db.get_latest_robot_by_name(name)
            if robot and robot.timestamp != last_timestamp:
                await websocket.send_json(robot.to_dict())
                last_timestamp = robot.timestamp

            await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        pass