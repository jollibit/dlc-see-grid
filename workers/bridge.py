import zmq
from workers.grid import Grid
import os

class config:
    MAX_X = 73
    MAX_Y = 43.5
    ANCHOR_X = 20
    ANCHOR_Y = 20
    ANCHOR_THETA = 90

def main():
    pull_address = os.getenv("BRIDGE_PULL", "tcp://127.0.0.1:5555")
    push_address = os.getenv("DBI_PUSH", "tcp://127.0.0.1:5556")

    ctx = zmq.Context()

    pull_sock = ctx.socket(zmq.PULL)
    pull_sock.bind(pull_address)

    push_sock = ctx.socket(zmq.PUSH)
    push_sock.connect(push_address)


    heatmap = Grid(
        hall="main",
        max_x=config.MAX_X,
        max_y=config.MAX_Y,
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

            heatmap.add_position(data['x'], data['z'], config.ANCHOR_X, config.ANCHOR_Y, config.ANCHOR_THETA)

            if heatmap.should_flush():
                cumulative_grid = heatmap.flush()
                print("Stored Heatmap Snapshot")

if __name__ == "__main__":
    main()
