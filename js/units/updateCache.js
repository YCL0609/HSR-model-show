import { Debug, serverRoot } from "../libs/serverInit.js";
import { vmd } from "./UI.js";
let data, data2, isCacheverok, isUpdate;
const langCfg = {
    zh: { data: null, data2: null, text: null },
    jp: { data: null, data2: null, text: null },
    en: { data: null, data2: null, text: null },
    ko: { data: null, data2: null, text: null },
    userSelect: null
};

async function updateCache(lang, InError) {
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

    // 判断是否需要更新
    const isCacheok = langData && mainData;
    const localVer = localStorage.getItem('lang_version')
    isCacheverok = serverVer && localVer == serverVer;
    isUpdate = !isCacheok || !isCacheverok;
    if (isUpdate || !isCacheok || !isCacheverok) {
        // 从网络获取数据
        Debug ? console.log('缓存: %c使用网络资源', 'color:#ff0') : null;
        try {
            await Promise.all([
                // 加载语言数据
                ...['data', 'data2', 'text'].map(async (name) => {
                    const response = await fetch(`${serverRoot}/lang/${lang}/${name}.json`);
                    if (!response.ok) InError(4, `语言文件 ${name}.json 获取失败: HTTP ${response.status} ${response.statusText}`);
                    const json = await response.json();
                    if (!langCfg[lang]) langCfg[lang] = { data: null, data2: null, text: null };
                    langCfg[lang][name] = json;
                }),
                // 加载 data.json
                (async () => {
                    const response = await fetch(`${serverRoot}/data.json`);
                    if (!response.ok) InError(4, `data.json 文件获取失败: HTTP ${response.status} ${response.statusText}`);
                    data = await response.json();
                })(),
                // 加载 data2.json
                (async () => {
                    const response2 = await fetch(`${serverRoot}/data2.json`);
                    if (!response2.ok) InError(4, `data2.json 文件获取失败: HTTP ${response.status} ${response.statusText}`);
                    data2 = await response2.json();
                })()
            ]).catch(error => InError(2, `异步获取资源失败: ${error.message}`, true));
            // 缓存数据并存储版本号
            localStorage.setItem(`lang_${lang}`, JSON.stringify(langCfg[lang]));
            localStorage.setItem('maindata', JSON.stringify({ 'data': data, 'data2': data2 }));
            if (serverVer) localStorage.setItem('lang_version', serverVer);
        } catch (error) { InError(3, `网络资源加载失败: ${error.message}`, true) }
    } else { // 使用缓存
        const parsed = JSON.parse(langData);
        if (!langCfg[lang]) langCfg[lang] = { data: null, data2: null, text: null };
        Object.assign(langCfg[lang], parsed);
        data = JSON.parse(mainData).data;
        data2 = JSON.parse(mainData).data2;
        Debug ? console.log('缓存: %c使用缓存资源', 'color:#0f0') : null;
    }
    console.log(`缓存版本: %c${localVer}`, 'color:#0ff');
}

async function updateVMDCache(InError) {
    const cacheData = localStorage.getItem('vmddata');
    if (vmd === -1) {
        return {
            from: "User Selent",
            name: "User Selent"
        };
    }
    if (!cacheData || !isCacheverok) {
        Debug ? console.log("副缓存: %c使用网络资源", "color:#ff0") : null;
        // 获取新数据
        const response = await fetch(`${serverRoot}/vmd/data.json`);
        if (!response.ok) InError(0, `HTTP ${response.status} ${response.statusText}`, `:${dataname}.json文件获取失败`);
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