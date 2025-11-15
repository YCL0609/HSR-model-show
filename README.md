# 崩坏：星穹铁道角色模型展示
English version please see [README_EN.md][en]
## 前言
官方模型及立绘素材的权利归米哈游所有, 其他内容的相关权利均归各自所有者享有. 如有侵权, 请向 [email@ycl.cool][0] 发送邮件.
## js/libs 目录
此目录下存放项目的基础配置和项目初始化相关，若想要自己部署修改config.js即可。
### config.js
```javascript
// 定义服务器基本信息
const server = {
    list: [], // 两个服务器url, 索引为0的是主服务器，索引为1的是备用服务器
    debug: { // 当处于Debug模式时使用的url
        http: "",
        https: ""
    }
};

// 当前页面支持的语言列表
const langList = [];
    
// 除主角外没有介绍立绘的人物id
const nopic_other = [];

// 不同命途的开拓者id (无介绍立绘)
const nopic_Main = [];

// 所有无介绍立绘的人物id, 匹配时使用大招立绘来代替
const nopic = nopic_Main.concat(nopic_other);

// 3D页面进度条提示文字
const ProgressInfo = {
    Main: [],
    Model: [],
    Skybox: ""
};

// 3D页面进度条英文提示文字
const ProgressInfo_English = {
    Main: [],
    Model: [],
    Skybox: ""
};
```
### serverInit.js
```javascript
// 获取可用服务器并动态创建Import Map
async function serverInit() 

// 获取可用服务器
async function getServer() 

/**
 * 修改或添加当前 URL 的查询参数，并导航到新 URL。
 * @param {string} key - 要修改或添加的查询参数的键名。
 * @param {string|number|boolean} value - 参数的新值。
 * @returns {void} - 函数会引起页面跳转，无返回值。
 */
function urlChange(key, value)
```
## 主页面 -- index.html
加载时通过检测用户语言或本地存储的语言选项并应用，应用语言选项时会进行缓存检查，若需要更新则进行更新并存储到localStorage, 若出现远程文件版本不一致的情况会提示用户但任然使用远程资源。<br>
页面除表格外的所有文字存储在`(DATABASE)/lang/(LANG)/text.json`内。主、副表格的基础数据分别存储在`(DATABASE)/data.json`和`(DATABASE)/data2.json`中，而姓名等语言本地化信息存储在`(DATABASE)/lang/(LANG)/data.json`和`(DATABASE)/lang/(LANG)/data2.json`中，当前`(LANG)`只有zh、en、ja、ko四种选项。<br>

使用的js列表:
```
index.js
libs/config.js
libs/serverInit.js
units/WriteToTable.js
units/updateCache.js
units/InError.js
units/ShowPicture.js
units/ChangeLang.js
```
## 模型查看 -- 3d.html
加载后读取页面参数并进行初始化完成后会进行场景配置，当执行到模型加载时会判断当前是否为加载用户自定义vmd文件。若是则阻塞js进程并监听`window.loadok`变量，当用户选择完成后js进程继续执行。若不为用户自定义vmd文件则会将vmd和mp3文件设置为`(DATABASE)/vmd/0/`下的`index.vmd`和`index.mp3`文件(这两个文件内容为空仅用于占位)。<br>
当确定好加载哪个vmd文件后会进入模型加载逻辑脚本调用`loadWithAnimation()`函数加载主人物模型和动画文件，然后会判断是否现在是加载动画来判断是否加载人物武器模型。

使用的js列表:
```
3d.js
libs/config.js
libs/serverInit.js
units/Audioload.js
units/UI.js
units/InError.js
units/Weapons.js
units/loadModule.js
units/updateCache.js
units/threeInit.js
```
## 数据库结构
``` javascript
(DATABASE)
    ├── data.json // 主表格数据
    ├── data2.json // 副表格数据
    ├── img // 图片存储目录
    │   ├── character // 角色立绘
    │   │   ├── Picture.bat // 自动化添加脚本
    │   │   ├── en
    │   │   │   └── // 英文
    │   │   ├── ja
    │   │   │   └── // 日文
    │   │   ├── ko
    │   │   │   └── // 韩文
    │   │   └── zh
    │   │       └── // 中文
    │   └── skybox // 天空盒
    │       ├── nx.jpg // X-
    │       ├── ny.jpg // Y-
    │       ├── nz.jpg // Z-
    │       ├── px.jpg // X+
    │       ├── py.jpg // Y+
    │       └── pz.jpg // Z+
    ├── js // three.js相关文件
    │   ├── animation
    │   │   ├── CCDIKSolver.js
    │   │   ├── MMDAnimationHelper.js
    │   │   └── MMDPhysics.js
    │   ├── controls
    │   │   ├── ArcballControls.js
    │   │   ├── DragControls.js
    │   │   ├── FirstPersonControls.js
    │   │   ├── FlyControls.js
    │   │   ├── MapControls.js
    │   │   ├── OrbitControls.js
    │   │   ├── PointerLockControls.js
    │   │   ├── TrackballControls.js
    │   │   └── TransformControls.js
    │   ├── libs
    │   │   ├── ammo.wasm.js // Ammo库
    │   │   ├── ammo.wasm.wasm
    │   │   ├── mmdparser.module.js
    │   │   └── stats.module.js
    │   ├── lil-gui.module.min.js // lil-gui库
    │   ├── loaders
    │   │   ├── MMDLoader.js
    │   │   ├── MTLLoader.js
    │   │   ├── OBJLoader.js
    │   │   └── TGALoader.js
    │   ├── shaders
    │   │   └── MMDToonShader.js
    │   └── three.module.min.js // three.js主文件
    ├── lang // 语言本地化文件
    │   ├── version.txt // 语言文件版本
    │   ├── en // 英文
    │   │   ├── data2.json // 副表格语言本地化 
    │   │   ├── data.json // 主表格语言本地化
    │   │   └── text.json // 页面文字语言本地化
    │   ├── ja // 日本
    │   │   ├── data2.json
    │   │   ├── data.json
    │   │   └── text.json
    │   ├── ko // 韩文
    │   │   ├── data2.json
    │   │   ├── data.json
    │   │   └── text.json
    │   └── zh // 中文
    │       ├── data2.json
    │       ├── data.json
    │       └── text.json
    ├── models // 3D模型
    │   ├── background // 背景模型
    |   │   └── index.pmx // 模型主文件 
    |   └── // 其他模型
    └── vmd // 动作模型存储文件夹
        ├── data.json // 动作模型数据
        ├── 0 // 默认模型和音乐
        │   ├── index.mp3 // 空音乐
        │   └── index.vmd // 空动作文件
        └── // 其他动作模型和音乐
```

[en]: README_EN.md
[0]: mailto:email@ycl.cool