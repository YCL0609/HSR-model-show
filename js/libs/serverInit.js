import { isDebug, DbgTimmer, getUrlParams, ServerChoose } from "YCL-Public-library"
import { server } from "./config.js";
export const Debug = isDebug();
export const Timmer = new DbgTimmer(Debug);
export let serverRoot = '';

export async function serverInit() {
  Timmer.Start('serverInit')
  // 调试初始化
  let debugRoot = '';
  if (Debug) {
    const protocol = window.location.protocol.slice(0, -1);
    if (server.debug[protocol]) debugRoot = server.debug[protocol];
  }
  // 获取可用服务器
  serverRoot = debugRoot ? debugRoot : await getServer(server.list);
  if (serverRoot === -1) return 1;
}

// 获取可用服务器
async function getServer() {
  try {
    const userSelect = getUrlParams('server');
    if (server.list[userSelect]) return server.list[userSelect];
    const results = await ServerChoose(server.list, Debug);
    if (results.length === 0) return -1;
    return results[0].url;
  } catch (_) { return -1; }
}