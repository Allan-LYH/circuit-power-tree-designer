# Power Tree Designer - Auto-Layout Engine (自動排版引擎邏輯)

本文件記錄了 `Circuit Power Tree Designer` 中專為「多層次電源樹架構」所設計的自動排版引擎邏輯。該邏輯主要實作於 `src/stores/usePowerTreeStore.ts` 內的 `calculateTree()` 函式。

## 核心設計理念：階層式網格 (Hierarchical Grid)

不同於完全自由拖曳的畫布 (Free Canvas)，電源樹設計強烈依賴**「前級與後級 (Upstream/Downstream)」**的拓樸關係。因此，排版引擎採用了「階層式網格系統」：
- **X 軸 (Level / Column)**：代表電源經過了幾次轉換 (邏輯深度)。
- **Y 軸 (Vertical Index / Row)**：代表在同一個供電層級中，為了避免管線與元件重疊，所分配的垂直順序。

排版引擎的核心任務，就是為了畫布上**每一個節點**計算出明確的 `(Level, Vertical Index)`，隨後再由介面層將這個座標映射為畫布上的真實像素 (Pixel, e.g., 360px 寬, 220px 高)。

---

## 特定元件專屬放置機制 (Component-Specific Placement Rules)

是的，為了符合電源系統工程師在閱讀方塊圖 (Block Diagram) 時的邏輯習慣，排版引擎針對特定的**元件類別**制定了強制性的擺放與避讓規則：

1. **Power Source (電源輸入)**：
   - **強制根節點 (Forced Root)**：所有 `powerSource` 都會被強制綁定在畫布的最左側 `Level 0 (X=0)`。
   - **主幹優先權 (Trunk Priority)**：在分配垂直高度時擁有最高優先權。系統會將連接到不同 Source 的子網路視為各自獨立的「主幹樹 (Trunk Tree)」，並賦予完整的行幅空間，保證不同主系統之間絕對不會互相干涉或重疊。

2. **Load (終端負載)**：
   - **強制靠右對齊 (Forced Right-Align)**：不論這個負載是直接接在源頭 (Level 1)，還是經過了五次降壓轉換才接到 (Level 6)，系統在配置 X 軸時，都會自動找出整張畫布中非 Load 元件的「最大深度 (Max Level)」，然後強制將所有的 `load` 元件推到 `MaxLevel + 1` 的位置。
   - **視覺一致性 (Visual Flow)**：這確保了畫布的視覺流動性永遠是「由左至右 (左側進電，右側消耗)」，所有的終端設備都會整齊劃一地排列在畫面最右側的同一縱列上。

3. **懸掛/空接節點 (Disconnected Nodes)**：
   - **智慧沙盒填空 (Smart Sandbox Backfilling)**：對於那些放在旁邊備用、還沒接線的獨立元件或元件群，系統「不會」把它們當作主網路的一部分。排版引擎會對它們進行「模擬測試 (Dry-run)」，自動找出畫布上方最靠近頂部且「完全不會與現有主線路發生重疊」的「連續空位」，把它們安插進去。這保證了空接節點會在使用者視角內尋找最近的位子避讓，而不會無限深陷到畫布最底部。

---

## 演算法五大步驟

每次當節點新增、刪除或連線改變時，引擎會執行以下五個步驟來重構整棵樹：

### 1. 建立相依性圖結構 (Adjacency Map)
讀取所有的 Nodes 與 Edges，建立正向 (Downstream) 的 `adj` 與反向 (Upstream) 的 `revAdj` Map 結構，快速查詢任何元件的父母與小孩。

### 2. 決定 X 軸：指派拓樸層級 (Assign Levels)
利用**廣度優先搜尋 (BFS)**。
- 尋找沒有任何輸入來源的節點作為根節點 (Roots, 通常是 Power Source)。
- Root 的層級為 0 (X=0)。
- 接著往下遍歷，子節點的層級等於 `其父母的層級 + 1`。如果是多路輸入(Mux)，則取所有父母中層級最大者再 +1。
- **特例處理**：為了排版美觀，所有的 `Load (終端負載)` 都會被強制對齊放置於整棵樹的「最後一欄 (最右側)」。

### 3. 電壓正向推導 (Voltage Propagation)
利用**正向拓樸排序 (Forward Topo Sort)**。
- 從 Root 開始，將設定好的輸出電壓 (V_out) 傳遞給子節點。
- 如果遇到 Converter 或 Load Switch，系統會判斷輸入電壓是否符合其規格 (Min/Max Vin)，並計算電壓壓降 (Voltage Drop)。

### 4. 電流反向聚合 (Current Aggregation)
利用**反向拓樸排序 (Backward Topo Sort)**。
- 由最末端的 Load 查出其需求電流 (Req_Current)。
- 將需求電流往回 (左) 傳遞。
- 當退回到 Converter 時，Converter 會將輸出的總電流加上自身的**轉換效率損失 (Efficiency Loss)**，轉換為對前端母線索求的「輸入電流」。
- 最終由最源頭的 Power Source 總結出整體系統消耗的總功率 (Total Power Output)。

### 5. 決定 Y 軸：更新垂直網格座標 (Update Vertical Indices) 🌟
這是排版引擎避免節點重疊的最關鍵步驟。它被分為兩個階段來處理：**「主幹樹配置」**與**「懸掛空接節點配置」**。

---

## Y 軸防重疊配置演算法深入解析 (Step 5)

這個階段的目標是為每個節點賦予一個整數的 `verticalIndex`。

### 遞迴座標分配器 (Helper: `assignY`)
引擎內建了一個地毯式分配函式 `assignY(nodeId, startY)`。當你給定一個起點節點以及它的 Y 軸起點：
- 如果該節點只有一個小孩，小孩會繼承同樣的 Y 軸，排在同一條水平直線上。
- 如果該節點有**多個小孩 (分支)**，它會把小孩由上往下「垂直推疊 (Stack)」。
- 該函式最終會回傳這「整串分支」總共消耗了多少行 (Rows) 的高度。

### Phase 1: 主幹樹配置 (Connected Source Roots)
所有的 `Power Source` 都視為系統的主幹 (Gloabl Trees)。
引擎會調用 `assignY` 從第一個 Source 開始排版 (Y=0)。
- 當第一條主幹畫完並占用了 (例如 Y=0~Y=3 的空間，消耗 4 行)，系統的 `currentNextY (全域目前最低底線)` 就會推進到 4。
- 第二條主幹 (第二個 Power Source) 就會從 Y=4 開始生長。
如此保證主幹與主幹之間絕對不會發生跨行重疊。

### Phase 2: 懸掛空接節點的「避讓填空」 (Dry-run Backfilling Algorithm)
對於尚未連線到 Power Source 的群體 (例如單純放在旁邊備用的 Converter 或 Load)，如果直接丟到最底下 (`currentNextY`)，會導致該節點在視覺上「掉入深淵」，遠離使用者的工作區。

為了實作**「就近避讓、智慧填空」**，我們採用了「模擬測試演算法 (Dry-run Collision Detection)」：

1. **取得所有空接節點叢集 (Disconnected Nodes)**：將這些與主幹失聯的節點找出來。
2. **建立已佔用網格矩陣 (Occupied Grid)**：遍歷目前已確認位置的主幹節點，建立一個包含 `Set<"Level, Y">` 的清單，當作障礙物地圖。
3. **進入 Dry-run 迴圈**：
   - 針對某棵空接節點樹，將它**暫時試放在 Y=0** 的位置。
   - 使用 `assignY` 模擬推演這串節點所需的每個 `(Level, Y)` 座標。
   - 檢查這些模擬座標是否與地圖上的障礙物發生碰撞 (Collision)。
   - **如果撞到了 (Collision = true)**：放棄這次模擬，將起始位置往下移一格 `Y = Y + 1`，然後重新模擬。
   - **如果有幸沒撞到 (Collision = false)**：代表找到了一個完美的連續空缺！將這些模擬座標正式寫入最終的排版矩陣中！
4. **全域底線更新**：如果這個被填空的元件高度剛好打破了原本的 `currentNextY` (最深淵的底線)，就更新它，讓下一棵空接樹有足夠的推演參考。

這種設計不僅達到了 100% 防重疊衝突的作用，更維持了使用者在排版過程中「沒接線的節點會聰明地往下滑動尋找鄰近空位」，不會亂跑的優秀操作體驗。
