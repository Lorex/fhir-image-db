# FHIR Image DB

`image-db-fhir` 是一個基於 Sails.js 框架開發的圖片儲存與管理服務。它提供了一套完整的 API，讓您可以上傳、刪除圖片，並將圖片資訊與 [FHIR](https://www.hl7.org/fhir/) (Fast Healthcare Interoperability Resources) 伺服器進行深度整合。

## 核心功能

### 1. 圖片上傳與縮圖

*   **多格式支援**：可上傳 `jpeg`, `png`, `gif`, `webp` 等多種常見圖片格式。
*   **自動產生縮圖**：每當一張新圖片上傳成功，系統會自動使用 `sharp` 函式庫產生一張 `128x128` 像素的縮圖，並與原始圖片一同儲存。
*   **API 回應**：成功上傳後，API 會回傳一個 JSON 物件，其中同時包含了原始圖片與縮圖的相對路徑 (`path` 和 `path-thumbnail`) 及公開存取 URL。

### 2. FHIR DocumentReference 整合

本專案最核心的功能是與 FHIR 伺服器的無縫整合。

*   **自動建立資源**：上傳圖片後，系統會自動在指定的 FHIR 伺服器上建立一個 `DocumentReference` 資源。
*   **雙內容附件**：這個 `DocumentReference` 的 `content` 陣列會包含兩個 `attachment`：
    1.  `content[0]`：指向原始圖片 (title: "full-image")。
    2.  `content[1]`：指向自動產生的縮圖 (title: "thumbnail")。
*   **關聯病患與操作人員 (選擇性)**：
    *   如果在上傳時提供了 `patientId`，它將被加到 `DocumentReference.subject` 欄位。
    *   如果在上傳時提供了 `practitionerId`，它將被加到 `DocumentReference.author` 欄位。
    *   如果未提供，對應的欄位將不會出現在 `DocumentReference` 中。

### 3. 資源同步刪除

*   **原子化操作**：透過 `DELETE /delete/:id` 端點，您可以使用 FHIR `DocumentReference` 的 ID，一次性地從本地檔案系統刪除原始圖片和縮圖，並同時向 FHIR 伺服器請求刪除對應的 `DocumentReference` 資源，確保資料的一致性。

## 技術堆疊

*   **後端框架**：[Sails.js](https://sailsjs.com/)
*   **圖片處理**：[sharp](https://sharp.pixelplumbing.com/)
*   **HTTP 客戶端**：[axios](https://axios-http.com/)
*   **測試框架**：[Mocha](https://mochajs.org/), [Supertest](https://github.com/visionmedia/supertest), [Sinon](https://sinonjs.org/)

## 環境設定

在啟動應用程式之前，您需要在 `config/custom.js` 檔案中或透過環境變數設定以下兩個參數：

*   `sails.config.custom.apiBaseUrl`：本圖床 API 伺服器的公開網址 (例如：`https://your-imagedb.example.com`)。
*   `sails.config.custom.fhirServerUrl`：您的 FHIR 伺服器網址 (例如：`https://your-fhir-server.example.com/fhir`)。

### 正式環境配置

⚠️ **重要提醒**：在正式環境部署時，請務必修改 `config/env/production.js` 檔案中的相關設定：

```javascript
// config/env/production.js
module.exports = {
  custom: {
    // 修改為您的正式環境網址
    apiBaseUrl: 'https://your-production-domain.com',
    fhirServerUrl: 'https://your-production-fhir-server.com/fhir',
  },
};
```

**注意事項：**
- 此檔案中的設定會覆蓋 `config/custom.js` 中的預設值
- 請根據您的實際部署環境修改 `apiBaseUrl` 和 `fhirServerUrl`
- 建議使用環境變數來管理敏感資訊

## API 端點

### `POST /upload`

上傳一張新的圖片，並建立對應的 FHIR DocumentReference。

**Request Body (form-data):**

| Key              | Type   | Description                |
| ---------------- | ------ | -------------------------- |
| `image`          | File   | **(必要)** 要上傳的圖片檔案。         |
| `patientId`      | String | (選擇性) 病患的 ID。                |
| `practitionerId` | String | (選擇性) 操作人員 (醫師、護理師) 的 ID。 |

**Success Response (200 OK):**

```json
{
  "filename": "...",
  "size": 12345,
  "path": "/images/...",
  "path-thumbnail": "/images/..._thumb.png",
  "timestamp": 1678886400000,
  "url": "https://.../images/...",
  "delete": "https://.../delete/FHIR_ID",
  "fhir": { ... } // 從 FHIR 伺服器回傳的 DocumentReference 資源
}
```

### `DELETE /delete/:id`

根據 FHIR `DocumentReference` 的 ID，刪除指定的圖片、縮圖以及 FHIR 資源。

**URL Parameters:**

| Key  | Type   | Description                   |
| ---- | ------ | ----------------------------- |
| `id` | String | FHIR `DocumentReference` 的 ID。 |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "檔案及對應的 FHIR DocumentReference 已成功刪除"
}
```

### `DELETE /purge`

清除所有已上傳的圖片。**注意：這是一個危險的操作，主要用於測試環境。**

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "所有檔案已成功刪除"
}
```

## 安裝與啟動

1.  **安裝依賴套件:**

    ```bash
    yarn install
    ```

2.  **啟動應用程式 (開發模式):**

    ```bash
    sails lift
    ```

3.  **啟動應用程式 (正式環境):**

    ```bash
    yarn start
    ```

## 測試

本專案使用 Mocha 進行整合測試。若要執行測試，請運行以下指令：

```bash
yarn test
```

## Linting

本專案使用 ESLint 來確保程式碼品質。若要執行 Linting，請運行以下指令：

```bash
yarn lint
```
