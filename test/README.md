# 測試文件

這個目錄包含了 FHIR Image DB API 的完整測試套件，使用 Sails.js 推薦的測試框架。

## 測試結構

```
test/
├── fixtures/           # 測試用的檔案資源
│   ├── test-image.png   # 測試用圖片檔案
│   └── test.txt         # 測試用文字檔案（動態生成）
├── integration/        # 整合測試
│   ├── ImageController.test.js  # 圖片控制器測試
│   └── routes.test.js          # 路由測試
├── lifecycle.test.js   # Sails.js 生命週期管理
├── mocha.opts         # Mocha 設定檔
└── README.md          # 本檔案
```

## 測試框架

- **Mocha**: 測試執行器
- **Supertest**: HTTP 請求測試
- **Sails.js**: 應用程式生命週期管理

## 執行測試

### 安裝依賴
```bash
yarn install
```

### 執行所有測試
```bash
yarn test
```

### 只執行測試（跳過 linting）
```bash
yarn run custom-tests
```

## 測試涵蓋範圍

### ImageController 測試
- ✅ 圖片上傳功能
  - 成功上傳圖片檔案
  - 檔案格式驗證
  - 空檔案處理
  - 回應格式驗證

- ✅ 圖片刪除功能
  - 成功刪除指定圖片
  - 無效檔案 ID 處理
  - 不存在檔案的刪除請求

- ✅ 批量刪除功能
  - 成功清空所有圖片
  - 空目錄的清空操作

### API 路由測試
- ✅ 基本路由回應
- ✅ CORS 設定
- ✅ 錯誤處理格式

## 測試檔案說明

### lifecycle.test.js
負責 Sails.js 應用程式的啟動和關閉，確保測試環境正確設定。

### ImageController.test.js
測試圖片上傳、刪除和批量刪除的核心功能，包含各種邊界情況和錯誤處理。

### routes.test.js
測試 API 路由的基本功能和錯誤處理格式。

## 注意事項

- 測試會在獨立的環境中執行，不會影響正式資料
- 測試檔案會自動清理，不會留下垃圾檔案
- 每個測試都是獨立的，測試之間不會相互影響
- 使用真實的檔案上傳操作來確保完整的整合測試
