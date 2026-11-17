# AGENTS.md: 專案架構記憶與協同開發指引

> 本文件為 AI Agent 與協同開發者的常駐記憶庫，記錄本專案核心架構、關鍵模組邊界、安全隱私防護與技術決策。

---

## 1. 專案概述 (Project Overview)

- **專案名稱**：婚禮座位安排與報到系統 (Wedding Seating & Reception WebApp)
- **核心技術**：React 18 + TypeScript + Vite + Tailwind CSS + Lucide React + Supabase (PostgreSQL + Realtime) + IndexedDB/LocalStorage (離線快取備援)
- **路由結構**：
  - `/`：主控排座管理台（2D 畫布與看板雙模式、未排賓客抽屜、Excel 匯入/匯出、快照備份）
  - `/usher`：現場招待速查報到台（行動端/平板大字介面、一鍵報到、一鍵領餅、選填禮金記帳、離線指示燈）
  - `/lookup`：賓客現場自查頁面（掃描門口立牌 QR Code、輸入姓名查桌號、嚴格隱私隔離）

---

## 2. 關鍵架構決策與邊界 (Architectural Decisions & Invariants)

### 2.1 零信任隱私隔離 (`/lookup` 路由)
- **原則**：`/lookup` 嚴禁掛載全域管理型 `WeddingProvider`。
- **實作**：使用 `src/services/lookupService.ts` 的 `lookupGuestPublic(nameQuery)`。
  - Supabase 連線時：僅查詢公開安全欄位（`id, name, table_id, meal_type, needs_baby_chair, cake_count`），**嚴格排除 `gift_amount`、`gift_receipt_no` 與 `notes`**。
  - 本地快取時：在過濾時即刻剝除敏感欄位，回傳型別受限於 `SanitizedLookupResult`。

### 2.2 離線快取與同步佇列 (Offline Sync Queue)
- **原則**：婚宴會館與地下室常有訊號不穩現象，系統採「本地優先 (Local-First)」架構。
- **實作**：`src/utils/storage.ts`
  - 任何寫入操作若處於離線狀態或 Supabase 請求失敗，即自動排入 `offline_sync_queue`。
  - 監聽 `window.addEventListener('online')`，網路恢復時依序將佇列發送至 Supabase 並更新本地狀態。
  - 刪除桌位 (`deleteTable`) 時，必須同時佇列該桌賓客 `table_id = null` 之更新，避免資料庫 Foreign Key 或關聯斷裂。
  - 匯入家庭 (`importGuests`) 產生新群組時，離線必須同步佇列 `UPSERT_GROUP`。

### 2.3 2D 畫布與高頻拖曳效能 (DOM Transform)
- **原則**：畫布上桌位 (`TableNode`) 與地標 (`LandmarkNode`) 在拖曳期間不得高頻觸發 React State 重繪。
- **實作**：使用 `useRef`（`posRef`, `dragOffsetRef`）與 `nodeRef.current.style.transform` 進行即時 DOM 平移，`useEffect` 不以座標為相依項，僅在 `handleMouseUp` 時進行最後持久化更新。

### 2.4 Excel 增量匯入與重複辨識 (Deduplication)
- **原則**：匯入永遠採 Append-only，不覆蓋既有已排桌位。
- **實作**：`src/utils/excel.ts`
  - 欄位映射：`mapColumn()` 需先去除星號標記（`*`, `＊`）、各式括號與空白，確保官方下載範本與外部自製 Excel 100% 雙向對齊。
  - 重複辨識：匯入前提供預覽對照窗，標註黃色警示，支援「當作同名同姓新增」、「略過」或「合併更新」。內部處理時維護動態 `guestMap`，防止多筆同名合併時 updates 覆蓋。

### 2.5 畫布持久化與視圖 Keep-Alive (`MainPage.tsx`)
- **原則**：使用者在「畫布模式」與「看板模式」之間切換時，畫布的縮放與平移座標不得重置或偏移。
- **實作**：在 `MainPage.tsx` 採 CSS `hidden` 保持畫布組件持久掛載（Keep-Alive），避免組件反覆 Unmount / Mount 造成視角平移重設為預設座標。

### 2.6 事件隔離與彈窗下拉選單 Portal 化 (`TableDetailModal.tsx`, `Navbar.tsx`)
- **原則**：彈窗滾動與全域下拉選單不得受限於父容器剪裁（Clipping）或干擾背後畫布/看板。
- **實作**：
  - 彈窗名單滾輪事件：在 `TableDetailModal.tsx` 的 Backdrop 與名單容器加入 `onWheel={(e) => e.stopPropagation()}`，防止滾動名單時誤觸 2D 畫布縮放或看板橫向捲動。
  - 下拉式選單：在 `Navbar.tsx` 中將「重置管理」選單改採 React `createPortal` 渲染至 `document.body`，根據按鈕座標（`getBoundingClientRect`）動態計算 `fixed` 座標與高層級 `z-index`，根除導覽列 `overflow-x-auto` 導致的 Y 軸裁切遮擋。

### 2.7 畫布動態幾何置中算法 (`WeddingCanvas.tsx`)
- **原則**：點擊「重置視角」時，視圖需回到 100% 縮放並將全會場所有桌位與地標精準水平/垂直幾何置中。
- **實作**：動態計算所有桌位與地標之 Bounding Box 中心點，並對齊可視畫布容器幾何中心，避免固定座標偏移。


---

## 3. 測試與驗證標準 (Testing & Quality Gates)

- 單元與整合測試：`npm test` (Vitest)
  - 必須維持 100% 通過（包含 `[C-1 Regression]` 範本雙向解析、`[H-1 Regression]` 隱私隔離、`[H-2 Regression]` 離線佇列、`[M-1 Regression]` 動態合併）。
- 生產環境建置：`npm run build` (`tsc && vite build`)
  - 必須無任何 TypeScript 型別報錯，編譯產物產出至 `dist/`。
