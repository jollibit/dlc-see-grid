export class ViewController {
    constructor(cameraSystem, robotSystem) {
        this.cameraSystem = cameraSystem;
        this.robotSystem = robotSystem;
        this.views = ["Overview"]
        this.view = "Overview";
        this.isRobotView = false;

        this.listeners = [];
    }

    init() {
        this.views = ["Overview", ...this.robotSystem.getRobotIds()];

        this.robotSystem.onRobotsChanged((robotIds) => {
            this.views = ["Overview", ...robotIds];
            this._emitViewsChanged();
        });
    }

    onViewsChanged(callback) {
        this.listeners.push(callback);
    }

    _emitViewsChanged() {
        const ids = this.views;
        this.listeners.forEach(cb => cb(ids));
    }

    getViews(){
        return this.views;
    }

    switchView(view){
        if(!this.views.includes(view)) return;
        if(view == "Overview") this.cameraSystem.showOverview();
        else {
            const robotMesh = this.robotSystem.getRobotMesh(view);
            if (robotMesh) {
                this.cameraSystem.followRobot(robotMesh);
            }
        }

        this.view = view;
    }

    addToFollowHeight(value){
        if(this.view == "Overview") return;
        this.cameraSystem.addToFollowHeight(value);
    }

    moveOverview(dx, dy, dz){
        if(this.view != "Overview") return;
        this.cameraSystem.moveOverviewCamera(dx, dy, dz);
    }

    zoomOverview(factor){
        if(this.view != "Overview") return;
        this.cameraSystem.zoomOverview(factor);
    }

    rotateOverviewCamera(){
        if(this.view == "Overview") this.cameraSystem.rotateIsoCameraRight90();
    }
}