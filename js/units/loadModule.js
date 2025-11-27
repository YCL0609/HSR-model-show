import { Audioload } from './Audioload.js';
import { Weapons } from './Weapons.js';
import { MMDLoader } from 'three/loaders/MMDLoader.js';
import { Timmer } from '../libs/serverInit.js';
import { serverRoot } from '../libs/serverInit.js';
import { InError } from './InError.js';
import { lilgui, scene } from './threeInit.js';
import * as UI from './UI.js';

export let mp3url, mainMesh;
let vmdurl;
const loader = new MMDLoader();

export async function loadModule() {
    Timmer.Start('bgmodel');
    // 背景模型处理
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
        (err) => InError(11, err.stack)
    );
    // 主模型处理
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
            mainMesh = mmd.mesh;
            mainMesh.position.y = -10;
            scene.add(mainMesh);
            const modelFolder = lilgui.addFolder('人物');
            const modelParams = { x: 0, z: 0 }
            modelFolder.add(modelParams, 'x', -200, 200).onChange(() => {
                mesh.position.x = modelParams.x;
            });
            modelFolder.add(modelParams, 'z', -200, 200).onChange(() => {
                mesh.position.z = modelParams.z;
            });
            UI.Finish.Model('text1', 'texte1', 'module')
            if (UI.vmd !== 0) Audioload(mmd);
            Timmer.Stop('mainmodel', '人物模型')
        },
        (xhr) => UI.Progress.Model(1, xhr, text, texten),
        (err) => InError(12, err.stack)
    );
    (UI.vmd == 0) ? Weapons(loader) : null;
}