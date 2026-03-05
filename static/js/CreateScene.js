export async function createScene(engine) {
  const scene = new BABYLON.Scene(engine);

  scene.useRightHandedSystem = true;

  scene.clearColor = new BABYLON.Color4(0.0, 0.75, 0.85, 1.0);

  const environmentTex = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "images/environment.env",
      scene
  );

  scene.environmentTexture = environmentTex;

  const backgroundLayer = new BABYLON.Layer(
      "bgLayer",
      "images/network.png",
      scene
  );

  backgroundLayer.isBackground = true;
  const ambient = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  ambient.intensity = .5;

  let dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-1, -1, -1),
    scene
  );

  dirLight.position = new BABYLON.Vector3(-50, 10, -50);
  dirLight.intensity = 1.5;

  const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  shadowGenerator.setDarkness(0.5); // optional
  shadowGenerator.forceBackFacesOnly = true; // optional

  // Adjust frustum for directional light
  shadowGenerator.useContactHardeningShadow = true; // nicer

  scene.metadata = { shadowGenerator };

  /*
  const cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 2 }, scene);
  cube.position.y = 1;
  scene.metadata.shadowGenerator.addShadowCaster(cube);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  ground.position.y = .5;
  ground.receiveShadows = true;
  */
  //const axes = new BABYLON.AxesViewer(scene, 2);
  
  return scene;
};