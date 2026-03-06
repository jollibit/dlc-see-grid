export class UIController {
    constructor(viewController, grid, robots) {
        this.viewController = viewController;
        this.robots = robots;
        this.grid = grid;
        this.root = null;
        this.touchInitialDistance = null;
         this.touchStartX = null;
        this.touchStartY = null;
    }

    init() {
        this._createSidebar(this.viewController.getViews());

        this._createTimeline()

        this.viewController.onViewsChanged((views) => {
            this._createSidebar(views);
        });

        window.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.touchInitialDistance = Math.hypot(dx, dy);
            }
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1 && this.touchStartX != null && this.touchStartY != null) {
                const dx = e.touches[0].clientX - this.touchStartX;
                const dy = e.touches[0].clientY - this.touchStartY;
                
                const moveSpeed = 2;

                const moveX = dx * 0.01 * moveSpeed;
                const moveY = dy * 0.01 * moveSpeed;

                this.viewController.moveOverview(-moveX, moveY, 0); 

                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && this.touchInitialDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDistance = Math.hypot(dx, dy);
                const delta = (currentDistance - this.touchInitialDistance) / this.touchInitialDistance;
                const zoomSpeed = 2;
                const zoomFactor = 1 - delta * zoomSpeed;

                const clampedFactor = Math.min(Math.max(zoomFactor, 0.5), 2);
                this.viewController.zoomOverview(clampedFactor);

                this.touchInitialDistance = currentDistance;
            }
        });

        window.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) this.touchInitialDistance = null;
        });

        window.addEventListener("keydown", (event) => {
            const movement = BABYLON.Vector3.Zero();
            switch (event.code){
                case "Space": 
                    this.viewController.rotateOverviewCamera();
                    break;

                case "KeyW":
                case "ArrowUp":
                    movement.addInPlace(new BABYLON.Vector3(0, 0.5, 0));
                    break;

                case "KeyS":
                case "ArrowDown": 
                    movement.addInPlace(new BABYLON.Vector3(0, -0.5, 0));
                    break;

                case "KeyA": 
                case "ArrowLeft": 
                    movement.addInPlace(new BABYLON.Vector3(-0.5, 0, 0));
                    break;

                case "KeyD":
                case "ArrowRight":
                    movement.addInPlace(new BABYLON.Vector3(0.5, 0, 0));
                    break;
            }
            
            this.viewController.moveOverview(movement.x, movement.y, movement.z);

        });

        window.addEventListener("wheel", (event) => {
            this.viewController.addToFollowHeight(event.deltaY * 0.005);
            this.viewController.zoomOverview(event.deltaY > 0 ? 1.1 : 0.9);
        });
    }

    _createTimeline(){
        const timeline = document.getElementById("timeline") || document.createElement("div");
        timeline.id = "timeline";
        timeline.className = "timeline";
        timeline.innerHTML = "";

        // Timestamp input
        const timestampInput = document.createElement("input");
        timestampInput.type = "datetime-local";
        timestampInput.style.width = "180px";   // fixed width
        timestampInput.style.height = "35px";   // readable height
        timestampInput.style.marginLeft = "5px";

        timestampInput.addEventListener("change", () => {
            const tsValue = timestampInput.value;
            const timestamp = new Date(tsValue);
            this.grid.setTimestamp(timestamp);
            this.robots.showPointInTime(timestamp);
        });

        // Seconds input
        const secondsInput = document.createElement("input");
        secondsInput.type = "number";
        secondsInput.min = "1";
        secondsInput.value = "60"; // default
        secondsInput.style.width = "80px";      // smaller input
        secondsInput.style.height = "35px";
        secondsInput.style.marginLeft = "5px";

        secondsInput.addEventListener("change", () => {
            const secValue = parseInt(secondsInput.value, 10);
            this.grid.setTimespan(secValue);
        });

        const liveBtn = document.createElement("button");
        liveBtn.textContent = "Live";
        liveBtn.className = "btn btn-sm btn-success";
        liveBtn.style.width = "90px";           // wide enough for text
        liveBtn.style.height = "35px";
        liveBtn.style.marginLeft = "5px";

        liveBtn.addEventListener("click", () => {
            timestampInput.value = "";
            this.grid.setToLive();
            this.robots.setToLive();
        });

        const divTimespan = document.createElement("div");

        divTimespan.appendChild(timestampInput);
        divTimespan.appendChild(secondsInput);
        divTimespan.appendChild(liveBtn);
        timeline.appendChild(divTimespan);

    }

    _createSidebar(views) {
        if (!views) return;

        const sidebar = document.getElementById("robot-list") || document.createElement("div");
        sidebar.id = "robot-list";
        sidebar.className = "sidebar";
        sidebar.innerHTML = "";

        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.padding = "0";
        ul.style.margin = "0";

        const buttons = [];

        views.forEach(viewName => {
            const li = document.createElement("li");
            li.style.marginBottom = "5px";

            const btn = document.createElement("button");
            btn.textContent = viewName;
            btn.className = "btn btn-sm btn-primary";
            btn.style.width = "100%";

            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.viewController.switchView(viewName);
            });

            li.appendChild(btn);
            ul.appendChild(li);

            buttons.push(btn);
        });

        const li = document.createElement("li");
        li.style.marginBottom = "5px";

        const btn = document.createElement("button");
        btn.textContent = "Toggle Heatmap";
        btn.className = "btn btn-sm btn-warning";
        btn.style.width = "100%";

        btn.addEventListener("click", () => {
            this.grid.toggleGrid();
        });

        li.appendChild(btn);
        ul.appendChild(li);

        sidebar.appendChild(ul);

        if (!document.getElementById("robot-list")) {
            document.body.appendChild(sidebar);
        }

        const liTimespan = document.createElement("li");
        liTimespan.style.marginBottom = "5px";
    }

    dispose() {
    }
}
