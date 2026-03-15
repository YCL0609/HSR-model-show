#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR" || exit 1
rm -f LICENSE
rm -f *.md
touch 404.html

rm -f "$0"

# 此行用于出发cfpage构建 | 260315