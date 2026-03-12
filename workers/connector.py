import zmq
import json
import os
import logging
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

MQTT_BROKER   = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT     = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPICS   = os.getenv("MQTT_TOPIC", "robot")
MQTT_USER     = os.getenv("MQTT_USER", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "zmq_connector")

ZMQ_PUSH_ADDR = os.getenv("BRIDGE_PUSH", "tcp://127.0.0.1:5555")

HALL = "main"
ANCHOR = os.getenv("ANCHOR", "CORNER")

# Delimiter for multiple topics in MQTT_TOPIC env variable
TOPIC_DELIMITER = "|"

# map axisType/axisNo to name
AXIS_MAP = {
    1: "x",
    2: "y",
    3: "angle"
}

# store temporary data until we have all axes
robot_buffers = {}


def build_combined_envelope(robot_name, axes_data):
    """
    Build a single envelope from the collected axes data.
    """
    x = axes_data.get("x", 0.0)
    z = axes_data.get("y", 0.0)
    angle = axes_data.get("angle", 0.0)

    data = {
        "x": x,
        "y": 0,
        "z": z,
        "name": robot_name,
        "status": "ok",
        "hall": HALL,
        "dx": 0,
        "dy": 0,
        "dz": 0,
        "angle": angle,
        "ts": datetime.now(timezone.utc).isoformat(),
        "anchor": ANCHOR
    }

    envelope = {
        "type": "robot",
        "ts": datetime.now(timezone.utc).isoformat(),
        "data": data
    }
    return envelope


class MQTTToZMQConnector:
    def __init__(self):
        self._ctx  = zmq.Context()
        self._sock = self._ctx.socket(zmq.PUSH)
        self._sock.connect(ZMQ_PUSH_ADDR)
        log.info("ZMQ PUSH socket connected to %s", ZMQ_PUSH_ADDR)

        self._client = mqtt.Client(client_id=MQTT_CLIENT_ID, clean_session=True)

        if MQTT_USER:
            self._client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

        self._client.on_connect    = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message    = self._on_message

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            log.info("Connected to MQTT broker %s:%s", MQTT_BROKER, MQTT_PORT)
            topics = MQTT_TOPICS.split(TOPIC_DELIMITER)
            for t in topics:
                t = t.strip()
                client.subscribe(t)
                log.info("Subscribed to topic: %s", t)
        else:
            log.error("MQTT connection failed with code %s", rc)

    def _on_disconnect(self, client, userdata, rc):
        if rc != 0:
            log.warning("Unexpected MQTT disconnect (rc=%s). Will auto-reconnect.", rc)
        else:
            log.info("MQTT disconnected cleanly.")

    def _on_message(self, client, userdata, msg):
        """Collect axis messages and send full robot envelope when ready."""
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            robot_name = msg.topic.split("/")[-1]

            axis_name = payload.get("name", "").upper()
            if axis_name.startswith("X_"):
                axis_type = "x"
            elif axis_name.startswith("Y_"):
                axis_type = "y"
            elif axis_name.startswith("A_"):
                axis_type = "angle"
            else:
                log.warning("Unknown axis name '%s' in message from %s", axis_name, msg.topic)
                return

            value = payload["position"]["value"]

            if robot_name not in robot_buffers:
                robot_buffers[robot_name] = {}

            robot_buffers[robot_name][axis_type] = value

            axes_data = robot_buffers[robot_name]
            if all(k in axes_data for k in ["x", "y", "angle"]):
                envelope = build_combined_envelope(robot_name, axes_data)
                self._sock.send_json(envelope)
                log.info(
                    "Forwarded combined | robot=%-15s | type=%s",
                    robot_name,
                    envelope.get("type", "?")
                )

                robot_buffers[robot_name] = {}

        except Exception as exc:
            log.exception("Failed to process message: %s", exc)

    def run(self):
        log.info("Connecting to MQTT broker %s:%s …", MQTT_BROKER, MQTT_PORT)
        self._client.reconnect_delay_set(min_delay=1, max_delay=30)
        self._client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)

        try:
            self._client.loop_forever()
        except KeyboardInterrupt:
            log.info("Interrupted – shutting down.")
        finally:
            self._client.disconnect()
            self._sock.close()
            self._ctx.term()
            log.info("Clean shutdown complete.")


if __name__ == "__main__":
    MQTTToZMQConnector().run()