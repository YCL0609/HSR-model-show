import { Timmer, serverRoot, loadExternalResource } from "./libs/serverInit.js";
import { serverInit } from "./libs/serverInit.js";
import { InError } from "./units/InError.js";
import { Progress } from "./units/UI.js";

serverInit()
    .then(initCode => {
        if (initCode !== undefined) {
            document.getElementById('error').innerText = `Script fault (code ${initCode}): Script initialization error!`;
            console.log(`%cScript fault (code ${initCode}): Script initialization error!`, 'color:red');
        } else {
            Timmer.Start('load');
            Progress.Main(0);
            loadExternalResource(`${serverRoot}/js/libs/ammo.wasm.js`, 'js')
                .then(async () => { // 加载three.js文件
                    try {
                        Progress.Main(1);
                        import('./units/threeInit.js');
                    } catch (_) { return } // 防止报错传递到这里
                })
                .catch(err => InError(2, err.stack, true))
        }
    })

// VMD文件处理
window.VMD_process = (para) => {
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
            urlChange('localvmd', true);
            break;
        case 'load': // 加载用户选择
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
            urlChange('vmd', para);
            break;
        default:
            main.style.display = "none";
            cho.style.display = "none";
            list.style.display = "none";
            local.style.display = "none";
            break;
    }
}

// 修改 URL 参数
function urlChange(key, value) {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    // 修改或添加参数
    if (params.has(key)) {
        params.set(key, value);
    } else {
        params.append(key, value);
    }
    // 构造新 URL 并跳转
    const newUrl = `${url.origin}${url.pathname}?${params.toString()}`;
    window.location.href = newUrl;
}