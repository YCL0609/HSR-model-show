import { server } from "./config.js";
export const Debug = isDebug();
export const Timmer = new DbgTimmer(Debug);
export let serverRoot = '';

async function serverInit(mainfile) {
  Timmer.Start('serverInit')
  // 调试初始化
  let debugRoot = '';
  if (Debug) {
    const id = getUrlParams('debug');
    const islocal = id === undefined ? true : id;
    console.log(`是否使用本地文件: %c${islocal ? true : false}`, 'color: #0ff');
    if (islocal) {
      const protocol = window.location.protocol.slice(0, -1);
      if (server.debug[protocol]) debugRoot = server.debug[protocol];
    }
  }
  // 获取可用服务器
  serverRoot = debugRoot ? debugRoot : await getServer();
  if (serverRoot === -1) return 1;
  // 动态创建Import Map
  const importMap = {
    imports: {
      "three": `${serverRoot}/js/lib/three.js/three.module.min.js`,
      "three/": `${serverRoot}/js/lib/three.js/`
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
    mainModule.init();
    return 0
  } catch (err) {
    console.error(err.stack);
    return 4;
  }
}

// 获取可用服务器
async function getServer() {
  try {
    return server.list[0]; // Debug
    // const userSelect = getUrlParams('server');
    // if (server.list[userSelect]) return server.list[userSelect];
    // const response0 = await fetch(server.list[0]);
    // if (response0.ok) return server.list[0];
    // const response1 = await fetch(server.list[1])
    // if (response1.ok) return server.list[1];
    // return -1
  } catch (_) { return -1; }
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

export { serverInit, userChooseServer };