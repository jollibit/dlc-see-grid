export class Robot{
    constructor(id, scene){
        this.id = id;
        this.scene = scene;
        this.status;
        this.mesh;
        this.light;
        this.label;
        this.isInit = false;
    }

    async init() {
        if(this.isInit) return;

        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "models/",
            "Monkey.glb",
            this.scene
        );

        this.mesh = result.meshes[1];


        const mat = this.mesh.material || new BABYLON.StandardMaterial(`robotMat`, this.scene);
        mat.maxSimultaneousLights = 10;
        this.mesh.material = mat;

        this.light = new BABYLON.SpotLight(
            `robotLight_${this.id}`,               
            BABYLON.Vector3.Zero(),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI / 2,
            2,
            this.scene
        );

        this.light.intensity = 5;
        this.light.parent = this.mesh;
        this.light.position = new BABYLON.Vector3(0, 5, 0);

        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.label = new BABYLON.GUI.TextBlock();
        this.label.text = this.id;
        this.label.color = "white";
        this.label.fontSize = 14;
        this.label.outlineWidth = 2;
        this.label.outlineColor = "black";

        ui.addControl(this.label);

        this.label.linkWithMesh(this.mesh);
        this.label.linkOffsetY = -30;

        this.isInit = true;
    }

    translate(position){
        if(!this.isInit) return;

        this.mesh.position = position;
    }

    move(target, dt){
        if(!this.isInit) return;

        const current = this.mesh.position;

        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const dz = target.z - current.z;

        current.x += dx * dt;
        current.y += dy * dt;
        current.z += dz * dt;

        if (dx !== 0 || dz !== 0) {
            const targetAngle = Math.atan2(dx, dz);
            this.mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, targetAngle, 0);
        }
    }

    setStatus(status){
        if(!this.isInit) return;
        this.status = status;

        if (this.status === "ok") {
            this.light.diffuse = new BABYLON.Color3(0, 1, 0);
            this.label.color = "lime";
        } else if (this.status === "warning") {
            this.light.diffuse = new BABYLON.Color3(1, 1, 0);
            this.label.color = "yellow";
        } else if (this.status === "error") {
            this.light.diffuse = new BABYLON.Color3(1, 0, 0);
            this.label.color = "red";
        } else {
            this.light.diffuse = new BABYLON.Color3(1, 1, 1);
            this.label.color = "white";
        }
    }

    setAnchor(anchor){
        this.mesh.parent = anchor;
    }

    dispose() {
        if (!this.isInit) return;

        this.label?.dispose();
        this.label = null;

        this.light?.dispose();
        this.light = null;

        if (this.mesh) {
            if (this.mesh.material && !this.mesh.material.isFrozen) {
                this.mesh.material.dispose();
            }
            this.mesh.dispose();
            this.mesh = null;
        }

        this.scene = null;
        this.isInit = false;
    }
}