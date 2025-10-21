import * as UI from './UI.js';
import * as THREE from 'three';
import { InError } from '../3d.js';
import { Timmer } from '../libs/serverInit.js';
import { serverRoot } from '../libs/serverInit.js';
import Stats from 'libs/three.js/libs/stats.module.js';
import { GUI } from 'libs/three.js/lil-gui.module.min.js';
import { MMDLoader } from 'libs/three.js/loaders/MMDLoader.js';
import { OutlineEffect } from 'libs/three.js/effects/OutlineEffect.js';
import { OrbitControls } from 'libs/three.js/controls/OrbitControls.js';
import { MMDAnimationHelper } from 'libs/three.js/animation/MMDAnimationHelper.js';
console.log('3D page version: ' + page_version + '\nthree.js version: ' + THREE.REVISION);

let stats, vmdurl, mp3url;
let helper, mesh;
let camera, scene, renderer, effect;
const clock = new THREE.Clock();
const lilgui = new GUI();

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
  InError(3, e)
}

// 场景配置
async function init() {
  Timmer.Start('screeninit')
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
  effect = new OutlineEffect(renderer);
  // 模型加载器
  const loader = new MMDLoader();
  helper = new MMDAnimationHelper();
  // 帧数显示和其他
  stats = new Stats();
  container.appendChild(stats.dom);
  Timmer.Stop('screeninit', '画布初始化');
  UI.Progress.Main(2);
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
  Timmer.Start('bgmodel');
  loader.load(
    `${serverRoot}/models/background/index.pmx`,
    (mesh) => {
      // 添加到屏幕( X:0 y:-11.7 Z:0)
      mesh.position.y = -11.7;
      scene.add(mesh);
      const modelFolder = lilgui.addFolder('场景');
      const modelParams = { x: 0, z: 0 }
      modelFolder.add(modelParams, 'x', -500, 500).onChange(() => {
        mesh.position.x = modelParams.x;
      });
      modelFolder.add(modelParams, 'z', -500, 500).onChange(() => {
        mesh.position.z = modelParams.z;
      });
      UI.Finish.Model('text2', 'texte2', 'background');
      Timmer.Stop('bgmodel', '背景模型');
    },
    (xhr) => UI.Progress.Model(2, xhr),
    (err) => InError(5, err.stack)
  );
  const text = (UI.vmd == 0) ? '模型文件:' : '模型和动作文件:'
  const texten = (UI.vmd == 0) ? 'Model Files:' : 'Model and Action Files:'
  if (UI.vmd === -1) {
    document.getElementById('useVMD').style.display = "";
    document.getElementById('VMDchoose').style.display = "none";
    document.getElementById('localVMD').style.display = "";
    await new Promise((resolve) => {
      const check_value = setInterval(() => {
        if (window.loadok) {
          clearInterval(check_value); // 清除定时器
          vmdurl = document.getElementById('vmdInput').value;
          mp3url = document.getElementById('mp3Input').value || `${serverRoot}/vmd/0/index.mp3`;
          resolve(); // 解析 Promise
        }
      }, 1500); // 每1500毫秒检查一次
    });
  } else {
    vmdurl = `${serverRoot}/vmd/${UI.vmd}/index.vmd`;
    mp3url = `${serverRoot}/vmd/${UI.vmd}/index.mp3`;
  }
  Timmer.Start('mainmodel');
  loader.loadWithAnimation(
    `${serverRoot}/models/${UI.name}/index.pmx`,
    vmdurl,
    (mmd) => {
      // 添加到屏幕( X:0 y:-10 Z:0)
      mesh = mmd.mesh;
      mesh.position.y = -10;
      scene.add(mesh);
      const modelFolder = lilgui.addFolder('人物');
      const modelParams = { x: 0, z: 0 }
      modelFolder.add(modelParams, 'x', -200, 200).onChange(() => {
        mesh.position.x = modelParams.x;
      });
      modelFolder.add(modelParams, 'z', -200, 200).onChange(() => {
        mesh.position.z = modelParams.z;
      });
      UI.Finish.Model('text1', 'texte1', 'module')
      if (UI.vmd !== 0) { Audioload(mmd) };
      Timmer.Stop('mainmodel', '人物模型')
    },
    (xhr) => {
      UI.Progress.Model(1, xhr, text, texten);
    },
    (err) => InError(6, err.stack)
  );
  (UI.vmd == 0) ? Weapons(loader) : null;

  // 相机
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0;
  controls.maxDistance = 1000;
  // 窗口拉伸
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// 场景渲染和动画
function animate() {
  helper.update(clock.getDelta());
  requestAnimationFrame(animate);
  stats.begin();
  effect.render(scene, camera);
  stats.end();
}

function Weapons(loader) {
  let x = [0, -15, +20, +10, -10, -20, 0, +20];
  let z = [0, 0, 0, -15, -15, -15, -15, -15];
  if (UI.name == 27) { // 素裳(大赤鸢模型太大)
    x = [0, -15, +20, +10, -10];
    z = [0, 0, 0, -20, -20];
  }
  for (let i = 1; i <= UI.weapon; i++) {
    Timmer.Start(`weapon${i}`);
    // 添加UI
    let info = document.createElement('div');
    info.id = `weapon${i}`;
    info.innerHTML = `
    <a>武器模型${i}:</a><a id="text-w${i}" class="text">等待启动...</a><br>
    <a>Weapon model${i}:</a><a id="texte-w${i}" class="text">Waiting for the start...</a>
    <div class="progress">
    <div id="progress-w${i}" class="progress-inside" style="width: 0%"></div>
    </div>`;
    document.getElementById('info-main').appendChild(info);
    loader.load(
      `${serverRoot}/models/${UI.name}/${i}.pmx`,
      (mesh) => {
        // 添加到屏幕(X,Y,Z)
        mesh.position.x = x[i];
        mesh.position.y = -7;
        mesh.position.z = z[i];
        const modelFolder = lilgui.addFolder(`武器${i}`);
        const modelParams = { x: x[i], z: z[i] }
        modelFolder.add(modelParams, 'x', -200, 200).onChange(() => {
          mesh.position.x = modelParams.x;
        });
        modelFolder.add(modelParams, 'z', -200, 200).onChange(() => {
          mesh.position.z = modelParams.z;
        });
        scene.add(mesh);
        UI.Finish.Model(`text-w${i}`, `texte-w${i}`, `weapon${i}`);
        Timmer.Stop(`weapon${i}`, `武器模型${i}`)
      },
      (xhr) => UI.Progress.Model(`-w${i}`, xhr),
      (err) => InError(7, err.stack)
    );
  }
}

function Audioload(mmd) {
  Timmer.Start('music');
  // 添加UI
  let info = document.createElement('div');
  info.id = "music";
  info.innerHTML = `
    <a>音乐文件:</a><a id="text4" class="text">等待启动...</a><br>
    <a>Music file:</a><a id="texte4" class="text">Waiting for the start...</a>
    <div class="progress">
    <div id="progress4" class="progress-inside" style="width: 0%"></div>
    </div>`;
  document.getElementById('info-main').appendChild(info);
  // 监听
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  // 音频对象
  const oceanAmbientSound = new THREE.Audio(audioListener);
  scene.add(oceanAmbientSound);
  // 加载音频资源
  const loader2 = new THREE.AudioLoader();
  loader2.load(
    mp3url,
    (audioBuffer) => {
      oceanAmbientSound.setBuffer(audioBuffer);
      oceanAmbientSound.setLoop(true);//设置音频循环
      document.getElementById('text4').innerText = "加载完成.";
      document.getElementById('music').style.display = "none";
      Timmer.Stop('music', '音频文件');
      let ok = document.getElementById('start');
      ok.innerText = "开始(Start)";
      ok.onclick = () => {
        oceanAmbientSound.play();// 播放音频
        document.getElementById('info').style.display = "none";
        document.getElementById('banner').style.display = "none";
        // 开始动画
        helper.add(mesh, {
          animation: mmd.animation,
          physics: true
        });

      };
      UI.Finish.Count();
    },
    (xhr) => UI.Progress.Model(4, xhr),
    (err) => InError(8, err.stack)
  );
}