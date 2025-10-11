import { Timmer, serverRoot } from "../js/libs/serverInit.js";

export function init() {
    Timmer.Start('load')
    loadExternalResource(`${serverRoot}/js/three.js/libs/ammo.wasm.js`, 'js')
        .then(async () => { // 加载three.js文件
            await import('./units/threeInit.js');
        })
        .catch(err => InError(1, err.stack, true))
}

export function InError(errid = 0, errtxt, isThrow = false) {
    const errName = [
        '未知错误',
        '依赖文件加载错误'
    ];
    console.log(`%c${errName[errid]}: ${errtxt}`, 'color: orange');
    const errorDiv = document.getElementById('error');
    errorDiv.innerText = `Script error (Code ${errid}): ${errName[errid]}\n${errtxt}`;
    if (isThrow) { throw new Error(errName[errid]) }
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