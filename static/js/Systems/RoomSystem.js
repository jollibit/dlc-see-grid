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

        this.anchor = result.meshes.find(m => m.name.startsWith("anchor_"));
    }
}