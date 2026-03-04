import zmq
import time
from datetime import datetime, timezone
import random
import os

MIN_X = -20
MAX_X = 23.5

Y = 0

MIN_Z = -20
MAX_Z = 53

ANCHOR = "CORNER"


robot_names = ["r_001", "r_002", "r_003", "r_004", "r_005"]
hall = "main"

# Initialize robots with state timers
robots = {}
for name in robot_names:
    x, z = random.uniform(MIN_X, MAX_X), random.uniform(MIN_Z, MAX_Z)
    state = {
        'x': x,
        'y': Y,
        'z': z,
        'status': 'ok',
        'state_timer': 0  # countdown until next status change
    }
    robots[name] = state
    print(f"Spawned robot {name} at x={x:.2f}, z={z:.2f}")


def update_robot(robot_state):
    # Check if robot is in warning or error and has timer
    if robot_state['state_timer'] > 0:
        robot_state['state_timer'] -= 1
        # If error, robot does not move
        if robot_state['status'] == 'error':
            return 0, 0, 0
        # If warning, robot moves slowly
        elif robot_state['status'] == 'warning':
            dx, dz = random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.2)
            x = max(MIN_X, min(MAX_X, robot_state['x'] + dx))
            z = max(MIN_Z, min(MAX_Z, robot_state['z'] + dz))
            robot_state['x'], robot_state['z'] = x, z
            return dx, 0, dz
    else:
        # Random chance to enter warning or error
        chance = random.random()
        if chance < 0.05:
            robot_state['status'] = 'warning'
            robot_state['state_timer'] = random.randint(3, 6)  # lasts 3-6 seconds
        elif chance < 0.08:
            robot_state['status'] = 'error'
            robot_state['state_timer'] = random.randint(2, 5)  # lasts 2-5 seconds
        else:
            robot_state['status'] = 'ok'

    # Normal movement for 'ok'
    dx, dz = random.uniform(-1, 1), random.uniform(-1, 1)
    x = max(MIN_X, min(MAX_X, robot_state['x'] + dx))
    z = max(MIN_Z, min(MAX_Z, robot_state['z'] + dz))
    robot_state['x'], robot_state['z'] = x, z
    return dx, 0, dz


def main():
    address = os.getenv("BRIDGE_PUSH", "tcp://127.0.0.1:5555")

    ctx = zmq.Context()

    sock = ctx.socket(zmq.PUSH)
    sock.connect(address)

    while True:
        for name, state in robots.items():
            dx, dy, dz = update_robot(state)
            data = {
                'x': state['x'],
                'y': state['y'],
                'z': state['z'],
                'name': name,
                'status': state['status'],
                'hall': hall,
                'dx': dx,
                'dy': dy,
                'dz': dz,
                'rx': 0,
                'ry': 0,
                'rz': 0,
                'ts': datetime.now(timezone.utc).isoformat(),
                'anchor': ANCHOR
            }

            msg = {
                'type': 'robot',
                'data': data
            }

            sock.send_json(msg)

            print(
                f"Robot {name} | status={state['status']} "
                f"x={state['x']:.2f}, z={state['z']:.2f}, "
                f"dx={dx:.2f}, dz={dz:.2f}, timer={state['state_timer']}"
            )
        time.sleep(1)


if __name__ == "__main__":
    main()
