import { ProgressInfo, ProgressInfo_English } from "../libs/config.js";
import { data, updateCache } from "./updateCache.js";
import { InError } from "../3d.js";
let id, name, vmd, weapon;

async function Init() {
    try {
        Progress.Main(3);
        // 人物ID相关
        id = getUrlParams('id');
        const idnum = parseInt(id);
        // vmd加载相关
        const islocal = getUrlParams('localvmd');
        const vmd = islocal ? -1 : (getUrlParams('vmd') ?? -1);
        // 缓存处理
        await updateCache('zh');
        // 合规性检查
        if (isNaN(parseInt(vmd)) || vmd < -1 || vmd > 3) InError(2, '非法参数');
        if (idnum > data[0]['total']) InError(2, '非法参数');
        // 获取文件夹名
        const roledata = data[id];
        const other = getUrlParams('other') ?? false;
        let name = other ? roledata['folder'] : id;
        if (roledata['special']) name = roledata['folder'] + (getUrlParams(roledata['special']) ? `_${roledata['special']}` : '');
        // UI相关
        document.getElementById('jsload').style.display = "none";
        document.getElementById('skybox').style.display = null;
        document.getElementById('module').style = null;
        document.getElementById('background').style = null;
        return [name, vmd, roledata['weapons']]
    } catch (e) {
        InError(0, e)
    }
}

const Progress = {
    Main: (level) => {
        const TextMain = document.getElementById('text0');
        const TextMainEnglish = document.getElementById('texte0');
        const ProgressBar = document.getElementById('progress0');
        if (!ProgressInfo.Main[level] || !ProgressInfo_English.Main[level]) return;
        TextMain.innerText = ProgressInfo.Main[level];
        TextMainEnglish.innerText = ProgressInfo_English.Main[level];
        ProgressBar.style.width = (level + 1) * 25 + "%";
    },
    Model: (id, xhr, text = '', texten = '') => {
        document.getElementById(`text${id} `).innerText = text + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`texte${id} `).innerText = texten + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`progress${id} `).style.width = (xhr.loaded / xhr.total * 100) + "%";
    }
}

export {
    name,
    vmd,
    weapon,
    Progress,
    Init
}