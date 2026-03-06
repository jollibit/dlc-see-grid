export class CameraSystem {
    constructor(scene, canvas, engine) {
        this.scene = scene;
        this.canvas = canvas;
        this.engine = engine;

        this.overviewCamera = null;
        this.followCamera = null;

        this.overviewDefaultDistance = 20;
        this.overviewAspect;

        this.followTarget = null;
        this.followHeight = 7.5;
        this.followMinHeight = 3;
        this.followMaxHeight = 15;

        this.isOverview = true;
    }

    init() {
        this.overviewCamera = new BABYLON.ArcRotateCamera(
            "isoCamera",
            BABYLON.Tools.ToRadians(45),      // alpha
            BABYLON.Tools.ToRadians(35.264),  // beta (true iso angle)
            50,                               // radius
            BABYLON.Vector3.Zero(),
            this.scene
        );

        this.overviewCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        this.overviewAspect = this.engine.getRenderWidth() / this.engine.getRenderHeight();

        this.overviewCamera.orthoLeft   = -this.overviewDefaultDistance * this.overviewAspect;
        this.overviewCamera.orthoRight  = this.overviewDefaultDistance * this.overviewAspect;
        this.overviewCamera.orthoTop    = this.overviewDefaultDistance;
        this.overviewCamera.orthoBottom = -this.overviewDefaultDistance;

        this.overviewCamera.rotation.x = Math.PI/8;

        this.overviewCamera.lowerAlphaLimit = this.overviewCamera.upperAlphaLimit = this.overviewCamera.alpha;
        this.overviewCamera.lowerBetaLimit  = this.overviewCamera.upperBetaLimit  = this.overviewCamera.beta;

        this.overviewCamera.lowerRadiusLimit = this.overviewCamera.upperRadiusLimit = this.overviewCamera.radius;

        this.overviewCamera.attachControl(this.canvas, false);

        this.followCamera = new BABYLON.UniversalCamera(
            "followCam",
            new BABYLON.Vector3(0, 5, -10),
            this.scene
        );

        this.followCamera.minZ = 0.01;
        this.followCamera.maxZ = 1000

        this.scene.activeCamera = this.overviewCamera;
    }

    followRobot(robotMesh) {
        this._detach();
        this.followTarget = robotMesh;
        this.scene.activeCamera = this.followCamera;
        this.followCamera.attachControl(this.canvas, true);
    }

    showOverview() {
        this._detach();
        this.followTarget = null;
        this.scene.activeCamera = this.overviewCamera;
        this.overviewCamera.attachControl(this.canvas, true);
    }

    update(dt) {
        if (!this.followTarget) return;

        const targetPos = this.followTarget.absolutePosition;

        const desiredPos = new BABYLON.Vector3(
            targetPos.x,
            targetPos.y + this.followHeight,
            targetPos.z
        );

       this.followCamera.position.copyFrom(desiredPos);

        this.followCamera.setTarget(targetPos);
    }

    addToFollowHeight(value){
        this.followHeight = Math.max(Math.min(this.followHeight + value, this.followMaxHeight), this.followMinHeight);
    }

    rotateIsoCameraRight90() {
        if (!this.overviewCamera || !(this.overviewCamera instanceof BABYLON.ArcRotateCamera)) return;

        const ISO_BETA = BABYLON.Tools.ToRadians(35.264);
        const ISO_RADIUS = 20;

        this.overviewCamera.beta = ISO_BETA;
        this.overviewCamera.radius = ISO_RADIUS;

        const diagonalAlphas = [
            BABYLON.Tools.ToRadians(45),
            BABYLON.Tools.ToRadians(135),
            BABYLON.Tools.ToRadians(225),
            BABYLON.Tools.ToRadians(315)
        ];

        let closestIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < diagonalAlphas.length; i++) {
            let diff = Math.abs(this.overviewCamera.alpha - diagonalAlphas[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        const nextIndex = (closestIndex + 1) % diagonalAlphas.length;
        this.overviewCamera.alpha = diagonalAlphas[nextIndex];

        this.overviewCamera.lowerAlphaLimit = this.overviewCamera.upperAlphaLimit = this.overviewCamera.alpha;

        this.overviewCamera.setTarget(BABYLON.Vector3.Zero());

        this.overviewCamera.orthoLeft   = -this.overviewDefaultDistance * this.overviewAspect;
        this.overviewCamera.orthoRight  = this.overviewDefaultDistance * this.overviewAspect;
        this.overviewCamera.orthoTop    = this.overviewDefaultDistance;
        this.overviewCamera.orthoBottom = -this.overviewDefaultDistance;
    }

    moveOverviewCamera(dx, dy, dz) {
        const cam = this.overviewCamera;
        if (!cam) return;

        const right   = cam.getDirection(BABYLON.Axis.X);
        const up      = cam.getDirection(BABYLON.Axis.Y);
        const forward = cam.getDirection(BABYLON.Axis.Z);

        const delta =
            right.scale(dx)
                .add(up.scale(dy))
                .add(forward.scale(dz));

        cam.target.addInPlace(delta);
    }

    zoomOverview(factor) {
        const cam = this.overviewCamera;
        
        cam.orthoLeft   *= factor;
        cam.orthoRight  *= factor;
        cam.orthoTop    *= factor;
        cam.orthoBottom *= factor;
    }

    _detach() {
        if (this.scene.activeCamera) {
            this.scene.activeCamera.detachControl();
        }
    }
}