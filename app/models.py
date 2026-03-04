from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base

class Robot(Base):
    __tablename__ = "robots"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=True)

    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    hall = Column(String, nullable=False)

    # Position
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float, nullable=False)

    # Movement vector (velocity or direction)
    dx = Column(Float, nullable=True)
    dy = Column(Float, nullable=True)
    dz = Column(Float, nullable=True)

    # Rotation
    rx = Column(Float, nullable=True)
    ry = Column(Float, nullable=True)
    rz = Column(Float, nullable=True)

    # Anchor Reference
    anchor = Column(String, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "name": self.name,
            "status": self.status,
            "hall": self.hall,
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "dx": self.dx,
            "dy": self.dy,
            "dz": self.dz,
            "rx": self.rx,
            "ry": self.ry,
            "rz": self.rz,
            "anchor": self.anchor
        }

class FastGrid(Base):
    __tablename__ = "fastGrids"

    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=True)

    hall = Column(String, nullable=False)

    resolution_width = Column(Integer, nullable=False)
    resolution_height = Column(Integer, nullable=False)

    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)  # flattened list

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "hall": self.hall,
            "resolution_width": self.resolution_width,
            "resolution_height": self.resolution_height,
            "x": self.x,
            "y": self.y,
            "count": self.count,
        }