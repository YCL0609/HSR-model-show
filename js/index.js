import { langList } from "./libs/config.js";
import { Timmer, serverInit } from "./libs/serverInit.js";
import { InError } from "./units/InError.js";
import { ChangeLang } from "./units/ChangeLang.js";

langList.forEach(btn => {
    document.getElementById(btn).addEventListener('click', () => ChangeLang(btn))
});

document.getElementById('picClose').addEventListener('click', () => {
    document.getElementsByClassName('overlay')[0].style.display = 'none';
    document.getElementById('btn1').style.display = 'none';
    document.getElementById('nomodel').style.display = 'none';
    document.getElementById('img0').dataset.imgdata = 'no';
    document.getElementById('img1').style.display = 'none';
})

serverInit()
    .then(initCode => {
        if (initCode !== undefined) {
            document.getElementById('error').innerText = `Script fault (code ${initCode}): Script initialization error!`;
            console.log(`%cScript fault (code ${initCode}): Script initialization error!`, 'color:red')
        } else {
            try {
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
                ChangeLang(lang);
            } catch (error) {
                InError(0, error.stack, true);
            }
        }
    })