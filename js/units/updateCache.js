import { Debug, serverRoot } from "../libs/serverInit.js";
import { InError } from "./InError.js";
let data, data2, isUpdate;
const langCfg = {
    zh: { data: null, data2: null, text: null },
    ja: { data: null, data2: null, text: null },
    en: { data: null, data2: null, text: null },
    ko: { data: null, data2: null, text: null },
    userSelect: null
};

async function updateCache(lang) {
    // 获取本地缓存
    const langData = localStorage.getItem(`lang_${lang}`);
    const mainData = localStorage.getItem('maindata');

    // 获取服务器版本信息
    let serverVer = null;
    try {
        const response = await fetch(`${serverRoot}/lang/version.txt`);
        if (response.ok) serverVer = await response.text();
    } catch (error) {
        Debug ? console.log('缓存: %c版本号检查失败强制使用本地缓存!', 'color:#f00') : null;
        serverVer = localStorage.getItem('lang_version');
    }
    serverVer = serverVer.trim(); // 去除多余的空格和换行符

    // 判断是否需要更新
    const isCacheok = langData != null && mainData != null;
    const localVer = (localStorage.getItem('lang_version') ?? '').trim();
    const isVerok = serverVer != null && localVer == serverVer;
    isUpdate = !isCacheok || !isVerok;
    if (isUpdate) {
        // 从网络获取数据
        Debug ? console.log('缓存: %c使用网络资源', 'color:#ff0') : null;
        try {            
            await Promise.all([
                // 加载语言数据
                ...['data', 'data2', 'text'].map(async (name) => {
                    const response = await fetch(`${serverRoot}/lang/${lang}/${name}.json`);
                    if (!response.ok) InError(5, `${name}.json: HTTP ${response.status} ${response.statusText}`, true);
                    const json = await response.json();
                    if (!langCfg[lang]) langCfg[lang] = { data: null, data2: null, text: null };
                    langCfg[lang][name] = json;
                }),
                // 加载 data.json
                (async () => {
                    const response = await fetch(`${serverRoot}/data.json`);
                    if (!response.ok) InError(5, `data.json: HTTP ${response.status} ${response.statusText}`, true);
                    data = await response.json();
                })(),
                // 加载 data2.json
                (async () => {
                    const response2 = await fetch(`${serverRoot}/data2.json`);
                    if (!response2.ok) InError(5, `data2.json: HTTP ${response2.status} ${response2.statusText}`, true);
                    data2 = await response2.json();
                })()
            ]).catch(error => InError(4, `Failed to fetch resource: ${error.message}`, true));
            // 检测获取的版本是否为CDN缓存的旧版本
            if (data[0].version2 != serverVer) {
                const msgText = (lang == 'zh') ? "远程资源版本号冲突，可能是 CDN 未完全同步更新或浏览器缓存延迟所致!" : "Remote resource version conflict is likely due to incomplete CDN synchronization or browser cache latency.";
                console.log(`错误: %c远程资源版本号冲突 -> ${data[0].version2} != ${serverVer}`, 'color: orange');
                InError(3, msgText);
                serverVer = "-1";
            }
            // 缓存数据并存储版本号
            localStorage.setItem(`lang_${lang}`, JSON.stringify(langCfg[lang]));
            localStorage.setItem('maindata', JSON.stringify({ 'data': data, 'data2': data2 }));
            localStorage.setItem('lang_version', serverVer);
        } catch (error) { InError(0, error.message, true) }
    } else { // 使用缓存
        const parsed = JSON.parse(langData);
        if (!langCfg[lang]) langCfg[lang] = { data: null, data2: null, text: null };
        Object.assign(langCfg[lang], parsed);
        data = JSON.parse(mainData).data;
        data2 = JSON.parse(mainData).data2;
        Debug ? console.log('缓存: %c使用缓存资源', 'color:#0f0') : null;
    }
    console.log(`缓存版本: %c${isVerok ? localVer : serverVer + '*'}`, 'color:#0ff');
}

async function updateVMDCache(vmd) {
    const cacheData = localStorage.getItem('vmddata');
    if (vmd === -1) return { from: "User Selent", name: "User Selent" };
    if (!cacheData || isUpdate) {
        Debug ? console.log("副缓存: %c使用网络资源", "color:#ff0") : null;
        // 获取新数据
        const response = await fetch(`${serverRoot}/vmd/data.json`);
        if (!response.ok) InError(5, `${dataname}.json: HTTP ${response.status} ${response.statusText}`, true);
        const newdata = await response.json();
        // 缓存数据
        localStorage.setItem('vmddata', JSON.stringify(newdata))
        return newdata[vmd];
    } else {
        Debug ? console.log("副缓存: %c使用缓存资源", "color:#0f0") : null;
        return JSON.parse(cacheData)[vmd];
    }
}

export {
    data,
    data2,
    langCfg,
    updateCache,
    updateVMDCache
}