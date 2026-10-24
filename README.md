# 旅日手帖 · Japan Travel

旅遊專用網站。首篇是 2026/10/26–28 的北海道雙人自駕提案：札幌、小樽私人包船候選、海景溫泉。

網站：https://i5421jeffrey.github.io/japan-travel/

## 本機預覽

無建置流程或 API 金鑰。使用 Python 3：

```sh
python3 -m http.server 8080
```

開啟 `http://localhost:8080`。以 GitHub Pages 從 `main` 分支根目錄發布。

## 檔案

- `index.html`：頁面內容、來源及查核日期。
- `itinerary.js`：三日行程、座標、交通及停車說明。
- `app.js`：每日地圖、鍵盤頁籤、地圖與行程連動、裝置本機清單、三日列印。
- `route-data.js`：OSRM 道路規劃快照，不是即時導航；更新座標後需重抓。
- `scripts/update-routes.py`：根據行程座標重新抓取 OSRM 快照（需要 Node.js、Python 3、curl）。
- `scripts/check.mjs`：資料、連結、靜態資源及路線完整性檢查，執行 `node scripts/check.mjs`。
- `assets/`：原創插畫及本地 Leaflet 1.9.4，授權見 `LEAFLET-LICENSE.txt`。

## 內容與隱私

這是行程提案，不是訂位或購買確認。航班、包船費用與空位、旅宿均待確認；不公開旅客姓名、聯絡方式、訂位代碼或金鑰。頁面詳細列出官方資料來源與估算方法。公開儲存庫的歷史也會公開，請勿提交任何訂位或私人資料。

地圖採 Leaflet / © OpenStreetMap contributors；道路路線由 OSRM 提供，步行為連線示意，無海上導航線。底圖、Google Fonts 及外部連結會連線至第三方；無追蹤或後端，清單只保存在目前瀏覽器。

新增旅行可建立獨立子目錄並沿用樣式；請重新核實日期、季節、停車及船班。不要將這次的船班或住宿建議視為永久有效資訊。
