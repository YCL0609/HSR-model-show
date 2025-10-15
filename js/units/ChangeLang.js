import { data, data2, langCfg, updateCache } from "./updateCache.js";
import { Debug, Timmer } from "../libs/serverInit.js";
import { WriteToTable } from "./WriteToTable.js";
import { langList } from "../libs/config.js";
import { InError } from "../index.js";

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

    // 处理缓存（等待完成，保证 data/data2/langCfg 已被填充）
    await updateCache(lang, langCfg);

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