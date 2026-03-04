import { createScene } from "./CreateScene.js"

import { CameraSystem } from "./Systems/CameraSystem.js"
import { NetworkSystem } from "./Systems/NetworkSystem.js"
import { RobotSystem } from "./Systems/RobotSystem.js"
import { RoomSystem } from "./Systems/RoomSystem.js"
import { GridSystem } from "./Systems/GridSystem.js"

import { ViewController } from "./Controller/ViewController.js";
import { UIController } from "./Controller/UIController.js";

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true, renderEvenInBackground: true });

const scene = await createScene(engine);

const room = new RoomSystem(scene);
await room.init();

const camera = new CameraSystem(scene, canvas, engine);
camera.init();

const network = new NetworkSystem();
const robotIds = await network.initRobots();

const robots = new RobotSystem(scene, room);
await robots.init();

robotIds.forEach(id => {
  network.onRobot(id, data => {
    robots.fetchLiveData(id, data);
  });
});

const grid = new GridSystem(scene, room);
await grid.init();

const viewController = new ViewController(camera, robots);
viewController.init();

const uiController = new UIController(viewController, grid, robots);
uiController.init();

engine.runRenderLoop(() => {
  const dt = engine.getDeltaTime() * 0.001;
  robots.update(dt);
  camera.update(dt);
  grid.update(dt);
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});