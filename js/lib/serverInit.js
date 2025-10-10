import { server } from "./config.js";

async function serverInit(mainfile) {
  const Debug = isDebug();
  const Timmer = new DbgTimmer(Debug);
  // 获取可用服务器
  Timmer.Start('serverInit')
  const serverRoot = await getServer();
  if (serverRoot === -1) return 1;
  // 动态创建Import Map
  const importMap = {
    imports: {
      "three": `${serverRoot}/srroot/js/three.js/three.module.min.js`,
      "three/": `${serverRoot}/srroot/js/three.js/`
    }
  };
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify(importMap);
  document.head.appendChild(script);
  // 加载主文件
  if (!mainfile) return 2;
  try {
    const mainModule = await import(mainfile)
    if (typeof mainModule.init !== 'function') return 3;
    Timmer.Stop('serverInit', '服务器初始化');
    mainModule.init(serverRoot, Debug);
    return 0
  } catch (err) {
    console.log(err.stack);
    return 4;
  }
}

// 获取可用服务器
async function getServer() {
  return server.list[0]; // Debug
  // const response0 = await fetch(server.list[0]);
  // if (response0.ok) return server.list[0];
  // const response1 = await fetch(server.list[1])
  // if (response1.ok) return server.list[1];
  // return -1
}

// 用户服务器选择
function userChooseServer() {
  const selent = document.getElementById('server');
  const serverID = selent.options[selent.selectedIndex].value;
  if (serverID == -1) return;
  urlChange('server', serverID);
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

window.serverInit = serverInit;
window.userChooseServer = userChooseServer;
window.serverInfo = server.info;