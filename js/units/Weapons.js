import { Timmer, serverRoot } from '../libs/serverInit.js';
import { InError } from './InError.js';
import { lilgui, scene } from './threeInit.js';
import * as UI from './UI.js';

export function Weapons(loader) {
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
        const modelParams = { x: x[i], z: z[i] };
        modelFolder.add(modelParams, 'x', -200, 200).onChange(() => {
          mesh.position.x = modelParams.x;
        });
        modelFolder.add(modelParams, 'z', -200, 200).onChange(() => {
          mesh.position.z = modelParams.z;
        });
        scene.add(mesh);
        UI.Finish.Model(`text-w${i}`, `texte-w${i}`, `weapon${i}`);
        Timmer.Stop(`weapon${i}`, `武器模型${i}`);
      },
      (xhr) => UI.Progress.Model(`-w${i}`, xhr),
      (err) => InError(12, err.stack)
    );
  }
}
