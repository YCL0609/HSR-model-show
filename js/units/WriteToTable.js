import { InError } from "./InError.js";
import { nopic } from "../libs/config.js";
import { Timmer } from "../libs/serverInit.js";
import { ShowPicture } from "./ShowPicture.js";

// 生成表格
export function WriteToTable(data, text, ismain) {
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
            if (!cellFragments[cellId]) cellFragments[cellId] = document.createDocumentFragment();
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
                    document.getElementsByClassName('overlay')[0].style.display = "flex";
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
                        document.getElementsByClassName('overlay')[0].style.display = "flex";
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

    } catch (error) { InError(6, (ismain ? 'Main form error' : 'Sub form error') + error.stac) }
    Timmer.Stop(`totab${ismain ? 'Main' : ''}`, `${ismain ? '主' : '副'}表格生成`);
}