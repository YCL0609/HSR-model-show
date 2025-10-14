import * as UI from '../UI.js';
import * as THREE from 'three';
import { MMDAnimationHelper, MMDLoader } from '../libs/index.js'
import Stats from 'three/libs/stats.module.js';
import { OrbitControls } from 'three/controls/OrbitControls.js';
import { OutlineEffect } from 'three/effects/OutlineEffect.js';
import { GUI } from 'three/lil-gui.esm.min.js';
import { Timmer } from '../libs/serverInit.js';
console.log('3D page version: ' + page_version + '\nthree.js version: ' + THREE.REVISION);

let stats, vmdurl, mp3url;
let helper, mesh;
let camera, scene, renderer, effect;
const clock = new THREE.Clock();
const gui = new GUI();

// 初始化
Timmer.Start('threeinit');
const initdata = await UI.Init();
const name = initdata[0];
const vmd = initdata[1];
const weapon = initdata[2];
const islocal = initdata[3];
Timmer.Stop('threeinit', 'three初始化');

// 主函数
try {
  Ammo().then(AmmoLib => {
    Ammo = AmmoLib;
    init();
    animate();
  })
} catch (e) {
  UI.Error(2, e)
}

// 场景配置
async function init() {
  Timmer.Start('screeninit')
  UI.Progress.main(3);
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
  const lightFolder = gui.addFolder('光照');
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
  UI.Progress.main(4);
  // 天空盒
  Timmer.Start('skybox');
  const skybox = new THREE.CubeTextureLoader();
  skybox.setPath(`${serverRoot}/img/skybox/`);
  skybox.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg',], (mesh) => {
    scene.background = mesh;
    UI.Finish.Skybox();
    Timmer.Stop('skybox', '天空盒');
  }, null, () => { UI.Error(3); UI.Finish.Skybox(true) })
  // 场景模型
  Timmer.Start('bgmodel');
  loader.load(
    `${serverRoot}/models/background/index.pmx`,
    (mesh) => {
      // 添加到屏幕( X:0 y:-11.7 Z:0)
      mesh.position.y = -11.7;
      scene.add(mesh);
      const modelFolder = gui.addFolder('场景');
      const modelParams = { x: 0, z: 0 }
      modelFolder.add(modelParams, 'x', -500, 500).onChange(() => {
        mesh.position.x = modelParams.x;
      });
      modelFolder.add(modelParams, 'z', -500, 500).onChange(() => {
        mesh.position.z = modelParams.z;
      });
      UI.Finish.Model('text2', 'texte2', 'background');
      Timmer.Stop('bgmodel', '背景模型')
    },
    (xhr) => { UI.Progress.Model(2, xhr) },
    (err) => { UI.Error(4, err) }
  );
  const text = (vmd == 0) ? '模型文件:' : '模型和动作文件:'
  const texten = (vmd == 0) ? 'Model Files:' : 'Model and Action Files:'
  if (islocal) {
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
    vmdurl = `${serverRoot}/vmd/${vmd}/index.vmd`;
    mp3url = `${serverRoot}/vmd/${vmd}/index.mp3`;
  }
  Timmer.Start('mainmodel');
  loader.loadWithAnimation(
    `${serverRoot}/models/${name}/index.pmx`,
    vmdurl,
    (mmd) => {
      // 添加到屏幕( X:0 y:-10 Z:0)
      mesh = mmd.mesh;
      mesh.position.y = -10;
      scene.add(mesh);
      const modelFolder = gui.addFolder('人物');
      const modelParams = { x: 0, z: 0 }
      modelFolder.add(modelParams, 'x', -200, 200).onChange(() => {
        mesh.position.x = modelParams.x;
      });
      modelFolder.add(modelParams, 'z', -200, 200).onChange(() => {
        mesh.position.z = modelParams.z;
      });
      UI.Finish.Model('text1', 'texte1', 'module')
      if (vmd !== 0) { Audioload(mmd) };
      Timmer.Stop('mainmodel', '人物模型')
    },
    (xhr) => {
      UI.Progress.Model(1, xhr, text, texten);
    },
    (err) => {
      console.error(err);
      UI.Error(5, err)
    }
  );
  (vmd == 0) ? Weapons(loader) : null;

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
  if (name == 27) { // 素裳(大赤鸢模型太大)
    x = [0, -15, +20, +10, -10];
    z = [0, 0, 0, -20, -20];
  }
  for (let i = 1; i <= weapon; i++) {
    Timmer.Start(`weapon${i}`);
    UI.Start(`weapon${i}`, `-w${i}`, `武器模型${i}:`, `Weapon model${i}:`);
    loader.load(
      `${serverRoot}/models/${name}/${i}.pmx`,
      (mesh) => {
        // 添加到屏幕(X,Y,Z)
        mesh.position.x = x[i];
        mesh.position.y = -7;
        mesh.position.z = z[i];
        const modelFolder = gui.addFolder(`武器${i}`);
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
      (xhr) => {
        UI.Progress.Model(`-w${i}`, xhr);
      },
      (err) => {
        UI.Error(6, err);
      });
  }
}

function Audioload(mmd) {
  Timmer.Start('music');
  UI.Start('music', 4, '音乐文件:', 'Music file:');
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
      setTimeout(() => {
        UI.Finish.MMD();
        let ok = document.getElementById('start');
        ok.innerText = "开始(Start)";
        ok.onclick = () => {
          oceanAmbientSound.play();// 播放音频
          document.getElementById('info').style.display = "none";
          // 开始动画
          helper.add(mesh, {
            animation: mmd.animation,
            physics: true
          });
        }
      }, 2000);
    },
    (xhr) => { UI.Progress.Model(4, xhr); },
    (err) => { UI.Error(7, err) }
  );
}