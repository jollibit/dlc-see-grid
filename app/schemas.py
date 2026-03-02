from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# -----------------------------
# Robot schemas
# -----------------------------
class RobotBase(BaseModel):
    timestamp: Optional[datetime] = None
    name: str
    status: str
    hall: str
    x: float
    y: float
    z: float
    dx: Optional[float] = None
    dy: Optional[float] = None
    dz: Optional[float] = None
    anchor: str

class RobotCreate(RobotBase):
    pass

class RobotOut(RobotBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class RobotClosestOut(BaseModel):
    name: str
    timestamp: Optional[datetime] = None
    status: Optional[str] = None
    hall: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None
    dx: Optional[float] = None
    dy: Optional[float] = None
    dz: Optional[float] = None
    anchor: Optional[str] = None
    id: Optional[int] = None

# -----------------------------
# FastGrid schemas
# -----------------------------
class FastGridBase(BaseModel):
    timestamp: Optional[datetime] = None
    hall: str
    resolution_width: int
    resolution_height: int
    x: int
    y: int
    count: int

class FastGridCreate(FastGridBase):
    pass

class FastGridOut(FastGridBase):
    id: int

    model_config = ConfigDict(from_attributes=True)