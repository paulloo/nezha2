#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始部署到 Vercel...${NC}"

# 检查是否安装了 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${BLUE}正在安装 Vercel CLI...${NC}"
    npm install -g vercel
fi

# 构建项目
echo -e "${BLUE}构建项目...${NC}"
npm run build

# 部署到 Vercel
echo -e "${BLUE}部署到 Vercel...${NC}"
vercel --prod

echo -e "${GREEN}部署完成！${NC}" 