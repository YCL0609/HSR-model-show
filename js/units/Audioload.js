import * as UI from './UI.js';
import * as THREE from 'three';
import { Timmer } from '../libs/serverInit.js';
import { InError } from './InError.js';
import { camera, scene, helper } from './threeInit.js';
import { mp3url, mainMesh } from './loadModule.js';

export function Audioload(mmd) {
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
  const loader = new THREE.AudioLoader();
  loader.load(
    mp3url,
    (audioBuffer) => {
      oceanAmbientSound.setBuffer(audioBuffer);
      oceanAmbientSound.setLoop(true); // 设置音频循环
      document.getElementById('text4').innerText = "加载完成.";
      document.getElementById('music').style.display = "none";
      Timmer.Stop('music', '音频文件');
      let ok = document.getElementById('start');
      ok.innerText = "开始(Start)";
      ok.onclick = () => {
        oceanAmbientSound.play(); // 播放音频
        document.getElementById('info').style.display = "none";
        document.getElementById('banner').style.display = "none";
        // 开始动画
        helper.add(mainMesh, {
          animation: mmd.animation,
          physics: true
        });

      };
      UI.Finish.Count();
    },
    (xhr) => UI.Progress.Model(4, xhr),
    (err) => InError(14, err.stack)
  );
}
