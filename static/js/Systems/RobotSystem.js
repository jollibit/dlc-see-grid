import { Robot } from "./Robot.js"

export class RobotSystem {
    constructor(scene, room) {
        this.scene = scene;
        this.room = room;
        this.robots = new Map();
        this.robotData = new Map();
        this.templateMesh = null;
        this.robotLights = new Map();
        this.isLive = true;
        this.listeners = [];
    }

    async init() {
    }

    onRobotsChanged(callback) {
        this.listeners.push(callback);
    }

    _emitRobotsChanged() {
        const ids = Array.from(this.robots.keys());
        this.listeners.forEach(cb => cb(ids));
    }

    async setState(id, data) {
        this.robotData.set(id, data);
        if(!this.robots.has(id)){
            const robot = new Robot(id, this.scene);
            this.robots.set(id, robot);
            await robot.init(); 
            robot.setAnchor(this.room.anchor);
            let position = new BABYLON.Vector3(data.x, data.y, data.z);
            robot.translate(position);
            this._emitRobotsChanged();
        }
    }

    async fetchLiveData(id, data){
        if(!this.isLive) return;
        this.setState(id, data);
    }

    setToLive(){
        this.isLive = true;
        
        for (const robot of this.robots.values()){
            robot.dispose();
        }

        this.robots = new Map();
        this.robotData = new Map();
    }

    async showPointInTime(timestamp){
        this.isLive = false;
        const isoTimestamp = timestamp.toISOString();

        const url = `/robots/names`;
        const res = await fetch(url);
        
        const names = await res.json();

        for (const robot of this.robots.values()){
            robot.dispose();
        }

        this.robots = new Map();
        this.robotData = new Map();

        for(const key in names){ 
            const name = names[key];
            const url = `/robots/closest?timestamp=${encodeURIComponent(isoTimestamp)}&name=${name}`;

            const res = await fetch(url);
            if (!res.ok) {
                if(res.status == 404){
                    continue;
                }
                else throw new Error(`Failed to fetch robot: ${res.status}`);

            }
            const data = await res.json();
            
            this.setState(name, data);
        }
    }

    update(dt) {
        this.robotData.keys().forEach(id => {
            const data = this.robotData.get(id);
            let robot = this.robots.get(id);

            if (robot){    
                const target = new BABYLON.Vector3(data.x, data.y, data.z);
                robot.move(target, dt);
                robot.setStatus(data.status);
            }
        });
    }

    getRobotMesh(id) {
        if(!this.robots) return null;
        return this.robots.get(id).mesh;
    }

    getRobotIds(){
        if(!this.robots) return null;
        return this.robots.keys();
    }

    getRobotStatus(id) {
        if(!this.robotData.get(id)) return null;
        return this.robotData.get(id).status;
    }

    dispose() {}
}