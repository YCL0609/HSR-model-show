let serverRoot, timmer, DbgRoot;
let DebugID = '10010';
const Debug = isDebug();
const serverMap = ["//139.224.2.122", "//server0.ycl.cool/srroot", "//server1.ycl.cool/srroot"]; // 可用服务器

if (Debug) { // 调试初始化
    const id = getUrlParams('debug');
    DebugID = !isNaN(id) ? id.padEnd(5, 0) : "00101";
    console.log(`调试ID: %c${DebugID}`, 'color: #0ff');
    DbgRoot = "//localhost" + (window.location.protocol === "https:" ? "/sr_db" : ":8081")
    /**
     * 是否进行服务器连接测试
     * 是否打印到控制台
     * 是否使用本地资源文件
     * 是否进行加载计时
     * 是否弹出错误提示框
     **/
}

(async () => {
    timmer = DbgTimmer(Number(DebugID[4]));
    timmer.Start('init');
    // 服务器选择
    let serverID;
    let usercho = getUrlParams('server');
    if (!isNaN(usercho)) {
        serverRoot = windows.btoa(usercho);
    } else if (Number(DebugID[0])) {
        const servers = await ServerChoose(serverMap, Number(DebugID[1]));
        serverID = chooseServer(servers);
        if (serverID === -1) handleServerError('服务器初始化错误:无可用服务器! - All servers have timed out or had an error in their response');
    } else { serverID = 0 }
    serverRoot = Number(DebugID[2]) ? DbgRoot : serverMap[serverID];
    timmer.Stop('init', '初始化');

    timmer.Start('load')
    document.getElementById('text0').innerText = "(2/5)加载依赖文件...";
    document.getElementById('texte0').innerText = "(2/5)Load dependency files...";
    document.getElementById('progress0').style.width = `20%`;
    document.getElementById('jsload').style.display = "";
    Promise.all([
        loadExternalResource(`${serverRoot}/js/es-module-shims.js`, 'js', null, (e) => {
            if (e) {
                info = "<b style='color:red'>Error!</b>"
            } else {
                info = "<b style='color:#0f0'>Success!</b>"
            }
            document.getElementById('jsload1').innerHTML = info
        }),
        loadExternalResource(`${serverRoot}/js/three.js/libs/ammo.wasm.js`, 'js', null, (e) => {
            if (e) {
                info = "<b style='color:red'>Error!</b>"
            } else {
                info = "<b style='color:#0f0'>Success!</b>"
            }
            document.getElementById('jsload2').innerHTML = info
        }),
    ])
        .then(() => { // 加载three.js文件
            timmer.Stop('load', '依赖文件加载');
            setupImportMap(serverRoot) // 生成ImportMap
            loadExternalResource(`js/3d.module.js`, 'js', true) // three.js控制文件
            document.getElementById('jsload').innerHTML = "<b>首次或长时间未打开(缓存失效)时加载时间会加长，请耐心等待...</b><br><b>The loading time will be longer when it is not opened for the first time or for a long time (cache invalidation), please be patient...</b>";
        })
        .catch(() => handleServerError('服务器初始化错误:依赖文件加载错误! - Dependency files are not loaded correctly'))
})()
 
function chooseServer(servers) {
    const validServers = servers.filter(s => !s.isError);
    if (validServers.length === 0) return -1;

    return servers.indexOf(validServers.reduce((fastest, current) =>
        current.elapsedTime < fastest.elapsedTime ? current : fastest
    ));
}

// 服务器错误处理
function handleServerError(text) {
    if (Number(DebugID[3])) {
        const div = document.createElement('div');
        div.className = "poop";
        div.style.backgroundColor = "#f00000e0";
        const b = document.createElement('b');
        b.textContent = text;
        div.appendChild(b);
        document.getElementById('error').append(div);
    }
    document.getElementById('ServerChoose').style.display = ""
    const progressBar = document.getElementById('progress0');
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "#f00";
}

// 动态生成ImportMap
function setupImportMap(Path) {
    const importMap = {
        imports: {
            "WebUI": "./js/UI.js",
            "three": `${Path}/js/three.js/three.module.min.js`,
            "three/": `${Path}/js/three.js/`
        }
    };
    const importMapElement = document.createElement('script');
    importMapElement.type = 'importmap';
    importMapElement.textContent = JSON.stringify(importMap);
    document.head.appendChild(importMapElement);
}

// 用户服务器选择
async function userServerChoose() {
    const selent = document.getElementById('server');
    const serverID = selent.options[selent.selectedIndex].value;
    const resultdiv = document.getElementById('test-result');
    if (serverID == -1) return;
    serverRoot = (serverID === 9) ? '//139.224.2.122' : `//server${serverID}.ycl.cool`;

    // 服务器连接测试
    timmer.Start('usercho');
    try {
        const response = await fetch(`${serverRoot}/test.bin`);
        timmer.Stop('usercho', '服务器响应');
        if (!response.ok) {
            UI("✕", `HTTP Code ${response.status}`, "orange");
            return
        }
        UI("✓", "OK", "chartreuse");
    } catch (error) {
        timmer.Stop('usercho', '服务器响应');
        UI("✕", "Server Connect Failed", "orange");
        return
    }

    // 修改url
    ChangeURL('server', window.atob(serverRoot))
    if (!Debug) setTimeout(() => location.reload(), 1000);
    function UI(icon, text, color) {
        resultdiv.innerHTML = `<b>${icon}</b> ${text}`;
        resultdiv.style.color = color;
    }
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

// 替换URL参数
function ChangeURL(name, text) {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    if (params.has(name)) {
        params.set(name, text);
    } else {
        params.append(name, text);
    }
    url.search = params.toString();
    window.history.replaceState(null, '', url.toString());
}