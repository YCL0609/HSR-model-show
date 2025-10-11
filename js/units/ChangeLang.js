import { Debug, Timmer, serverRoot } from "../libs/serverInit.js";
import { langList } from "../libs/config.js";
import { WriteToTable } from "./WriteToTable.js";
import { InError } from "../index.js";

export let data, data2;
export const langCfg = {
    zh: { data: null, data2: null, text: null },
    jp: { data: null, data2: null, text: null },
    en: { data: null, data2: null, text: null },
    ko: { data: null, data2: null, text: null },
    userSelect: null
};

// 语言切换
export async function ChangeLang(lang) {
    Timmer.Start('lang');
    // 保存语言数据
    langCfg.userSelect = lang;
    localStorage.setItem('userlang', lang);
    Debug ? console.log(`语言切换为 ${lang}`) : null;

    // 清空表格
    try {
        const formcell = Array.from({ length: 8 }, (_, i) =>
            Array.from({ length: 7 }, (_, j) => (i + 1) * 10 + (j + 1))
        ).flat();
        formcell.forEach(id => {
            const maincell = document.getElementById(`table-${id}`);
            maincell.innerHTML = "";
            const phonecell = document.getElementById(`table2-${id}`);
            if (!phonecell) return;
            phonecell.innerHTML = "";
        });
        document.getElementById('unknow').innerHTML = "";
    } catch (error) { InError(0, error.stack) }

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
    const isCacheverok = serverVer && localStorage.getItem('lang_version') == serverVer;
    if (!isCacheok || !isCacheverok) {
        // 从网络获取数据
        Debug ? console.log('缓存: %c使用网络资源', 'color:#ff0') : null;
        try {
            await Promise.all([
                // 加载语言数据
                ...['data', 'data2', 'text'].map(async (name) => {
                    const response = await fetch(`${serverRoot}/lang/${lang}/${name}.json`);
                    if (!response.ok) InError(4, `语言文件 ${name}.json 获取失败: HTTP ${response.status} ${response.statusText}`);
                    const json = await response.json();
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
        langCfg[lang] = JSON.parse(langData);
        data = JSON.parse(mainData).data;
        data2 = JSON.parse(mainData).data2;
        Debug ? console.log('缓存: %c使用缓存资源', 'color:#0f0') : null;
    }

    // 处理页脚
    document.getElementById('ver0').innerHTML = data[0]['version'];
    document.getElementById('ver1').innerHTML = data[0]['version2'];
    // 处理主副表格
    WriteToTable(data, langCfg[lang].data, true);
    WriteToTable(data2, langCfg[lang].data2, false);

    // 处理文字翻译
    try {
        for (let i = 1; i <= 17; i++) {
            document.getElementById(`text${i}`).innerHTML = langCfg[lang]['text'][i];
        }
        ['tip', 'warn', 'error', 'note'].forEach((id) => {
            document.getElementsByClassName(id)[0].innerHTML = langCfg[lang]['text'][id];
        })
    } catch (error) { InError(0, error.stack) }

    // 处理按钮视觉效果
    langList.forEach((id) => {
        document.getElementById(id).dataset.selent = (id === lang) ? 1 : 0;
    })

    Timmer.Stop('lang', '语言切换');
}