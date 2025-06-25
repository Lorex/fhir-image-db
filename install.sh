#!/bin/bash

# 安裝腳本 - 設置 image-db-fhir 專案環境

set -e # 如果任何指令失敗，則立即退出

echo "🚀 開始設置 image-db-fhir 專案..."

# --- 版本檢查 ---
echo "
📋 正在檢查必要的工具版本..."

# 檢查 Node.js 版本 (需要 ^20.18.0)
node_version=$(node -v)
required_node_version="^20.18.0"
if ! npx semver "$node_version" -r "$required_node_version"; then
    echo "❌ 錯誤: 需要 Node.js 版本 ${required_node_version}，但您目前使用的是 ${node_version}。"
    echo "請先安裝或切換至符合要求的 Node.js 版本 (例如：https://nodejs.org/)"
    exit 1
fi
echo "✅ Node.js 版本符合要求 ($node_version)"

# 檢查 yarn 是否已安裝
if ! command -v yarn &> /dev/null; then
    echo "📦 yarn 未安裝，正在嘗試全域安裝..."
    npm install -g yarn
else
    echo "✅ yarn 已安裝"
fi

# --- 安裝依賴 ---
echo "
📦 正在安裝專案依賴套件..."
yarn install

if [ $? -ne 0 ]; then
    echo "❌ 依賴安裝失敗，請檢查上面的錯誤訊息。"
    exit 1
fi

echo "
🎉 安裝完成！"

# --- 下一步說明 ---
echo "
🎯 後續步驟："
echo "  1.  **設定環境變數** (或直接修改 `config/custom.js`):"
echo "      -   `sails_custom__apiBaseUrl`: 您的 API 公開網址"
echo "      -   `sails_custom__fhirServerUrl`: 您的 FHIR 伺服器網址"
echo ""
echo "  2.  **啟動應用程式**:"
echo "      -   開發模式: `sails lift`"
echo "      -   正式環境: `yarn start`"
echo ""
echo "📖 **API 端點**:"
echo "  -   `GET /` - 測試連線"
echo "  -   `POST /upload` - 上傳圖片"
echo "  -   `DELETE /delete/:id` - 刪除指定圖片"
echo "  -   `DELETE /purge` - 清除所有圖片"