# DLC-SEE Grid

A simple guide to get started with the DLC-SEE GRID web service.

---

## Getting Started

Follow these steps to quickly set up and run the service on your machine.

### Manual
If you want to run it manually follow these steps:

#### Local Deployment

Just execute the setup file.

Windows:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
./run.ps1
```

You can configure variables like this
```
./run.ps1 -PROFILE connector
```

Linux:
```bash
./run.sh
```

Running it without parameter will default to running it with a simple simulator. That is sufficient for testing it. 
If you want to connect it to your MQTT Broker, use -PROFILE connector and configure the MQTT variables. Keep in mind that that connector needs to be adjusted for your purposes.

Full list or variables and their default values:

```
    DBI_PULL       = "tcp://0.0.0.0:5556"
    BRIDGE_PULL    = "tcp://0.0.0.0:5555"
    BRIDGE_PUSH    = "tcp://localhost:5555"
    MQTT_BROKER    = "localhost"
    MQTT_PORT      = "1883"
    MQTT_TOPIC     = "robots/#"
    MQTT_USER      = ""
    MQTT_PASSWORD  = ""
    PAYLOAD_MODE   = "json"
    ANCHOR         = "CORNER"
    PROFILE        = "simulator"
```

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