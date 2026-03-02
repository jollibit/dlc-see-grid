export class NetworkSystem {
  constructor() {
    this.robotHandlers = new Map();
    this.robotSockets  = new Map();
  }

  /* ---------- ROBOTS ---------- */

  async initRobots() {
    const res = await fetch("/robots/names");
    const robotIds = await res.json();

    robotIds.forEach(id => this._connectRobot(id));

    return robotIds;
  }

  _connectRobot(robotId) {
    if (this.robotSockets.has(robotId)) return;

    const ws = new WebSocket(`/ws/robots/${robotId}/latest`);

    ws.onmessage = e => {
      const data = JSON.parse(e.data);
      const handlers = this.robotHandlers.get(robotId);
      if (handlers) handlers.forEach(cb => cb(data));
    };

    this.robotSockets.set(robotId, ws);
  }

  onRobot(robotId, cb) {
    if (!this.robotHandlers.has(robotId)) {
      this.robotHandlers.set(robotId, []);
      this._connectRobot(robotId);
    }
    this.robotHandlers.get(robotId).push(cb);
  }
}
