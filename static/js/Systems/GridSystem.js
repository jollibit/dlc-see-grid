import { loadShader } from "../Utils/ShaderLoader.js";

export class GridSystem{
    constructor(scene, room){
        this.scene = scene;
        this.room = room;
        this.hall = "main";

        this.grid;
        this.gridTexture;
        this.texWidth = 512;
        this.texHeight = 512;
        this.gridIsInit = false;
        this.isShowingGrid = false;

        this.timestamp;
        this.span = 60;

        this.isLive = true;
        this.secondsUntilUpdate = 10;
        this.interval = 0;

    }

    async init(){
        this.grid = BABYLON.MeshBuilder.CreateGround(
            "grid",
            { width: MainHall.x, height: MainHall.z },
            this.scene
        );

        this.grid.parent = this.room.room;
        this.grid.position = new BABYLON.Vector3(0,0.3,0);

        this.grid.setEnabled(this.isShowingGrid);
        
        this.grid.position.x += MainHall.gridOffsetX;
        this.grid.position.z += MainHall.gridOffsetZ;
    }

    toggleGrid(){
        this.isShowingGrid = !this.isShowingGrid;
        this.grid.setEnabled(this.isShowingGrid);
    }

    async setToLive(){
        this.isLive = true;
        this.timestamp = new Date();
        const data = await this.fetchData();
        this.updateGrid(data);

    }

    async setTimespan(span){
        this.span = span;
        const data = await this.fetchData();
        this.updateGrid(data);
    }

    async setTimestamp(timestamp){
        this.timestamp = timestamp; 
        this.isLive = false;
        const data = await this.fetchData();
        this.updateGrid(data);
    }

    async update(dt){
        if(!this.isLive) return;
        this.interval -= dt;
        if(this.interval > 0) return;
        this.interval = this.secondsUntilUpdate;
        this.timestamp = new Date();
        const data = await this.fetchData();
        this.updateGrid(data);
    }

    async fetchData(){
        const isoTimestamp = this.timestamp.toISOString();

        const url = `/fastgrid?hall=${this.hall}&timestamp=${encodeURIComponent(isoTimestamp)}&span_seconds=${this.span}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch heatmap: ${res.status}`);
        }

        const apiData = await res.json();
        if(!apiData) return null;

        if(apiData.length != 0){
            this.texHeight = apiData[0].resolution_height;
            this.texWidth = apiData[0].resolution_width;
        }
        
        const grid = Array.from({ length: this.texHeight }, () => Array(this.texWidth).fill(0));

        apiData.forEach(cell => {
            if (cell.y >= 0 && cell.y < this.texHeight && cell.x >= 0 && cell.x < this.texWidth) {
                grid[cell.y][cell.x] += cell.count;
            }
        });

        const flattenedGrid = new Float32Array(this.texWidth * this.texHeight);
        for (let y = 0; y < this.texHeight; y++) {
            for (let x = 0; x < this.texWidth; x++) {
                flattenedGrid[y * this.texWidth + x] = grid[y][x];
            }
        }

        const data = new Map();
        data.set("width", this.texWidth);
        data.set("height", this.texHeight);
        data.set("grid", flattenedGrid);

        return data;
    }

    updateGrid(data){
        if (!data) return;
        
        const texWidth = data.get("width");
        const texHeight = data.get("height");

        if (!this.gridIsInit){
            this.setupGridMaterial(texWidth, texHeight)
            this.gridIsInit = true;
        }

        const dataArray = new Float32Array(texWidth * texHeight * 4);

        for (let i = 0; i < dataArray.length/4; i++) {
            const value = data.get("grid")[i];
            let idx = i * 4;
            dataArray[idx] = value;
            dataArray[idx + 1] = 0;
            dataArray[idx + 2] = 1 - value;
            dataArray[idx + 3] = 1.0;
        }

        this.gridTexture.update(dataArray);
    }

    async setupGridMaterial(texWidth, texHeight){
        const whiteArray = new Float32Array(texWidth * texHeight * 4);
        for (let i = 0; i < texWidth * texHeight; i++) {
            let idx = i * 4;
            whiteArray[idx] = 1.0;
            whiteArray[idx + 1] = 1.0;
            whiteArray[idx + 2] = 1.0;
            whiteArray[idx + 3] = 1.0;
        }

        this.gridTexture = new BABYLON.RawTexture(
                whiteArray,
                texWidth,
                texHeight,
                BABYLON.Engine.TEXTUREFORMAT_RGBA,
                this.scene,
                false,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE,
                BABYLON.Engine.TEXTURETYPE_FLOAT
        );

        const vertexShader = await loadShader("./shaders/heatmap.vertex");
        const fragmentShader = await loadShader("./shaders/heatmap.fragment");

        BABYLON.Effect.ShadersStore["heatmapVertexShader"] = vertexShader;
        BABYLON.Effect.ShadersStore["heatmapFragmentShader"] = fragmentShader;

        const shaderMat = new BABYLON.ShaderMaterial(
            "heatShader",
            this.scene,
            { vertex: "heatmap", fragment: "heatmap" },
            {
                attributes: ["position","normal","uv"],
                uniforms: ["worldViewProjection","heatTexture"]
            }
        );

        shaderMat.setTexture("heatTexture", this.gridTexture);
        
        this.grid.material = shaderMat;
    }
}

class MainHall{
    static x = 73;
    static z = 43.5;
    static gridOffsetX = 0.1;  
    static gridOffsetZ = 1.2;
}