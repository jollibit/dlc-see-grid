# DLC-SEE Grid

A simple guide to get started with the DLC-SEE GRID web service.

---

## Getting Started

Follow these steps to quickly set up and run the service on your machine.

### Manual
If you want to run it manually follow these steps:

#### 0. Quick Launch

Just execute the setup file.

Windows:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
./setup.ps1
```

Linux:
```bash
./setup.sh
```

#### 1. Run Environment on Windows

Open PowerShell and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\activate.ps1
```

---

#### 2. Install Requirements

```powershell
python -m pip install -r requirements.txt                    
```

#### 3. Run the Web-Service

```bash
uvicorn app.main:app --reload --port 8000
```

This will start the server on `http://127.0.0.1:8000`.

---

#### 4. Run the Bridge

In a new Shell:

```bash
python -m workers.bridge
```

---

#### 5. Run the Worker Module

In this case, we run the simulator. You can replace it with your custom worker module.

```bash
python -m workers.simulator         
```
---

#### 5. Run the Worker Module

In this case, we run the simulator. You can replace it with your custom worker module.

```bash
python -m app.db_interface.py         
```
---

### Docker
If you want to run it via Docker, follow these steps: 

#### 1. Run Docker Compose

```bash
docker compose up
```

This will start all containers and run the service.

```bash
docker compose up --build
```

This will start all containers and run the service with the simulator.

```bash
docker compose --profile simulator  up --build
```

This will start all containers and run the service with the connector.

```bash
docker compose --profile connector  up --build
```

This will force a rebuild of all containers.

```bash
docker compose stop
```

This will stop all containers.

```bash
docker compose restart
```

This will restart all containers.