# Circuit Power Tree Designer - UI Guidelines

This document provides a comprehensive UI design guideline for the Circuit Power Tree Designer application. As the project scales to include copy/paste systems, logic wiring, and complex reporting tools, these guidelines ensure a consistent, professional, and dense but readable interface tailored for engineering users.

---

## 1. High-Level Principles

1. **Information Density with Clarity**
   * **Target Audience**: Hardware and system engineers.
   * **Principle**: Engineers need to see multiple values (Voltage, Current, Eff, Loss) simultaneously without excessive clicking. Prioritize displaying critical calculations upfront, but maintain strict visual hierarchy so it doesn't look like a messy spreadsheet.
   * **Action Form**: Use a compact flex/grid layout inside nodes. Avoid large empty padding (`p-5` -> `p-3` or `p-2`).

2. **Visual Hierarchy & State Communication**
   * **Colors**: Use colors semantically and consistently across the app. Do not use vibrant colors merely for decoration; reserve them for data types, component categories, or statuses.
   * **Contrast**: Employ dark-mode first principles. Maximize contrast for actual data readings (white/bright) against structural labels (dimmed/gray).

3. **Predictable Interaction Patterns**
   * **Direct Manipulation**: Allow inline editing for numeric parameters right on the nodes. Avoid forcing the user into a separate modal/panel unless configuring advanced sub-settings (like min/max threshold limits).
   * **Instant Feedback**: Calculations (Power Loss, V_out) should update immediately and locally (using specialized `NodeInput` components to prevent recursive re-renders).

---

## 2. Mid-Level UI Guidelines

### 2.1 Color System (Semantic Mapping)

Strict adherence to this color mapping ensures the user instantly recognizes the component or parameter type.

| Element Category | Tailwind Color Utility | Purpose & Usage Notes |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-zinc-950` | Provide a dark, low-glare workspace for the diagram. |
| **Node Background** | `bg-zinc-900` | The base card background. |
| **Node Borders** | `border-zinc-700` | Default border. |
| **Selected States** | `border-indigo-500` `shadow-indigo-500/20` | To highlight the active node being edited in the Properties Panel. |
| **Errors / Overload** | `border-red-500` `text-red-400` | Critical over-current, under-voltage, or validation failures. Animate with `animate-pulse` heavily for severe issues. |

#### Component-Specific Theme Colors
*   **Power Source (Input)**: <span style="color:#10b981;">**Emerald (Green)**</span> `emerald-500`
    *   *Usage*: Source Nodes, input voltage parameters.
*   **Converter (Buck/Boost/LDO)**: <span style="color:#0ea5e9;">**Sky (Blue)**</span> `sky-500`
    *   *Usage*: Intermediate conversion nodes and their specific voltage tags.
*   **Load Switch (Control/Routing)**: <span style="color:#d946ef;">**Fuchsia (Purple)**</span> `fuchsia-500`
    *   *Usage*: Switching, Ron limits.
*   **End Load (Sink)**: <span style="color:#f59e0b;">**Amber (Yellow)**</span> `amber-500`
    *   *Usage*: Final consumption loads, required demand.
*   **Power / Thermal Loss**: <span style="color:#fb7185;">**Rose (Pink/Red)**</span> `rose-400`
    *   *Usage*: Always use Rose/Red variations to display Wattage loss (e.g., `Pd Loss: 0.5W`).

---

### 2.2 Typography & Spacing Sizes

Consistency in fonts creates a polished tool rather than a prototype. We enforce a **strict 3-tier typographic system** inside diagram nodes:

1.  **Readings & User Inputs (`text-base`, `16px`)**
    *   **Style**: `font-bold`, High contrast (`text-zinc-100` or Primary Color).
    *   **Usage**: The actual values the user cares about (Voltage setting, Current limit).
2.  **Node Titles & Passive Data (`text-sm`, `14px`)**
    *   **Style**: `font-semibold` for titles, `font-bold` for calculated passive data (Wattage).
    *   **Usage**: Component names ("Main SoC 3.3V"), calculated V_OUT after drop.
3.  **Labels & Units (`text-xs`, `12px`)**
    *   **Style**: `uppercase tracking-tighter text-zinc-500 font-bold`.
    *   **Usage**: Parameter headers ("SET V_OUT", "MAX CURR"), unit suffixes ("V", "A", "%"), small descriptive sub-tags.
    *   *Note: Do not use font sizes smaller than `12px` (like `10px` or `9px`) as they degrade quickly on low-resolution displays or when the canvas is zoomed out.*

**Spacing Policy**:
*   **Node Internal Padding**: Max `p-3`. Use `p-2` or `p-1.5` for inner structural elements (like parameter stat boxes).
*   **Gaping**: Rely on `gap-2` or `gap-1` between tight value pairs (like an input and its "V" unit). Use `gap-3` only between major architectural blocks (Header vs Layout Grid).

---

### 2.3 Node Layout Structure (Generic / Role-Based)

元件種類會持續擴充，因此**不在 Guideline 中指定特定元件應顯示哪些欄位**。取而代之的是，我們定義四種「區塊角色」。每個 Node 組件的開發者只需決定哪些參數歸入哪個角色區塊，並遵守其外觀規範即可。

#### Zone A — Header Row (必要)
*   **Icon Block**: 左對齊，大小 `h-8 w-8`，背景色使用該元件類別的主題色 `/20` 透明度。
*   **Title Block**: 元件名稱 (`text-sm font-semibold`) + 層級標籤 (`text-xs`)。
*   **Action Block**: 右對齊，移動上下箭頭 + 刪除按鈕。

#### Zone B — Editable Parameters (必要, 數量不定)
*   這裡放置該元件類型**所有使用者可直接修改**的參數 (例如輸出電壓、效率、導通電阻、需求電流等)。
*   採用 `grid grid-cols-2 gap-2` 排版；若參數為奇數則最後一格可設為 `col-span-2`。
*   每個格子採結構：`[標籤 text-xs uppercase] → [NodeInput text-base font-bold]`。
*   標籤文字使用 `text-zinc-500`；數值文字使用主題色或白色，視參數性質決定。

#### Zone C — Computed Readouts / Status Bar (選擇性)
*   這裡放置該元件**自動計算得出、使用者不可手動輸入**的衍生值 (例如功耗、壓降後電壓、實際電流加總等)。
*   採用一條全寬、稍暗的橫條 (`bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700/20`)。
*   佈局規則：**左側放可調參數或資訊，右側固定放功率/損耗讀數** (`text-sm font-bold text-rose-400`)。
*   右側的數值給定固定寬度 (`w-12 text-right`) 以避免跳動。
*   左右兩側以分隔線 (`border-l border-zinc-700/50 pl-3`) 區隔。
*   元件若無衍生計算值 (如 Power Source 可能只有 Error)，可略過此區塊。

#### Zone D — Meta / Warning Footer (條件性)
*   控制介面標示 (如 `CTL: EN`) 以 tag badge 形式呈現，背景 `bg-indigo-500/10`。
*   錯誤/過載警告以紅色 bar 呈現 (`bg-red-500/20`)，包含 `AlertCircle` icon。
*   此區塊僅在有資料時才顯示。

> **新增元件的開發流程**：建立新 Node 組件時，只需按 Zone A → B → C → D 的順序填入該元件的特有欄位，無需回來修改此 Guideline。

---

### 2.4 Future-Proofing for Upcoming Features

*   **Copy/Paste System**: Upon successful paste, provide a transient, localized visual flash (e.g., a rapid `ring-2 ring-emerald-500`) on the target node so the user knows settings were applied, as global toasts can be distracting during intense diagramming.
*   **Control/Logic Wiring**: 
    *   Power edges (the default) remain solid and thick.
    *   Logic/Control edges (when implemented) MUST use a distinct stroke pattern (e.g., `stroke-dasharray="5,5"`) and a neutral or secondary color (like `zinc-400` or `indigo-400`) to differentiate them from power flows.
*   **Export Mode**: 
    *   Ensure all critical data (Voltages, Current, Losses) is readable against a solid, non-transparent background since SVG/PNG exports strip complex dropshadows or might render gradients differently. Rely on solid borders over pure transparency.
