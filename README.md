# API 圖床系統

因為找不到現成簡單好用而且帶 API 的圖床系統，所以只好自己用 [Sails v1](https://sailsjs.com) 寫一個了 ˊ_>ˋ
所以我說現在的圖床 GUI 做得這麼漂亮，然後沒有 API 讓我們串，叫我們開發者情何以堪 Orz......


### 建置
+ 把 repo 抓下來
```
$ git clone https://github.com/Lorex/imageDB.git
```
+ 安裝
```
$ npm i
$ npm i -g sails@beta
```
+執行
```
$ sails lift
```

### 使用方式
+ 測試連線
```
GET /
```
+ 上傳圖片
```
POST /upload
```
+ 刪除圖片
```
DELETE /delete/:pid
```
+ 刪除所有圖片
```
DELETE /purge
```

