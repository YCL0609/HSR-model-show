let data, vmd, id, islocal, isCacheverok;
let onload = 0;
const other = getUrlParams('other'); // 模型数据
let cacheData = localStorage.getItem('maindata');
const dataname = other ? "data2" : "data";

export async function Init() {
    try {
        Progress.main(3);
        // 人物ID相关
        id = getUrlParams('id');
        const idnum = parseInt(id);
        if (isNaN(idnum) || idnum < 1) Error(1, 'The parameter is invalid', ":参数'id'不是数字或在可接受范围外");
        // vmd加载相关
        islocal = getUrlParams('localvmd');
        if (islocal === null || islocal === undefined) {
            islocal = false;
            vmd = getUrlParams('vmd');
            if (vmd === null || vmd === undefined) vmd = 0
        } else { vmd = -1 }
        if (isNaN(parseInt(vmd)) || vmd < -1 || vmd > 3) Error(2, 'The parameter is invalid', ":参数'vmd'不是数字或在可接受范围外");
        // 获取人物数据
        try {
            // 检查本地缓存版本
            let serverVer;
            const response = await fetch(`${serverRoot}/lang/version.txt`);
            if (response.ok) serverVer = await response.text();
            isCacheverok = serverVer && localStorage.getItem('lang_version') == serverVer;
            if (!cacheData && !isCacheverok) {
                Debug ? console.log("主缓存: %c使用网络资源", "color:#ff0") : null;
                // 更新数据
                const response2 = await fetch(`${serverRoot}/${dataname}.json`);
                if (!response2.ok) Error(0, `HTTP ${response2.status} ${response2.statusText}`, `:${dataname}.json文件获取失败`);
                data = await response2.json();
                // 缓存数据
                let dataB;
                const datanameB = other ? "data" : "data2";
                if (cacheData) {
                    try {
                        const parsedCacheData = JSON.parse(cacheData);
                        dataB = parsedCacheData[datanameB] ?? null;
                    } catch (_) { dataB = null }
                } else { dataB = null }
                localStorage.setItem('maindata', JSON.stringify({ [dataname]: data, [datanameB]: dataB }));
                localStorage.setItem('lang_version', serverVer);
            } else {
                Debug ? console.log("主缓存: %c使用缓存资源", "color:#0f0") : null;
                data = JSON.parse(cacheData)[dataname];
            }
        } catch (error) { Error(2, error.stack, ':本地缓存版本检查失败') }
        // 获取文件夹名
        const roledata = data[id];
        let name = other ? roledata['folder'] : id;
        if (roledata['special']) name = roledata['folder'] + (getUrlParams(roledata['special']) ? `_${roledata['special']}` : '');
        // ID合规性检查2
        if (idnum > data[0]['total']) Error(1, 'The parameter is invalid', ":参数'id'不是数字或在可接受范围外");
        // UI相关
        document.getElementById('jsload').style.display = "none";
        document.getElementById('skybox').style.display = null;
        document.getElementById('module').style = null;
        document.getElementById('background').style = null;
        return [name, vmd, roledata['weapons'], islocal]
    } catch (e) {
        Error(0, e)
    }
}

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
    Model: (id, xhr, text = '', texten = '') => {
        document.getElementById(`text${id}`).innerText = text + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`texte${id}`).innerText = texten + "(" + (xhr.loaded / 1024).toFixed(0) + " KB/" + (xhr.total / 1024).toFixed(0) + " KB)";
        document.getElementById(`progress${id}`).style.width = (xhr.loaded / xhr.total * 100) + "%";
    }
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