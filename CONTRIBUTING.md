# 貢獻指南 / Contributing

歡迎！OpenBooth 是給創作者社群的工具，貢獻分**兩軌**——不會寫程式也能幫忙。

## 🎨 設定包 / 翻譯軌（無需 coding）

- **分享你的攤位設定包**：在 app「設定 → 匯出攤位設定包」得到 JSON，開一個 issue（標題 `[config]`）附上 JSON 與攤位截圖。我們會收進 `presets/` 或社群庫。
  - ⚠️ 請勿包含第三方 IP（二創）美術或商品名於公開設定包。
- **翻譯 / 新語言**：只需編輯 `js/i18n.js` 的字典，新增一個 locale key 即可。

## 💻 程式碼軌

```bash
git clone https://github.com/<you>/openbooth.git
cd openbooth
npx serve .     # 或任何靜態伺服器；本專案零建置
```

- **零依賴執行**：直接開 `index.html` 就能跑，請勿引入框架或必要的 build step。
- **風格**：原生 JS，`OB` 命名空間，每個檔案聚焦單一職責、盡量 < 500 行。
- **安全**：使用者輸入一律用 `textContent` 或 `OB.util.esc()` 輸出，不要 innerHTML 拼接使用者資料。
- **金額**：一律整數運算，不要引入小數價格。
- **核心邏輯**（`pricing.js` / `inventory.js`）改動請附上手動驗證步驟或測試。
- UI 變更請附前後截圖。

### 流程
1. Fork → 開 feature 分支
2. Commit 用 [Conventional Commits](https://www.conventionalcommits.org/)（`feat:`, `fix:`, `docs:`…）
3. 開 PR，說明動機與測試方式

## 行為準則

請遵守 [Contributor Covenant](https://www.contributor-covenant.org/)。對人友善，對二創 / 18禁 / 各種創作保持尊重與中立。

## 提案新功能

開 issue 描述**情境**（在攤位上你想解決什麼），而非只描述功能。情境驅動的提案最容易被接受。
