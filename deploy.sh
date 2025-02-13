#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}开始部署到 Vercel...${NC}"

# 检查是否安装了 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${BLUE}正在安装 Vercel CLI...${NC}"
    npm install -g vercel
fi

# 清理缓存和构建文件
echo -e "${BLUE}清理缓存和构建文件...${NC}"
rm -rf .vercel dist node_modules/.cache

# 安装依赖
echo -e "${BLUE}安装依赖...${NC}"
npm install

# 构建项目
echo -e "${BLUE}构建项目...${NC}"
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    # 部署到 Vercel
    echo -e "${BLUE}部署到 Vercel...${NC}"
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}部署完成！${NC}"
    else
        echo -e "${RED}部署失败！${NC}"
        exit 1
    fi
else
    echo -e "${RED}构建失败！${NC}"
    exit 1
fi 