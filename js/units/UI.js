import { ProgressInfo, ProgressInfo_English } from "../libs/config.js";
import { data, data2, updateCache, updateVMDCache } from "./updateCache.js";
import { InError } from "../3d.js";
let id, name, vmd, other, weapon, roledata;
let onload = 0;

async function Init() {
    try {
        Progress.Main(3);
        // 人物ID相关
        id = getUrlParams('id');
        const idnum = parseInt(id);
        // vmd加载相关
        const islocal = getUrlParams('localvmd');
        vmd = islocal ? -1 : (getUrlParams('vmd') ?? 0);
        // 缓存处理
        await updateCache('zh', InError);
        // 合规性检查
        if (isNaN(parseInt(vmd)) || vmd < -1 || vmd > 3) InError(2, `参数vmd值${vmd}非法`);
        if (isNaN(idnum) || idnum <= 0 || idnum > data[0]['total']) InError(2, `参数id值${id}非法`);
        // 获取文件夹名等
        other = getUrlParams('other') ?? false;
        roledata = other ? data2[id] : data[id];
        name = other ? roledata['folder'] : id;
        if (roledata['special']) name = roledata['folder'] + (getUrlParams(roledata['special']) ? `_${roledata['special']}` : '');
        weapon = roledata['weapons'];
        // UI相关
        document.getElementById('jsload').style.display = "none";
        document.getElementById('skybox').style.display = null;
        document.getElementById('module').style = null;
        document.getElementById('background').style = null;
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
        document.getElementById(`text${id}`).innerText = text + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`texte${id}`).innerText = texten + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`progress${id}`).style.width = (xhr.loaded / xhr.total * 100) + "%";
    }
}

const Finish = {
    // 完成计数
    Count: () => {
        // debugger
        if (onload != (2 + roledata['weapons'])) {
            onload++;
        } else {
            (vmd != 0) ? Finish.MMD() : Finish.Auto();
        }
    },
    // 主进度条
    Main: () => {
        let title = document.getElementsByClassName('title');
        for (let i = 0; i < title.length; i++) title[i].click();
        document.getElementById('text0').innerText = "加载完成, 请等待材质下载.";
        document.getElementById('texte0').innerText = "Loading finish, please wait for the material download.";
        document.getElementById('progress0').style.width = "100%";
        document.getElementById('three').style.top = "-60px";
    },
    // 天空盒
    Skybox: (isError = false) => {
        if (isError) {
            document.getElementById('progress3').style.backgroundColor = "red";
            InError(3);
        }
        document.getElementById('text3').innerText = "天空盒加载完成.";
        document.getElementById('texte3').innerText = "Skybox loading finish.";
        document.getElementById('progress3').style.width = "100%";
        document.getElementById('skybox').style.display = "none";
        Finish.Count();
    },
    // 模型加载完成
    Model: (id, iden, fatherID, text = '') => {
        document.getElementById(id).innerText = text + "加载完成, 请等待材质下载.";
        document.getElementById(iden).innerText = text + "Loading finish, please wait for the material download.";
        document.getElementById(fatherID).style.display = "none";
        Finish.Count();
    },
    // 未选择MMD
    Auto: async () => {
        // debugger
        Finish.Main();
        let from = other ? roledata['from'] : "神帝宇";
        let main = document.getElementById('main');
        let ok = document.getElementById('start');
        let a = document.createElement('h4');
        ok.onclick = () => document.getElementById('info').style.display = "none";
        document.getElementById('text0').innerText = "加载完成, 请等待材质下载.";
        document.getElementById('texte0').innerText = "Loading finish, please wait for the material download.";
        document.getElementById('progress0').style.width = "100%";
        a.innerHTML = `模型来源: ${from}<br><br>Model from: ${from}`;
        a.style.textAlign = "center"
        main.appendChild(a);
        setTimeout(() => document.getElementById('info').style.display = "none", 2000)
        console.log(`Model:\nID:${id} From:${from} Weapons:${data[id]['weapons']}`);
    },
    // 选择MMD
    MMD: async () => {
        Finish.Main();
        // 检查并获取缓存
        const vmddata = await updateVMDCache(InError);
        // 借物表
        const from = other ? roledata['from'] : "神帝宇";
        const main = document.getElementById('main');
        [`<br>`,
            `模型来源: ${from}<br>`,
            `Model source: ${from}<br><br>`,
            `动作来源: ${vmddata['from']}<br>`,
            `Action source: ${vmddata['from']}<br><br>`,
            `背景音乐: ${vmddata['name']}<br>`,
            `Background music: ${vmddata['name']}<br><br>`
        ].map((text) => {
            const a = document.createElement('a');
            a.style.margin = "0 auto"
            a.innerHTML = text;
            main.appendChild(a)
        });
        document.getElementById('start').style = null;
        console.log(`Model:\nID:${id} From:${from}\nAnimation:\nID:${vmd} Name:${vmddata['name']} From:${vmddata['from']}`);
    }
};

export {
    name,
    vmd,
    weapon,
    Progress,
    Finish,
    Init
}