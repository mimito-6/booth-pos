# BOO-POS — 設計文件 (Design Doc)

本文件是專案的設計單一真實來源。記錄定位、架構決策、資料模型與藍圖，供開發與貢獻者參考。

## 1. 定位 (Positioning)

給 **同人 / 手作擺攤賣家**（CWT、FF、Comiket、各種市集）的離線收銀台。

**護城河 = 信任，不是功能**：
> 你的營業資料永遠不離開這支手機。無帳號、無雲端、可離線、原始碼公開可自審。

這正中此 niche 的真實顧慮（二創 / 18禁不想留金流足跡），是雲端 SaaS 結構上做不到的。

**市場**：繁中開源「即売レジ」在台灣是空白市場；日本有 `即売レジ` 但封閉、有廣告、品項上限。同一套零成本工具同時服務 CWT/FF 與 Comiket（台日雙市場聯集）。

## 2. 使用情境約束 (Domain constraints)

- **離線優先（硬限制）**：會場數千~數萬人共用基地台，網路經常壅塞或無訊號。核心流程必須 100% 本地完成。
- **單手操作、視線不在螢幕**：大觸控目標、減少多步驟、關鍵動作有回饋。
- **現金為主、找零正確性**：低單價走量，找零算錯=當場虧錢。找零計算與面額快捷是核心。
- **資料持久性風險**：localStorage 會因清快取 / 換機消失 → 必須有匯出備份 + 收攤提醒。
- **金額一律整數**：台幣 / 日圓皆無小數；全程整數運算，避免浮點 bug。
- **跨場同商品重用**：商品庫與單場銷售解耦——商品定義可重用，各場各自記銷售。

## 3. 架構決策 (Architecture decisions)

刻意**不**過度工程化，守住原型「開檔即用、零依賴、離線」的最大優勢。

| 決策 | 選擇 | 理由 |
|---|---|---|
| 前端 | 原生 Vanilla JS，`BOO` 全域命名空間，classic `<script>` | 可雙擊 `index.html` 離線跑，也可上 Pages。無框架 = fork 即改 |
| 建置 | **無建置** | 不引入 vite/webpack。`npm install` 會殺死「fork 即改」的開源賣點 |
| 儲存 | `localStorage`（圖片 dataURL，已壓縮降尺寸） | 5MB 夠用；圖片壓到 360px。未來圖片量大再升 IndexedDB（已預留 store 抽象） |
| 離線 | PWA（manifest + service worker，cache-first 預快取 app shell） | 會場無網路冷啟動。降級：直接 `file://` 開單檔 |
| i18n | 輕量字典 `t(key, params)`，繁中 / 日 / 英 | 內含 CJK 系統字型堆疊，不依賴 web font |
| 部署 | GitHub Pages 靜態託管 | 零維運 |

### 核心設計（從原型保留並推廣）

1. **結帳純函式管線** `pricing.calcSale(state, cart)` → `{lines, subtotal, bundleSaved, grandTotal, gifts}`，與 render 完全分離、好測。
2. **庫存反推（derived inventory）**：`remaining = stockInitial − Σ stockUse(非作廢交易) − 購物車投影`。撤銷自動回補。
3. **套組共享庫存**：套組透過 `uses:[{productId, qty}]` 消耗單品庫存，結帳時展開成 `stockUse` 快照存進交易。

### 兩顆已修掉的「炸彈」

- **交易存單價快照**：每筆交易的每行記下當下 `name/unitPrice/lineTotal`，且記 `stockUse` 展開快照。日後改價 / 刪商品**不會**竄改歷史或讓紀錄頁崩潰（原型的致命缺陷）。
- **輸出轉義 / 安全 DOM**：使用者自訂的商品名透過 `textContent` / `esc()` 輸出，杜絕 XSS（原型全程 innerHTML 拼接，自訂商品名後有風險）。

### 庫存歸屬

庫存**全域共用**一份（同批商品反覆出攤），**銷售統計依場次**（`transaction.eventId`）。這是明確的取捨，避免多場次下庫存算錯。

## 4. 資料模型 (Data model)

`localStorage["boopos_v3"]`，帶 `schemaVersion` 驅動遷移；`boopos_cart_v3` 單獨存購物車（防當機）。

```
ShopSettings   shopName, currencyCode/Symbol, locale, theme, lowStockThreshold,
               showStock, enableCombos, requireCash, mascot
Category       id, name, color, sortOrder, archived
Product        id, name, categoryId, price, stockInitial, bundleRules:[{qty,price,label}],
               image(dataURL), sku, sortOrder, archived
Combo          id, name, description, price, uses:[{productId,qty}], image, archived
EventSession   id, name, date, location, note, startFloat(備用零錢), createdAt, archived
PaymentMethod  id, name, type(cash|external), enabled, isDefault, note, qr(dataURL)
GiftThreshold  id, minAmount, rewardText, enabled            (滿額禮)
PreorderEntry  id, customerName, contact, itemsText, amount, deposit,
               status(pending|notified|picked), createdAt
Transaction    id, eventId, time, voided,
               lines:[{kind, refId, name, unitPrice, basePrice, qty, lineTotal, isTokuten}],  ← 快照
               subtotal, discount, bundleSaved, grandTotal,
               stockUse:{productId:qty},                      ← 庫存反推快照
               paymentMethodId/Name/type, cashReceived, changeGiven, giftNote
```

**設定包 (preset)** = 可分享的攤位快照，**不含** transactions / preorders（不外洩營收與個資）。可匯出 JSON 或壓成 `?config=` 分享連結。

## 5. 程式結構

```
index.html              app shell（依序載入 classic scripts）
css/tokens.css          設計 token + 4 主題（warm/sakura/mono/night）
css/app.css             元件樣式
js/i18n.js              三語字典 + t()
js/util.js              DOM/money/esc/CSV/image/confirm 工具
js/components.js        共用 UI（header/sheet/field/toggle…）
js/store.js             狀態 + 持久化 + 遷移 + 匯入匯出 + 示範資料
js/pricing.js           結帳純函式（批量/套組/特典/滿額禮）
js/inventory.js         庫存反推 + 套組展開
js/stats.js             各場次統計
js/router.js            視圖切換
js/views/*.js           home/front/stock/event/pickup/pay/record/settings
js/app.js               bootstrap（主題/語系/分享連結/對客顯示/SW）
sw.js                   Service Worker（預快取離線）
presets/demo.json       示範設定包（原創品項）
```

## 6. 藍圖 (Roadmap)

- **v0.1（現況）** ✅ 去 IP、商品 / 分類 / 套組可自訂（含單價快照 + 轉義）、多場次、現金找零 + 臨時改價、滿額禮、特典、自訂付款、預購 + CSV、收攤對帳、JSON 備份、設定包分享、PWA 離線、三語、主題。
- **v0.2** — 真實活動實測回饋；商品拖曳排序、商品搜尋強化、收據 / 感謝小卡。
- **v0.3** — 賣り子（幫手）鎖定模式（PIN + 隱藏營收）、對客顯示強化（BroadcastChannel 雙螢幕）、收款 QR 放大出示。
- **v0.4** — 社群設定包庫（範本市集）、お品書き / 價目表圖片產生、i18n 擴充（韓 / 簡中）。
- **later** — 寄賣分潤、客人自助下單 QR、銷售熱力 / 補貨建議、可選同步轉接器（Supabase / 自架，opt-in）、IndexedDB 圖片升級。

## 7. 反範圍 (Out of scope)

後端 / 帳號 / 雲端資料庫（除非可選 opt-in 轉接器）；真實金流 API 串接（只出示 QR）；法定發票；原生 App 套殼（用 PWA）。
