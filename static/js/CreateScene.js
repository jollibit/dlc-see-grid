export async function createScene(engine) {
  const scene = new BABYLON.Scene(engine);

  scene.useRightHandedSystem = true;

  scene.clearColor = new BABYLON.Color4(0.0, 0.75, 0.85, 1.0);

  const hdrTexture = new BABYLON.HDRCubeTexture(
      "images/workshop.hdr",
      scene,
      1024,
      false,
      true,
      false,
      false
  )

  scene.environmentTexture = hdrTexture;
  scene.environmentIntensity = 0.5;

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

  ambient.intensity = .1;

  let dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(0, -2, 1),
    scene
  );

  dirLight.position = new BABYLON.Vector3(0, 1000, 0);
  dirLight.intensity = 1.5;

  const shadowGenerator = new BABYLON.CascadedShadowGenerator(2048, dirLight);
  shadowGenerator.numCascades = 6;
  shadowGenerator.useAutoCalcShadowZBounds = false;

  shadowGenerator.useContactHardeningShadow = true;
  shadowGenerator.filter = BABYLON.ShadowGenerator.FILTER_PCF;
  shadowGenerator.filterPCFType = BABYLON.ShadowGenerator.PCF_TYPE_HARD; 
  shadowGenerator.forceBackFacesOnly = true;

  shadowGenerator.bias = 0.0005;
  shadowGenerator.normalBias = 0.02;

  
  shadowGenerator.setDarkness(0.25);
  
  shadowGenerator.shadowMinZ = 1;
  shadowGenerator.shadowMaxZ = 1000;
  
  shadowGenerator.blurKernel = 32;

  scene.metadata = { shadowGenerator };

  //const axes = new BABYLON.AxesViewer(scene, 2);
  
  return scene;
};