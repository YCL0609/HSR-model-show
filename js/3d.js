import { Timmer, serverRoot } from "../js/lib/serverInit.js";

export function init() {
    Timmer.Start('load')
    loadExternalResource(`${serverRoot}/js/three.js/libs/ammo.wasm.js`, 'js')
        .then(() => { // 加载three.js文件
            Timmer.Stop('load', '依赖文件加载');
            loadExternalResource(`units/threeInit.js`, 'js', true) // three.js控制文件
        })
        .catch(() => {
            // 错误处理
        })
}

// VMD文件处理
function VMD_process(para) {
    const main = document.getElementById('useVMD');
    const cho = document.getElementById('VMDchoose');
    const list = document.getElementById('VMDlist');
    const local = document.getElementById('localVMD');
    switch (para) {
        case 'open':
            main.style.display = "";
            cho.style.display = "";
            list.style.display = "none";
            local.style.display = "none";
            break;
        case 'close':
            main.style.display = "none";
            break;
        case 'list':
            cho.style.display = "none";
            list.style.display = "";
            break;
        case 'local': // 使用本地文件
            ChangeURL('localvmd', true);
            location.reload()
            break;
        case 'load':
            main.style.display = "none";
            window.loadok = true;
            break;
        case 'online':
            cho.style.display = "none";
            list.style.display = "";
            break;
        case 1: // 使用现有文件
        case 2:
        case 3:
            ChangeURL('vmd', para);
            location.reload();
            break;
        default:
            main.style.display = "none";
            cho.style.display = "none";
            list.style.display = "none";
            local.style.display = "none";
            break;
    }
}