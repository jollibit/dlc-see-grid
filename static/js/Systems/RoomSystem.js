export class RoomSystem{
    constructor(scene){
        this.scene = scene;
        this.room;
        this.anchor;
        this.heatmap;
        this.heatTexture;
    }

    async init(){
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "models/",
            "HM26.glb",
            this.scene
            );

        const meshes = result.meshes;
        this.room = new BABYLON.TransformNode(`room`, this.scene);
        
        meshes.forEach(mesh => {
            mesh.setParent(this.room, true);
            const mat = mesh.material || new BABYLON.StandardMaterial(`roomMat`, this.scene);
            mat.maxSimultaneousLights = 10;
            mesh.material = mat;

            mesh.refreshBoundingInfo();
            this.scene.metadata.shadowGenerator.addShadowCaster(mesh, true);

            mesh.receiveShadows = true;
            mesh.getChildMeshes().forEach(child => {
                child.receiveShadows = true;
            });
            
        });
        
        this.room.position = new BABYLON.Vector3(0, 0, 0);
        
        let cornerAnchor = result.meshes.find(m => m.name.startsWith("anchor_"));
        
        this.anchor = new BABYLON.TransformNode("roomAnchor", this.scene);
        this.anchor.parent = cornerAnchor;
        
        const config = window.APP_CONFIG;

        const ANCHOR_X = config.ANCHOR_X || 0;
        const ANCHOR_Z =  config.ANCHOR_Y || 0;
        const ANCHOR_THETA =  config.ANCHOR_THETA || 0;

        this.anchor.position.x = ANCHOR_X;
        this.anchor.position.z = ANCHOR_Z;
        this.anchor.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, BABYLON.Tools.ToRadians(ANCHOR_THETA), 0);    
    }
}