const ErrorInfo = {
    zh: [
        '未知错误', // 0
        // 初始化
        '服务器连接失败',
        '依赖文件加载错误',
        // 缓存
        '远程资源版本不一致',
        '远程资源获取出错',
        '远程资源获取失败', // 5
        // 主页面
        '表格数据填充错误',
        '角色详细信息获取失败',
        // 3D
        '页面参数错误',
        "three.js初始化错误",
        "天空盒加载错误", // 10
        "场景模型加载错误",
        "人物模型加载错误",
        "武器模型加载错误",
        "MMD声音文件加载错误"
    ],
    en: [
        'Unknown error',
        'Server connection failed',
        'Dependency file loading error',
        'Remote resource version inconsistency',
        'Remote resource acquisition error',
        'Remote resource acquisition failed',
        'Table data population error',
        'Role detail information acquisition failed',
        'Page parameter error',
        'three.js initialization error',
        'Skybox loading error',
        'Scene model loading error',
        'Character model loading error',
        'Weapon model loading error',
        'MMD sound file loading error'
    ]
}

export function InError(errid = 0, errtxt = '', isThrow = false) {
    if (isNaN(errid)) return;
    const errorBox = document.getElementById('error');
    const errName = ErrorInfo[localStorage.userlang] ?? ErrorInfo['en'];
    errorBox.innerText += `Script error (Code ${errid}): ${errName[errid]}\n${errtxt}\n`;
    console.log(`错误: %c${errName[errid]}: ${errtxt}`, 'color: red');
    if (isThrow) throw new Error(errName[errid]);
}