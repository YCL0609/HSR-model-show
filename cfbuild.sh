#!/bin/bash

# 脚本路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo 脚本运行路径: $SCRIPT_DIR

# Beta版本判断
IsBeta=false
echo Beta版本: $IsBeta

# 百度统计
echo 添加百度统计js代码...
cat << EOF > "$SCRIPT_DIR/js/baidu.js"
var _hmt = _hmt || [];
(function () {
    if (isDisable) return;
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?9ee9ca6e564351b723d63db903b916f6";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();
EOF

# 需要404.html来正常返回Http 404状态码
echo 新建404.html...
touch "$SCRIPT_DIR/404.html"

# 删除非必要文件
echo 删除非必要文件...
rm -f "$SCRIPT_DIR\LICENSE"
rm -f "$SCRIPT_DIR\README_EN.md"
rm -f "$SCRIPT_DIR\README.md"

# 切换到从网络加载公共函数库
echo 切换到从网络加载公共函数库...
sed -i 's/.\/outsite\/dist\/function.bundle.min.js/https:\/\/api.ycl.cool\/js\/function.bundle.min.js/' "$SCRIPT_DIR/index.html"
sed -i 's/.\/outsite\/dist\/function.bundle.min.js/https:\/\/api.ycl.cool\/js\/function.bundle.min.js/' "$SCRIPT_DIR/3d.html"

# 处理Beta版本
if $IsBeta; then
    echo 处理Beta版本提示信息...
    sed -i 's/<!-- \*当前为测试版 Is currently in beta -->/\*当前为测试版 Is currently in beta/' "$SCRIPT_DIR/index.html"
    sed -i 's/<!-- \*当前为测试版 Is currently in beta -->/\*当前为测试版 Is currently in beta/' "$SCRIPT_DIR/3d.html"
fi
