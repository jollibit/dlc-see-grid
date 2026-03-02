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

MQTT_BROKER   = os.getenv("MQTT_BROKER",   "localhost")
MQTT_PORT     = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC    = os.getenv("MQTT_TOPIC",    "robots/#")   # '#' = wildcard
MQTT_USER     = os.getenv("MQTT_USER",     "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "zmq_connector")

ZMQ_PUSH_ADDR = os.getenv("BRIDGE_PUSH",  "tcp://127.0.0.1:5555")

# How to interpret the MQTT payload.
# "raw"  → forward the raw bytes as-is inside the envelope
# "json" → parse JSON and merge it into the envelope
PAYLOAD_MODE  = os.getenv("PAYLOAD_MODE", "json")

HALL = "main"
ANCHOR = os.getenv("ANCHOR", "CORNER")


def build_envelope(topic: str, payload_raw: bytes) -> dict:
    """
    Wrap an MQTT message in the same envelope the rest of your pipeline
    already expects.
    """
    base = {
        "type": "robot",
        "mqtt_topic": topic,
        "hall":   HALL,
        "anchor": ANCHOR,
        "ts":     datetime.now(timezone.utc).isoformat(),
    }

    if PAYLOAD_MODE == "json":
        try:
            parsed = json.loads(payload_raw.decode("utf-8"))
            # If the payload already contains 'data', keep the structure
            if "data" in parsed:
                base.update(parsed)
            else:
                base["data"] = parsed
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            log.warning("Could not parse JSON payload: %s – forwarding raw", exc)
            base["data"] = payload_raw.decode("utf-8", errors="replace")
    else:
        # raw mode
        base["data"] = payload_raw.decode("utf-8", errors="replace")

    return base


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
            client.subscribe(MQTT_TOPIC)
            log.info("Subscribed to topic: %s", MQTT_TOPIC)
        else:
            log.error("MQTT connection failed with code %s", rc)

    def _on_disconnect(self, client, userdata, rc):
        if rc != 0:
            log.warning("Unexpected MQTT disconnect (rc=%s). Will auto-reconnect.", rc)
        else:
            log.info("MQTT disconnected cleanly.")

    def _on_message(self, client, userdata, msg):
        """Called for every message that arrives on the subscribed topic."""
        try:
            envelope = build_envelope(msg.topic, msg.payload)
            self._sock.send_json(envelope)
            log.info(
                "Forwarded | topic=%-30s | type=%s",
                msg.topic, envelope.get("type", "?")
            )
        except Exception as exc:
            log.exception("Failed to forward message: %s", exc)

    def run(self):
        log.info("Connecting to MQTT broker %s:%s …", MQTT_BROKER, MQTT_PORT)
        # reconnect_delay_set: wait 1 s before first retry, cap at 30 s
        self._client.reconnect_delay_set(min_delay=1, max_delay=30)
        self._client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)

        try:
            # loop_forever handles reconnects automatically
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