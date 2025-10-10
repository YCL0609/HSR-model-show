const server = {
    list: ['//server0.ycl.cool', '//server1.ycl.cool'],
    info: ['主服务器(Main Server)', '备用服务器(Backup Server)']
}

const langList = ['zh', 'en', 'ko', 'jp'];

const nopic_other = [12, 17] // 其他无人物介绍立绘
const nopic_Main = [4, 45, 53, 65] // 开拓者
const nopic = nopic_Main.concat(nopic_other); // 无介绍立绘id

export { server, langList, nopic, nopic_other, nopic_Main };