# API 圖床系統

因為找不到現成簡單好用而且帶 API 的圖床系統，所以只好自己用 [Sails v1](https://sailsjs.com) 寫一個了 ˊ_>ˋ
所以我說現在的圖床 GUI 做得這麼漂亮，然後沒有 API 讓我們串，叫我們開發者情何以堪 Orz......

## 環境需求

- **Node.js**: 20.x 或更高版本
- **Yarn**: v1.22.19
- **Sails.js**: v1.5.4

## 快速安裝

### 方法一：使用安裝腳本（推薦）
```bash
# 克隆專案
git clone https://github.com/Lorex/imageDB.git
cd imageDB

# 執行安裝腳本
./install.sh
```

### 方法二：手動安裝
```bash
# 克隆專案
git clone https://github.com/Lorex/imageDB.git
cd imageDB

# 安裝 yarn（如果尚未安裝）
npm install -g yarn@1.22.19

# 安裝依賴
yarn install

# 安裝 sails 全域
yarn global add sails@beta
```

## 啟動應用程式

```bash
# 使用 sails 啟動
sails lift

# 或使用 yarn 啟動
yarn start
```

## API 端點

### 測試連線
```
GET /
```

### 上傳圖片
```
POST /upload
Content-Type: multipart/form-data
Body: image (檔案)
```

### 刪除圖片
```
DELETE /delete/:pid
```

### 刪除所有圖片
```
DELETE /purge
```

## 更新日誌

### v1.0.1
- 升級至 Node.js 20
- 改用 Yarn v1 套件管理
- 更新所有依賴套件至最新版本
- 改善錯誤處理和程式碼品質

