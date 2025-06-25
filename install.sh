#!/bin/bash

# 安裝腳本 - 設置 imageDB 專案環境

echo "🚀 開始設置 imageDB 專案..."

# 檢查 Node.js 版本
echo "📋 檢查 Node.js 版本..."
NODE_VERSION=$(node --version)
echo "當前 Node.js 版本: $NODE_VERSION"

# 檢查是否為 Node.js 20 或更高版本
if [[ ! "$NODE_VERSION" =~ ^v2[0-9]\. ]]; then
    echo "❌ 錯誤: 需要 Node.js 20 或更高版本"
    echo "請先安裝 Node.js 20: https://nodejs.org/"
    exit 1
fi

# 檢查 yarn 是否已安裝
if ! command -v yarn &> /dev/null; then
    echo "📦 安裝 yarn..."
    npm install -g yarn@1.22.19
else
    echo "✅ yarn 已安裝"
fi

# 檢查 yarn 版本
YARN_VERSION=$(yarn --version)
echo "當前 yarn 版本: $YARN_VERSION"

# 安裝依賴
echo "📦 安裝專案依賴..."
yarn install

# 安裝 sails 全域
echo "⛵ 安裝 sails 全域..."
yarn global add sails@beta

echo "✅ 安裝完成！"
echo ""
echo "🎯 下一步："
echo "  執行 'sails lift' 啟動伺服器"
echo "  或執行 'yarn start' 啟動應用程式"
echo ""
echo "📖 API 端點："
echo "  GET  /          - 測試連線"
echo "  POST /upload    - 上傳圖片"
echo "  DELETE /delete/:pid - 刪除圖片"
echo "  DELETE /purge   - 刪除所有圖片"
