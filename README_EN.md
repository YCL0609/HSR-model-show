# Honkai:Star Rail Character model display
中文请查看 [README.md][cn]
## Preface
The rights to the official models and character illustrations belong to miHoYo, while the rights to other content are owned by their respective owners. If there is any infringement, please send an email to [email@ycl.cool][0].
## Main Page -- index.html
When loading, the application detects the user's language or the language option stored locally and applies it. When applying the language option, it checks the cache, and if an update is needed, it updates and stores it in localStorage. If there is a version mismatch with the remote file, it will notify the user but still use the remote resources.<br>
All text on the page, except for tables, is stored in `(DATABASE)/lang/(LANG)/text.json`. The basic data for the main and secondary tables are stored in `(DATABASE)/data.json` and `(DATABASE)/data2.json`, respectively, while localized information such as names is stored in `(DATABASE)/lang/(LANG)/data.json` and `(DATABASE)/lang/(LANG)/data2.json`. Currently, `(LANG)` only has four options: zh, en, ja, and ko.<br>

List of used JS:
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
## Model View -- 3d.html
After loading, the page parameters are read and initialization is completed, followed by scene configuration. When it comes to model loading, it will check whether the current file is a user-customized VMD file. If it is, the JS process is blocked and listens to the `window.loadok` variable. Once the user has made a selection, the JS process continues. If it is not a user-customized VMD file, the VMD and MP3 files will be set to the `index.vmd` and `index.mp3` files under `(DATABASE)/vmd/0/` (these two files are empty and only used as placeholders).<br>
Once it is determined which VMD file to load, the model loading logic script will call the `loadWithAnimation()` function to load the main character's model and animation files, and then it will check whether it is currently loading an animation to decide whether to load the character's weapon model.

List of used JS:
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
## Database structure
``` javascript
(DATABASE)
    ├── data.json // Main table data
    ├── data2.json // Subform Data
    ├── img // Image Storage Directory
    │   ├── character // Character Artwork
    │   │   ├── Picture.bat // Automated Add Script
    │   │   ├── en
    │   │   │   └── // English
    │   │   ├── ja
    │   │   │   └── // Japanese
    │   │   ├── ko
    │   │   │   └── // Korean
    │   │   └── zh
    │   │       └── // Chinese
    │   └── skybox // Skybox
    │       ├── nx.jpg // X-
    │       ├── ny.jpg // Y-
    │       ├── nz.jpg // Z-
    │       ├── px.jpg // X+
    │       ├── py.jpg // Y+
    │       └── pz.jpg // Z+
    ├── js // three.js related files
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
    │   │   ├── ammo.wasm.js // Ammo Library
    │   │   ├── ammo.wasm.wasm
    │   │   ├── mmdparser.module.js
    │   │   └── stats.module.js
    │   ├── lil-gui.module.min.js // lil-gui Library
    │   ├── loaders
    │   │   ├── MMDLoader.js
    │   │   ├── MTLLoader.js
    │   │   ├── OBJLoader.js
    │   │   └── TGALoader.js
    │   ├── shaders
    │   │   └── MMDToonShader.js
    │   └── three.module.min.js // three.js main file
    ├── lang // Language Localization File
    │   ├── version.txt // Language File Version
    │   ├── en // English
    │   │   ├── data2.json // Subform Language Localization 
    │   │   ├── data.json // Main Form Language Localization
    │   │   └── text.json // Localization of page text language
    │   ├── ja // Japanese
    │   │   ├── data2.json
    │   │   ├── data.json
    │   │   └── text.json
    │   ├── ko // Korean
    │   │   ├── data2.json
    │   │   ├── data.json
    │   │   └── text.json
    │   └── zh // Chinese
    │       ├── data2.json
    │       ├── data.json
    │       └── text.json
    ├── models // 3D model
    │   ├── background // Background Model
    |   │   └── index.pmx // Model Main File
    |   └── // Other models
    └── vmd // Action Model Storage Folder
        ├── data.json // Action Model Data
        ├── 0 // Default Model and Music
        │   ├── index.mp3 // Ambient music
        │   └── index.vmd // Empty action file
        └── // Other action models and music
```

[cn]: README.md
[0]: mailto:email@ycl.cool