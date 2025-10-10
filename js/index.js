import { nopic, nopic_other, nopic_Main, langList } from "./lib/config.js";
let Debug = false;
const Timmer = new DbgTimmer();
let serverRoot, data, data2;

const langCfg = {
    zh: { data: null, data2: null, text: null },
    jp: { data: null, data2: null, text: null },
    en: { data: null, data2: null, text: null },
    ko: { data: null, data2: null, text: null },
    userSelect: null
};

export function init(FileRoot, inDebug) {
    Timmer.setEnable(inDebug);
    Timmer.Start('init');
    serverRoot = FileRoot;
    // 调试初始化
    if (inDebug) {
        Debug = true;
        const id = getUrlParams('debug');
        const DebugID = id === undefined ? true : id;
        console.log(`是否使用本地文件: %c${DebugID ? true : false}`, 'color: #0ff');
        if (DebugID[0]) {
            const protocol = window.location.protocol;
            const port = (protocol == "https:") ? "/sr_db" : ":8081";
            serverRoot = `${protocol}//localhost${port}`; // 使用模板字符串
        }
    }
    // 用户语言选择
    if (localStorage.userlang === undefined || !langList.includes(localStorage.userlang)) {
        const langPrefix = navigator.language.split('-')[0].toLowerCase();
        const lang = (langList.includes(langPrefix)) ? langPrefix : "zh";
        langCfg.userSelect = lang
        localStorage.setItem('userlang', lang);
    } else {
        langCfg.userSelect = localStorage.userlang;
    }
    Timmer.Stop('init', '初始化')
    try {
        ChangeLang(langCfg.userSelect);
    } catch (error) { InError(0, error.stack) }
}

// 语言切换
async function ChangeLang(lang) {
    if (langCfg.userSelect === lang) return;
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
    let langData = localStorage.getItem(`lang_${lang}`);
    let mainData = localStorage.getItem('maindata');

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

// 生成表格
function WriteToTable(data, text, ismain) {
    Timmer.Start(`totab${ismain ? 'Main' : ''}`);
    try {
        // 生成未分类表格单元格
        if (!ismain) {
            const tbody = document.getElementById('unknow');
            if (tbody.dataset.gencell) {
                const cell_array = Array.from({ length: data[0]['total_line'] }, (_, i) =>
                    Array.from({ length: 3 }, (_, j) => (i + 1) * 10 + (j + 1))
                );
                cell_array.map((item) => {
                    const tr = document.createElement('tr');
                    item.map((id) => {
                        const td = document.createElement('td');
                        td.id = `table3-${id}`;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                })
            }
        }

        // 缓存所有需要操作的 DOM 节点及其 DocumentFragment
        const cellFragments = {};
        const phoneCellFragments = {};

        // 填表
        for (let i = 1; i <= data[0]['total']; i++) {
            const cellId = data[i]['data'].replace(',', '');
            const cell = document.getElementById(`table${ismain ? '' : '3'}-${cellId}`);
            if (!cell) continue;

            // 获取表格片段
            if (!cellFragments[cellId]) {
                cellFragments[cellId] = document.createDocumentFragment();
            }
            const fragment = cellFragments[cellId];
            const a = document.createElement('a');
            const note = document.createElement('a');
            const br = document.createElement('br');
            a.innerText = text[i].name;
            a.style.userSelect = "none";
            a.style.cursor = "pointer";
            note.classList = "note-mark";

            if (ismain) {
                a.onclick = e => {
                    e.preventDefault();
                    document.getElementsByClassName('overlay')[0].style.display = "block";
                    ShowPicture(i);
                };

                if (!data[i]['model']) {
                    a.style.color = "aqua";
                    note.innerText = "(2)";
                    note.href = "#note3";
                } else if (nopic.includes(i)) {
                    a.style.color = "greenyellow";
                    note.innerText = "(1)";
                    note.href = "#note2";
                }
            } else {
                a.style.textDecoration = "none";
                a.style.color = "#000";
                a.href = `3d.html?id=${i}&other=y`;
            }

            // 添加到Fragment
            fragment.appendChild(a);
            fragment.appendChild(note);
            fragment.appendChild(br);

            // 主表格续表
            if (ismain && cell.dataset.phone === '1') {
                const table2 = document.getElementById(`table2-${cellId}`);
                if (table2) {
                    if (!phoneCellFragments[cellId]) {
                        phoneCellFragments[cellId] = document.createDocumentFragment();
                    }
                    const fragment2 = phoneCellFragments[cellId];
                    const a2 = a.cloneNode(true);
                    const note2 = note.cloneNode(true);
                    const br2 = br.cloneNode(true);
                    a2.onclick = e => {
                        e.preventDefault();
                        document.getElementsByClassName('overlay')[0].style.display = "block";
                        ShowPicture(i);
                    };
                    fragment2.appendChild(a2);
                    fragment2.appendChild(note2);
                    fragment2.appendChild(br2);
                }
            }
        }

        // 插入主表格片段
        for (const cellId in cellFragments) {
            const cell = document.getElementById(`table${ismain ? '' : '3'}-${cellId}`);
            if (cell) cell.appendChild(cellFragments[cellId]);
        }

        // 插入手机版表格片段
        if (ismain) {
            for (const cellId in phoneCellFragments) {
                const table2 = document.getElementById(`table2-${cellId}`);
                if (table2) table2.appendChild(phoneCellFragments[cellId]);
            }
        }

    } catch (error) { InError(5, (ismain ? '主表格错误' : '副表格错误') + error.stack, true) }
    Timmer.Stop(`totab${ismain ? 'Main' : ''}`, `${ismain ? '主' : '副'}表格生成`);
}

// 显示立绘
function ShowPicture(id) {
    if (id == -1) { // 关闭立绘展示
        document.getElementsByClassName('overlay')[0].style.display = 'none';
        document.getElementById('btn1').style.display = 'none';
        document.getElementById('nomodel').style.display = 'none';
        document.getElementById('img0').dataset.imgdata = 'no';
        document.getElementById('img1').style.display = 'none';
        return
    }
    Timmer.Start('showpic');
    const lang = langCfg.userSelect;
    const text = langCfg[lang]['text'];
    const data_text = langCfg[lang]['data'];

    try {
        document.getElementById('name').innerHTML = data_text[id]['name']; // 姓名
        // 属性和命途
        const parts = data[id]['data'].split(",");
        const [line, list] = [parts[0], parts[1]];
        document.getElementById('line').innerText = text.linedata[line - 1];
        document.getElementById('list').innerText = text.listdata[list - 1];
        document.getElementById('firstup').innerText = data[id]['firstup']; // 首次跃迁

        // 模型
        const btn0 = document.getElementById('btn0');
        const btn1 = document.getElementById('btn1');
        btn0.innerText = "查看(Show)";
        btn0.onclick = () => { location.href = `3d.html?id=${id}` };
        if (!data[id].model) {
            document.getElementById('nomodel').style.display = null;
            btn0.style.display = 'none';
            btn1.style.display = 'none';
        }
        if (data[id].special) {
            btn0.innerText = data_text[id].special[0];
            btn1.style.display = null;
            btn1.innerText = data_text[id].special[1];
            btn1.onclick = () => { location.href = `3d.html?id=${id}&${data[id]['special']}=1` };
        }
    } catch (error) {
        InError(6, error.stack);
    }

    // 图像
    const img0 = document.getElementById('img0');
    const img1 = document.getElementById('img1');
    img0.src = `${serverRoot}/img/character/${lang}/${id}.jpg`;
    if (nopic_Main.includes(id)) { // 开拓者
        img0.dataset.imgdata = "two";
        img1.style.display = null;
        img1.src = `${serverRoot}/img/character/${lang}/${id}_isman.jpg`;
        Debug ? log(`ID:${id} 使用双立绘`) : null
    } else if (nopic_other.includes(id)) { // 无人物介绍立绘
        img0.dataset.imgdata = "center";
        Debug ? log(`ID:${id} 使用大招立绘`) : null
    } else {
        fetch(`${serverRoot}/img/character/${lang}/${id}.txt`, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    img0.src = `${serverRoot}/img/character/zh/${id}.jpg`;
                    Debug ? log(`ID:${id} 使用中文立绘图`) : null
                }
            })
    }
    Timmer.Stop('showpic', '显示立绘')
}

// 错误处理
function InError(errid = 0, errtxt, isThrow = false) {
    const errName = {
        0: "未知错误",
        1: null,
        2: "服务器连接失败",
        3: "语言数据获取失败",
        4: "角色数据获取失败",
        5: "表格数据填充错误",
        6: "角色信息获取失败"
    };
    console.log(`%c${errName[errid]}: ${errtxt}`, 'color: orange');
    document.getElementsByClassName('fault')[0].innerHTML = `<i>Error Code ${errid}</i> ` + langCfg[langCfg.userSelect]["errInfo"];
    if (isThrow) { throw new Error(errName[errid]) }
}