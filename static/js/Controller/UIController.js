export class UIController {
    constructor(viewController, grid, robots) {
        this.viewController = viewController;
        this.robots = robots;
        this.grid = grid;
        this.root = null;
        this.touchInitialDistance = null;
    }

    init() {
        this._createSidebar(this.viewController.getViews());

        this._createTimeline()

        this.viewController.onViewsChanged((views) => {
            this._createSidebar(views);
        });

        window.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.touchInitialDistance = Math.hypot(dx, dy);
            }
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && this.touchInitialDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDistance = Math.hypot(dx, dy);

                const zoomFactor = currentDistance / this.touchInitialDistance;
                viewController.zoomOverview(zoomFactor);

                this.touchInitialDistance = currentDistance; // reset for smooth zoom
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

        const header = document.createElement("h4");
        header.textContent = "Timeline";
        timeline.appendChild(header);

        // Timestamp input
        const timestampInput = document.createElement("input");
        timestampInput.type = "datetime-local"; // lets user pick date + time
        timestampInput.style.width = "60%";
        timestampInput.style.marginRight = "5px";

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
        secondsInput.style.width = "30%";
        secondsInput.style.marginRight = "5px";

        secondsInput.addEventListener("change", () => {
            const secValue = parseInt(secondsInput.value, 10);
            this.grid.setTimespan(secValue);
        });

        // Button to set timespan
        const divTimespan = document.createElement("djv");
        const setTimespanBtn = document.createElement("button");
        setTimespanBtn.textContent = "Set Timespan";
        setTimespanBtn.className = "btn btn-sm btn-outline-success";
        setTimespanBtn.addEventListener("click", () => {
            const tsValue = timestampInput.value;
            const secValue = parseInt(secondsInput.value, 10);
            if (!tsValue || !secValue) return;

            const timestamp = new Date(tsValue);
            this.grid.setTimespan(timestamp, secValue);
            this.robots.showPointInTime(timestamp);
        });

        divTimespan.appendChild(timestampInput);
        divTimespan.appendChild(secondsInput);
        timeline.appendChild(divTimespan);

        // --- Live button ---
        const divLive = document.createElement("div");
        divLive.style.marginBottom = "5px";

        const liveBtn = document.createElement("button");
        liveBtn.textContent = "Set Live";
        liveBtn.className = "btn btn-sm btn-outline-success";
        liveBtn.style.width = "100%";

        liveBtn.addEventListener("click", () => {
            timestampInput.value = "";
            this.grid.setToLive();
            this.robots.setToLive();
        });

        divLive.appendChild(liveBtn);
        timeline.appendChild(divLive);
    }

    _createSidebar(views) {
        if (!views) return;

        const sidebar = document.getElementById("robot-list") || document.createElement("div");
        sidebar.id = "robot-list";
        sidebar.className = "sidebar";
        sidebar.innerHTML = "";

        const header = document.createElement("h4");
        header.textContent = "Views";
        sidebar.appendChild(header);

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
            btn.className = "btn btn-sm btn-outline-primary";
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
        btn.className = "btn btn-sm btn-outline-primary";
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
