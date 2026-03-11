import zmq
from workers.grid import Grid
import os

def main():
    pull_address = os.getenv("BRIDGE_PULL", "tcp://127.0.0.1:5555")
    push_address = os.getenv("DBI_PUSH", "tcp://127.0.0.1:5556")

    ctx = zmq.Context()

    pull_sock = ctx.socket(zmq.PULL)
    pull_sock.bind(pull_address)

    push_sock = ctx.socket(zmq.PUSH)
    push_sock.connect(push_address)

    MAX_X = float(os.getenv("MAX_X", 0))
    MAX_Y = float(os.getenv("MAX_Y", 0))
    ANCHOR_X = float(os.getenv("ANCHOR_X", 0))
    ANCHOR_Y = float(os.getenv("ANCHOR_Y", 0))
    ANCHOR_THETA = float(os.getenv("ANCHOR_THETA", 0))

    heatmap = Grid(
        hall="main",
        max_x=MAX_X,
        max_y=MAX_Y,
        resolution_x=512,
        resolution_y=512,
        flush_interval=5,
        push_sock=push_sock
    )

    print("Bridge running. Waiting for data...")

    while True:
        msg = pull_sock.recv_json()

        if msg['type'] is None: 
            continue
        
        if msg['type'] == 'robot':
            data = msg['data']

            json = {
                'type' : 'add_robot',
                'data' : data
            }

            push_sock.send_json(json)

            heatmap.add_position(data['x'], data['z'], ANCHOR_X, ANCHOR_Y, ANCHOR_THETA)

            if heatmap.should_flush():
                cumulative_grid = heatmap.flush()
                print("Stored Heatmap Snapshot")

if __name__ == "__main__":
    main()
