import { ProgressInfo, ProgressInfo_English } from "../libs/config.js";
const TextMain = document.getElementById('text0');
const TextMainEnglish = document.getElementById('texte0');
const ProgressBar = document.getElementById('progress0')


export function Progress(level) {
    if (!ProgressInfo[level] || !ProgressInfo_English[level]) return;
    TextMain.innerText = ProgressInfo[level];
    TextMainEnglish.innerText = ProgressInfo_English[level];
    ProgressBar.style.width = (level + 1) * 25 + "%";
    document.getElementById('jsload').style.display = level == 0 ? "block" : "none";
}