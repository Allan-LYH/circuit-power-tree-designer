# Circuit Power Tree Designer ⚡

這是一個專為硬體與系統工程師打造的網頁端「電路電源樹 (Power Tree) 設計與分析工具」。
透過視覺化的多層級架構，使用者可以快速拉建從電源輸入(Source) 到各階轉換器(Converter / LDO) 直到最終負載(Load) 的完整供電網路。系統會自動進行上下游的連鎖運算，即時提供精準的電壓、電流與功耗數據。

## ✨ 已完成功能 (Completed Features)

### 1. 核心排版與視覺系統
- **多層級自動對齊佈局 (Hierarchical Grid Layout)**：捨棄傳統雜亂的自由拖放，採用嚴格的前後級網格(Level-based)對齊，畫布乾淨俐落。
- **動態自適應佈局 (Dynamic Layout)**：元件會自動推擠與排列，維持視覺平衡。連線邏輯具備「完美垂直總線 (Absolute Grid Bus)」與「貝茲曲線」雙模式切換。
- **雙重視圖模式 (View Modes)**：支援「完整資訊(Full)」與「僅電源供電(Power Only)」切換，方便會議展示或深度除錯。

### 2. 多元硬體元件模型
- **DC Input (Power Source)**：設定初始輸入電壓與系統最大供電電流，做為電源樹根節點。
- **Converter / LDO (DC-DC 轉換器)**：支援設定輸出電壓、最大輸出電流、轉換效率(%)。
- **Load Switch (負載開關 / 隨插即用限制器)**：具備歐姆級內阻設定($R_{on}$)，可即時計算壓降。
- **Mux Switch (多工切換器)**：支援動態調整輸入(In)與輸出(Out)接頭數量，進行多路電源整合與分派。
- **Target Load (終端負載)**：設定 IC 標稱電壓與預估電流消耗(Typ/Peak)。

### 3. 即時運算引擎 (Live Calculation Engine)
- **電壓向下推導 (Forward Propagation)**：電壓從 Source 往下傳遞，經過 Switch 的壓降會即時反映給下游。
- **電流向上聚合 (Backward Aggregation)**：底層 Load 的電流抽載會逐層往上加總，回推至 Source 端的總消耗。
- **功耗與效率評估 (Power Dissipation)**：加入 Converter 的效率損失($1-\eta$)計算，並總計廢熱(mW/W)。

### 4. 專案存檔與協作
- **專案匯入/匯出 (Project Import/Export)**：支援將整張畫布上的節點座標、連線關係與所有元件的微調參數，一鍵打包為 JSON 檔儲存，隨時讀取還原。

---

## 🚀 未來規劃清單 (Roadmap & Future Features)

1. **零件庫管理系統 (Component Library System)**
   - 將常用的轉換器(Converter)、開關(Switch)等中間層元件儲存為專屬料號（如：*TI TPS5430*）。
   - 支援零件資料庫的 JSON 匯入匯出。
   - 編輯時可直接從邊欄將預設好規格的常用零件拖曳至畫布。
   
2. **快速複製貼上功能 (Copy/Paste Parameters)**
   - 針對單次設計，可以快速複製 A 節點的參數（例：12V轉5V的效率定值）直接套用到 B 節點，提升繪圖效率。
   
3. **過載警告機制 (Overload & Thermal Warnings)**
   - 整合零件庫定義的最大電流($I_{max}$)與最大電壓($V_{in\_max}$)，若運算結果超出規格，畫布節點與連線將會亮紅燈警示。
   - 結點熱功耗(Dissipation)警報。

4. **控制邏輯與訊號線 (Control & Logic Signals)**
   - 專屬的 Enable(EN)、Power Good(PG)、I2C 等控制線路系統。
   - 可與主電源線分色、分層，甚至提供獨立檢視開關，方便硬體工程師檢視上電時序(Power Sequence)。

5. **圖表匯出 (Diagram Export)**
   - 支援將畫布一鍵輸出為高解析度 PNG / SVG 圖片。
   - 支援匯出 PDF 簡易設計報表 (BOM/Power Report)，方便技術文件建檔與規格審查。

---
*Built with Vite + React + Zustand + React Flow*
