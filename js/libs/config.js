const server = {
    list: ['//server0.ycl.cool/srroot', '//server1.ycl.cool/srroot'],
    info: ['主服务器(Main Server)', '备用服务器(Backup Server)'],
    debug: {
        http: "//localhost:8081",
        https: "//localhost/sr_db"
    }
}

const langList = ['zh', 'en', 'ko', 'ja'];
const nopic_other = [12, 17] // 其他无人物介绍立绘
const nopic_Main = [4, 45, 53, 65] // 开拓者
const nopic = nopic_Main.concat(nopic_other); // 无介绍立绘id

const ProgressInfo = {
    Main: [
        '加载依赖文件...',
        '初始化加载器...',
        '加载模型...',
        '等待响应...',
        '加载完成, 请等待材质下载.'
    ],
    Model: [
        '模型文件:',
        '模型和动作文件:'
    ],
    Skybox: '天空盒加载完成.'
}

const ProgressInfo_English = {
    Main: [
        'Loading dependency files...',
        'Initialize the loader...',
        'Loading model...',
        'Waiting for a response...',
        'Loading finish, please wait for the material download.'
    ],
    Model: [
        'Model Files:',
        'Model and Action Files:'
    ],
    Skybox: 'Skybox loading finish.'
}

export {
    server,
    langList,
    nopic,
    nopic_other,
    nopic_Main,
    ProgressInfo,
    ProgressInfo_English
};