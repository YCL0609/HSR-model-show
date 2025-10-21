import { langList } from "./libs/config.js";
import { Timmer } from "./libs/serverInit.js";
import { ChangeLang } from "./units/ChangeLang.js";

export function init() {
    Timmer.Start('init');
    // 用户语言选择
    let lang
    if (localStorage.userlang === undefined || !langList.includes(localStorage.userlang)) {
        const langPrefix = navigator.language.split('-')[0].toLowerCase();
        lang = (langList.includes(langPrefix)) ? langPrefix : "zh";
    } else {
        lang = localStorage.userlang;
    }
    Timmer.Stop('init', '初始化');
    try {
        ChangeLang(lang);
    } catch (error) {
        InError(0, error.stack);
    }
}

// 错误处理
export function InError(errid = 0, errtxt, isThrow = false) {
    const errName = {
        0: "未知错误",
        1: "无可用服务器", // 已废弃
        2: "服务器连接失败",
        3: "语言数据获取失败",
        4: "角色数据获取失败",
        5: "表格数据填充错误",
        6: "角色信息获取失败"
    };
    console.log(`%c${errName[errid]}: ${errtxt}`, 'color: orange');
    document.getElementsByClassName('fault')[0].innerHTML = `Script Error (Code ${errid}): ${errtxt}`;
    if (isThrow) { throw new Error(errName[errid]) }
}