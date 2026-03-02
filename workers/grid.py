from collections import defaultdict
import time
from datetime import datetime, timezone
import math

class Grid:
    def __init__(self, hall, max_x, max_y, resolution_x, resolution_y, flush_interval=60, push_sock=None):
        """
        hall: str - identifier for the current hall
        resolution_x / resolution_y: int - number of cells in x and y
        flush_interval: seconds between automatic flushes
        db: DBInterface instance or None
        """
        self.hall = hall
        self.max_x = max_x
        self.max_y = max_y
        self.resolution_x = resolution_x
        self.resolution_y = resolution_y
        self.cell_x = self.max_x/self.resolution_x
        self.cell_height = self.max_y/self.resolution_y
        self.flush_interval = flush_interval
        self.push_sock = push_sock

        self.grid = defaultdict(int)  # keys: (x, y) → cumulative count since last flush
        self.last_flush = time.time()

    def add_position(self, x, y, ox, oy, oth):
        """
        Add a robot position to the heatmap.
        x, y: world coordinates mapped to cell indices
        ox, oy: origin coordinates -> how far away is robot anchor
        oth: origin theta rotation 
        """


        othr = math.radians(oth)
        
        cos_t = math.cos(othr)
        sin_t = math.sin(othr)
        
        rx = x * cos_t + y * sin_t
        ry = -x * sin_t + y * cos_t

        dx = rx + ox
        dy = ry + oy
        
        cell_x = int(dx/(self.max_x) * self.resolution_x)
        cell_y = int(dy/(self.max_y) * self.resolution_y)
        
        # clamp to resolution bounds
        cell_x = max(0, min(cell_x, self.resolution_x - 1))
        cell_y = max(0, min(cell_y, self.resolution_y - 1))
        
        self.grid[(cell_x, cell_y)] += 1

    def should_flush(self):
        return (time.time() - self.last_flush) >= self.flush_interval
    
    def flush(self):
        if self.push_sock:  
            for (x, y), count in self.grid.items():

                data = {
                    'hall' : self.hall,
                    'resolution_width' : self.resolution_x,
                    'resolution_height' : self.resolution_y,
                    'x' : x,
                    'y' : y,
                    'count' : count,
                    'timestamp' : datetime.now(timezone.utc).isoformat()
                }

                json = {
                    'type' : 'add_fast_grid',
                    'data' : data
                }

                self.push_sock.send_json(json)

                

        self.grid.clear()
        self.last_flush = time.time()

        return dict(self.grid)