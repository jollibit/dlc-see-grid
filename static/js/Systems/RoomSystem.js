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
            "New_HM26.glb",
            this.scene
            );

            this.room = result.meshes[0];
            this.room.position = new BABYLON.Vector3(0, 0, 0);

            this.anchor = result.meshes.find(m => m.name.startsWith("anchor_"));
    }
}