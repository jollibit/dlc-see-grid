from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from datetime import datetime, timedelta, timezone

import app.models as models
import app.schemas as schemas
from app.database import SessionLocal, engine, Base

from app.ws import router as ws_router


# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DLC-SEE Grid")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(ws_router)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

        # Routes

@app.get("/")
def root():
    return {"message": "Visit /static/index.html to see the title page."}

# -----------------------------
# Robot API
# -----------------------------
@app.get("/robots", response_model=list[schemas.RobotOut])
def read_items(db: Session = Depends(get_db)):
    return db.query(models.Robot).all()

@app.get("/robots/names", response_model=list[str])
def get_robot_names(db: Session = Depends(get_db)):
    rows = db.query(distinct(models.Robot.name)).all()
    return [r[0] for r in rows]

@app.get("/robots/closest", response_model=schemas.RobotClosestOut)
def read_closest_robot(
    name: str = Query(..., description="Robot name"),
    timestamp: datetime = Query(..., description="Anchor timestamp"),
    db: Session = Depends(get_db),
):
    lower_bound = timestamp - timedelta(minutes=5)

    robot = (
        db.query(models.Robot)
        .filter(
            models.Robot.name == name,
            models.Robot.timestamp >= lower_bound,
            models.Robot.timestamp <= timestamp,
        )
        .order_by(models.Robot.timestamp.desc())
        .first()
    )

    if robot is None:
        raise HTTPException(
            status_code=404,
            detail="No robot entry found before given timestamp",
        )

    return robot

@app.post("/robots", response_model=schemas.RobotOut)
def create_item(item: schemas.RobotCreate, db: Session = Depends(get_db)):
    db_item = models.Robot(timestamp=item.timestamp, name=item.name, status=item.status, hall=item.hall, x=item.x, y=item.y, z=item.z, dx=item.dx, dy=item.dy, dz=item.dz, angle=item.angle, anchor=item.anchor)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/robots")
def clear_items(db: Session = Depends(get_db)):
    deleted = db.query(models.Robot).delete()
    db.commit()
    return {"message": f"Deleted {deleted} item(s) from database."}

@app.put("/robots/{item_id}", response_model=schemas.RobotOut)
def update_item(item_id: int, updated_item: schemas.RobotCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.Robot).filter(models.Robot.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.timestamp = updated_item.timestamp 
    db_item.name = updated_item.name 
    db_item.status = updated_item.status
    db_item.hall = updated_item.hall 
    db_item.x = updated_item.x
    db_item.y = updated_item.y
    db_item.z = updated_item.z
    db_item.dx = updated_item.dx 
    db_item.dy = updated_item.dy 
    db_item.dz = updated_item.dz
    db_item.anchor = updated_item.anchor
    db.commit()
    db.refresh(db_item)
    return db_item

# -----------------------------
# FastGrid API
# -----------------------------
@app.get("/fastgrid", response_model=list[schemas.FastGridOut])
def read_items(
    hall: str | None = Query(None, description="Hall/area ID"),
    timestamp: datetime | None = Query(None, description="Anchor timestamp"),
    span_seconds: int | None = Query(None, description="Window length in seconds"),
    db: Session = Depends(get_db)
):
    query = db.query(models.FastGrid)

    if hall is not None:
        query = query.filter(models.FastGrid.hall == hall)

    if timestamp is not None and span_seconds is not None:
        from_ts = timestamp - timedelta(seconds=span_seconds)
        to_ts = timestamp
        query = query.filter(models.FastGrid.timestamp >= from_ts,
                             models.FastGrid.timestamp <= to_ts)

    return query.all()

@app.post("/fastgrid", response_model=schemas.FastGridOut)
def create_item(item: schemas.FastGridCreate, db: Session = Depends(get_db)):
    db_item = models.FastGrid(timestamp=item.timestamp, hall=item.hall, resolution_width=item.resolution_width, resolution_height=item.resolution_height, x=item.x, y=item.y, grid_values=item.count)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/fastgrid/latest", response_model=list[schemas.FastGridOut])
def read_latest(
    hall: str | None = Query(None, description="Hall/area ID"),
    span_seconds: int | None = Query(60, description="Window length in seconds (default 60s)"),
    db: Session = Depends(get_db)
):
    timestamp = datetime.utcnow()  # treat "now" as anchor
    from_ts = timestamp - timedelta(seconds=span_seconds)
    to_ts = timestamp

    query = db.query(models.FastGrid).filter(
        models.FastGrid.timestamp >= from_ts,
        models.FastGrid.timestamp <= to_ts
    )

    if hall is not None:
        query = query.filter(models.FastGrid.hall == hall)

    return query.all()