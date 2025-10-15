let data, vmd, id, islocal, isCacheverok;
let onload = 0;
const other = getUrlParams('other'); // 模型数据
let cacheData = localStorage.getItem('maindata');
const dataname = other ? "data2" : "data";



export function Start(divid, id, cn, en) { // 添加进度条UI
    let info = document.createElement('div');
    info.id = divid;
    info.innerHTML = `
    <a>${cn}</a><a id="text${id}" class="text">等待启动...</a><br>
    <a>${en}</a><a id="texte${id}" class="text">Waiting for the start...</a>
    <div class="progress">
    <div id="progress${id}" class="progress-inside" style="width: 0%"></div>
    </div>`;
    document.getElementById('info-main').appendChild(info);
}

export const Progress = {
    // 模型加载进度条

}

export const Finish = {
    // 天空盒
    Skybox: (isError) => {
        if (isError) document.getElementById('progress3').style.backgroundColor = "red"
        document.getElementById('text3').innerText = "天空盒加载完成.";
        document.getElementById('texte3').innerText = "Skybox loading finish.";
        document.getElementById('progress3').style.width = "100%";
        setTimeout(() => {
            document.getElementById('skybox').style.display = "none";
            vmd ? Finish.MMD() : Finish.Auto();
        }, 2000);
    },

    // 未选择MMD
    Auto: async () => {
        if (onload != (2 + data[id]['weapons'])) {
            onload++;
            return
        }
        FinishGUI();
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

    // 模型加载完成
    Model: (id1, id1en, id2, text = '') => {
        document.getElementById(id1).innerText = text + "加载完成, 请等待材质下载.";
        document.getElementById(id1en).innerText = text + "Loading finish, please wait for the material download.";
        setTimeout(() => {
            document.getElementById(id2).style.display = "none";
            vmd ? Finish.MMD() : Finish.Auto();
        }, 2000);
    },

    // 选择MMD
    MMD: async () => {
        if (onload != (2 + data[id]['weapons'])) {
            onload++;
            return
        }
        FinishGUI();
        // 检查缓存
        let vmddata
        const cacheData = localStorage.getItem('vmddata');
        if (!cacheData || !isCacheverok) {
            Debug ? console.log("副缓存: %c使用网络资源", "color:#ff0") : null;
            // 获取新数据
            const response = await fetch(`${serverRoot}/vmd/data.json`);
            if (!response.ok) Error(0, `HTTP ${response.status} ${response.statusText}`, `:${dataname}.json文件获取失败`);
            const newdata = await response.json();
            vmddata = newdata[vmd];
            // 缓存数据
            localStorage.setItem('vmddata', JSON.stringify(newdata))
        } else {
            Debug ? console.log("副缓存: %c使用缓存资源", "color:#0f0") : null;
            vmddata = JSON.parse(cacheData)[vmd];
        }
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
}

function FinishGUI() {
    let title = document.getElementsByClassName('title');
    for (let i = 0; i < title.length; i++) title[i].click();
    document.getElementById('text0').innerText = "加载完成, 请等待材质下载.";
    document.getElementById('texte0').innerText = "Loading finish, please wait for the material download.";
    document.getElementById('progress0').style.width = "100%";
    document.getElementById('three').style.top = "-60px";
}

export function Error(code, error, errtext = '') { // 错误处理
    if (Number(DebugID[3])) {
        const Info = [
            "初始化错误",
            "URL参数错误",
            "three.js初始化错误",
            "天空盒加载错误",
            "场景模型加载错误",
            "人物模型加载错误",
            "武器模型加载错误",
            "MMD声音文件加载错误"
        ];
        const PoopDiv = document.createElement('div');
        const b = document.createElement('b');
        PoopDiv.classList = "poop";
        PoopDiv.style.backgroundColor = "#f00000e0";
        b.innerHTML = `${Info[code]}${errtext} - ${error}`;
        PoopDiv.appendChild(b);
        document.getElementById('error').append(PoopDiv)
    } else { debugger }
}