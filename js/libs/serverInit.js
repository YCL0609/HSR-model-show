// import { isDebug, DbgTimmer, getUrlParams, ServerChoose, loadExternalResource } from "../../outsite/dist/function.esm.min.js"
import { isDebug, DbgTimmer, getUrlParams, ServerChoose, loadExternalResource } from "https://tool.ycl.cool/public-library/function.esm.min.js"
import { server } from "./config.js";
export const Debug = isDebug();
export const Timmer = new DbgTimmer(Debug);
export let serverRoot = '';

async function serverInit() {
  Timmer.Start('serverInit')
  // 调试初始化
  let debugRoot = '';
  if (Debug) {
    const protocol = window.location.protocol.slice(0, -1);
    if (server.debug[protocol]) debugRoot = server.debug[protocol];
  }
  // 获取可用服务器
  serverRoot = debugRoot ? debugRoot : await getServer();
  if (serverRoot === -1) return 1;
  // 动态创建Import Map
  const importMap = {
    imports: {
      "three": `${serverRoot}/js/three.module.min.js`,
      "three/": `${serverRoot}/js/`
    }
  };
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify(importMap);
  document.head.appendChild(script);
}

// 获取可用服务器
async function getServer() {
  try {
    const userSelect = getUrlParams('server');
    if (server.list[userSelect]) return server.list[userSelect];
    const servers = await ServerChoose(server.list, Debug);
    if (servers.length === 0) return -1;
    return server[0].url;
  } catch (_) { return -1; }
}

export {
  serverInit,
  getUrlParams,
  loadExternalResource,
}