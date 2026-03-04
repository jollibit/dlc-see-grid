export async function createScene(engine) {
  const scene = new BABYLON.Scene(engine);

  scene.useRightHandedSystem = true;

  scene.clearColor = new BABYLON.Color4(0.0, 0.75, 0.85, 1.0);

  const ambient = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  ambient.intensity = .25;

  let dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-1, -2, -1),
    scene
  );

  dirLight.position = new BABYLON.Vector3(5, 10, 5);
  dirLight.intensity = 1.2;

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  scene.metadata = { shadowGenerator };

  //const axes = new BABYLON.AxesViewer(scene, 2);
  
  return scene;
};