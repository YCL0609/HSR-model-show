import * as UI from './UI.js';
import * as THREE from 'three';
import { InError } from "./InError.js";
import { loadModule } from './loadModule.js';
import Stats from 'three/libs/stats.module.js';
import { GUI } from 'three/lil-gui.module.min.js';
import { serverRoot, Timmer } from '../libs/serverInit.js';
import { OrbitControls } from 'three/controls/OrbitControls.js';
import { MMDAnimationHelper } from 'three/animation/MMDAnimationHelper.js';
console.log(`3D page version: ${page_version}\nthree.js version: ${THREE.REVISION}`);

export let stats, helper, camera, scene, renderer, effect;
export const lilgui = new GUI();
const clock = new THREE.Clock();

try {
  // 初始化
  Timmer.Start('threeinit');
  await UI.Init();
  // 主函数
  Ammo().then(AmmoLib => {
    Timmer.Stop('threeinit', 'three初始化');
    Ammo = AmmoLib;
    init();
    animate();
  })
} catch (e) {
  InError(9, e.stack, true)
}

// 场景配置
async function init() {
  Timmer.Start('screeninit');
  UI.Progress.Main(2);
  const container = document.createElement('div');
  document.body.appendChild(container);
  // 相机
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 40;
  // 背景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x151515);
  // 光照
  const Light1 = new THREE.DirectionalLight(0xf4e7e1, 1.5);
  const Light2 = new THREE.DirectionalLight(0xf4e7e1, 0.5);
  Light1.target.updateMatrixWorld();
  Light2.target.updateMatrixWorld();
  Light1.position.y = 20;
  Light2.position.y = -20;
  Light1.castShadow = true;
  Light2.castShadow = true;
  scene.add(Light1);
  scene.add(Light2);
  const lightFolder = lilgui.addFolder('光照');
  const lightParams = { color: '0xf4e7e1', intensity: 1 }
  lightFolder.addColor(lightParams, 'color').onChange(() => {
    Light1.Color.set(lightParams.color);
    Light2.Color.set(lightParams.color);
  })
  lightFolder.add(lightParams, 'intensity', 0, 4).onChange(() => {
    Light1.intensity = lightParams.intensity + 0.5;
    Light2.intensity = lightParams.intensity - 0.5;
  })
  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  // 模型加载器
  helper = new MMDAnimationHelper();
  // 帧数显示和其他
  stats = new Stats();
  container.appendChild(stats.dom);
  Timmer.Stop('screeninit', '画布初始化');
  UI.Progress.Main(3);
  // 天空盒
  Timmer.Start('skybox');
  const skybox = new THREE.CubeTextureLoader();
  skybox.setPath(`${serverRoot}/img/skybox/`);
  skybox.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg',], (mesh) => {
    scene.background = mesh;
    UI.Finish.Skybox();
    Timmer.Stop('skybox', '天空盒');
  }, null, (err) => UI.Finish.Skybox(true, err.stack))
  // 场景模型
  await loadModule();
  // 相机
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0;
  controls.maxDistance = 1000;
  // 窗口拉伸
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// 场景渲染和动画
function animate() {
  helper.update(clock.getDelta());
  requestAnimationFrame(animate);
  stats.begin();
  renderer.render(scene, camera);
  stats.end();
}
