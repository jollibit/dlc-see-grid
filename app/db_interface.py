from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models import Robot, FastGrid
from app.database import SessionLocal
import zmq
import os

class DBInterface:
    def __init__(self):
        self.session_factory = SessionLocal

    # -----------------------------
    # Robot Interface
    # -----------------------------
    def add_robot(self, x, y, z, name=None, status=None, hall=None, dx=None, dy=None, dz=None, rx=None, ry=None, rz=None, timestamp=None, anchor=None):
        session: Session = self.session_factory()
        try:
            if timestamp is None:
                ts = datetime.now(timezone.utc)
            else:
                if timestamp.tzinfo is None:
                    raise ValueError("timestamp must be timezone-aware")

                ts = timestamp.astimezone(timezone.utc)

            robot = Robot(
                timestamp=ts,
                name=name, hall=hall, status=status,
                x=x, y=y, z=z,
                dx=dx, dy=dy, dz=dz,
                rx=rx, ry=ry, rz=rz,
                anchor=anchor,
            )

            session.add(robot)
            session.commit()
            session.refresh(robot)
            return robot
        finally:
            session.close()

    def update_robot(self, robot_id, status=None, x=None, y=None, z=None, dx=None, dy=None, dz=None, rx=None, ry=None, rz=None, timestamp=None, anchor=None):
        session: Session = self.session_factory()
        try:
            robot = session.query(Robot).filter(Robot.id == robot_id).first()
            if not robot:
                raise ValueError(f"Robot with id {robot_id} not found")

            if status is not None: robot.status = status
            if x is not None: robot.x = x
            if y is not None: robot.y = y
            if z is not None: robot.z = z
            if dx is not None: robot.dx = dx
            if dy is not None: robot.dy = dy
            if dz is not None: robot.dz = dz
            if rx is not None: robot.rx = rx
            if ry is not None: robot.ry = ry
            if rz is not None: robot.rz = rz
            if timestamp is not None: robot.timestamp = timestamp

            session.commit()
            session.refresh(robot)
            return robot
        finally:
            session.close()
    
    def get_latest_robot_by_name(self, name: str):
        session: Session = self.session_factory()
        try:
            return (
                session.query(Robot)
                .filter(Robot.name == name)
                .order_by(Robot.timestamp.desc())
                .first()
            )
        finally:
            session.close()
    
    # -----------------------------
    # FastGrid Interface
    # -----------------------------
    def add_fast_grid(self, hall, resolution_width, resolution_height, x, y, count, timestamp=None):
        session: Session = self.session_factory()
        try:
            if timestamp is None:
                ts = datetime.now(timezone.utc)
            else:
                if timestamp.tzinfo is None:
                    raise ValueError("timestamp must be timezone-aware")

                ts = timestamp.astimezone(timezone.utc)

            grid = FastGrid(
                timestamp=ts,
                hall=hall,
                resolution_width=resolution_width,
                resolution_height=resolution_height,
                x=x,
                y=y,
                count=count
            )
            session.add(grid)
            session.commit()
            session.refresh(grid)
            return grid
        finally:
            session.close()

def main(): 
    dbi = DBInterface()
    address = os.getenv("DBI_PULL", "tcp://0.0.0.0:5556")

    ctx = zmq.Context()

    sock = ctx.socket(zmq.PULL)
    sock.bind(address)

    print("dbi connected")

    while True: 
        msg = sock.recv_json()
        
        msg_type = msg['type']
        data = msg['data']
        if(msg_type == 'add_robot'): 
            dbi.add_robot(
                    data['x'],
                    data['y'],
                    data['z'],
                    data['name'],
                    data['status'],
                    data['hall'], 
                    data['dx'],
                    data['dy'],
                    data['dz'],
                    data['rx'],
                    data['ry'],
                    data['rz'],
                    datetime.fromisoformat(data['ts']),
                    data['anchor']
                )
        elif(msg_type == 'add_fast_grid'):
            dbi.add_fast_grid(
                    data['hall'],
                    data['resolution_width'],
                    data['resolution_height'],
                    data['x'],
                    data['y'],
                    data['count'],
                    datetime.fromisoformat(data['timestamp'])
                )

if __name__ == "__main__":
    main()
