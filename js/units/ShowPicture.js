import { nopic_Main, nopic_other } from "../libs/config.js";
import { Timmer, serverRoot } from "../libs/serverInit.js";
import { langCfg, data } from "./updateCache.js";
import { InError } from "../index.js";

// 显示立绘
export function ShowPicture(id) {
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
            .catch(e => { console.log(e) })
    }
    Timmer.Stop('showpic', '显示立绘')
}