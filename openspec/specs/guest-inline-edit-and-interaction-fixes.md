# OpenSpec: 桌位賓客行內編輯與互動體驗優化 (Guest Inline Editing & UI Interaction Fixes)

## 1. 概述 (Overview)
本規範定義婚禮排座系統中四項使用者體驗關鍵問題的解決方案：
1. **頂部導覽列文字排版與防擠壓 (Navbar Text Wrapping & Overflow Prevention)**：解決次要螢幕或特定解析度下，按鈕與標題文字折行成兩行的問題。
2. **2D 畫布滾輪縮放穿透隔離 (Canvas Wheel Zoom Isolation)**：解決在桌位詳情彈窗（`TableDetailModal`）滾動名單時，背後畫布連帶觸發縮放的問題。
3. **看板模式滾輪水平滾動穿透隔離 (Board View Horizontal Scroll Isolation)**：解決在看板模式彈出桌位詳情時，滾動名單背後看板連帶水平滑動的問題。
4. **桌位詳情彈窗行內編輯賓客名單 (TableDetailModal Inline Guest Editing)**：在桌位詳情彈窗的已入座賓客名單列，新增「行內展開編輯」介面，支援直接修改賓客姓名、所屬方（男/女/共同）、餐食需求、兒童椅、喜餅數與備註，並呼叫 `updateGuest` 持久化。

---

## 2. 功能規範 (Functional Specifications)

### 2.1 頂部導覽列排版優化 (Navbar Layout Optimization)
- **檔案**：`src/components/layout/Navbar.tsx`
- **規範**：
  1. 所有按鈕與文字標籤皆套用 `whitespace-nowrap` 與 `shrink-0`，嚴禁任何字串折成兩行。
  2. 頂部容器寬度改用流暢自適應 `w-full px-4 sm:px-6`，解除原先限制的固定 `max-w-7xl` 限制，充分利用筆電與寬螢幕版面。
  3. 精簡中等螢幕（md / lg 斷點）下之輔助文字或 padding，確保在 1024px ~ 1366px 等常見筆電解析度下，各按鈕依舊維持單行排列整齊、視覺平衡。

### 2.2 桌位詳情彈窗滾輪冒泡隔離 (Wheel Event Isolation)
- **檔案**：`src/components/canvas/TableDetailModal.tsx`
- **規範**：
  1. 在 `TableDetailModal` 的全螢幕 Backdrop 容器、Modal Card 容器以及可滾動的名單清單容器 (`overflow-y-auto`)，均監聽 `onWheel={(e) => e.stopPropagation()}`。
  2. 阻止滾輪事件向上冒泡到父層 `WeddingCanvas` 的 `handleWheel`（縮放計算）或 `BoardView` 的 `handleWheel`（橫向滾動計算）。
  3. 確保使用者在彈窗內滾動名單時，背後畫布與看板紋風不動。

### 2.3 桌位詳情彈窗行內編輯賓客 (Inline Guest Editing)
- **檔案**：`src/components/canvas/TableDetailModal.tsx`
- **規範**：
  1. 在每位已入座賓客列中，新增「編輯」按鈕（圖標：`Edit2`）。
  2. 點擊後切換該賓客為「行內編輯模式 (Inline Editing)」，展開編輯區塊包含：
     - **姓名**：文字輸入框（必填）。
     - **所屬方**：下拉選單（男方親友 `groom`、女方親友 `bride`、共同親友 `mutual`、工作人員 `staff`）。
     - **餐食種類**：下拉選單（葷食 `meat`、全素 `vegan`、蛋奶素 `vegetarian`、兒童餐 `kid`、特殊/不吃牛等 `special`）。
     - **兒童椅**：核取方塊（`needs_baby_chair`）。
     - **喜餅份數**：數字增減或輸入框（`cake_count`，非負整數）。
     - **備註**：文字輸入框（`notes`）。
  3. 提供「儲存變更」與「取消」按鈕：
     - 點擊「儲存」：呼叫 `updateGuest(guest.id, ...)`，儲存成功後切回唯讀檢視。
     - 點擊「取消」：放棄未儲存變更，切回唯讀檢視。
  4. 同一時間支援編輯單一賓客，切換其他列時自動提示或重設。

### 2.4 看板模式賓客卡片行內編輯 (Board Guest Card Inline Editing)
- **檔案**：`src/components/board/BoardView.tsx`
- **規範**：
  1. 在看板模式的所有賓客卡片（包含未排座位池、已排各桌獨立賓客、家庭群組成員卡片）懸停或動作區中，新增「編輯」按鈕（`Edit2`）。
  2. 點擊後該卡片切換為行內編輯狀態（`isEditing = true`，且暫時關閉 `draggable` 防誤觸）。
  3. 卡片就地展開編輯表單：姓名、男女方、餐食類型、兒童椅勾選、喜餅份數與備註說明，並提供「取消」與「儲存」按鈕。
  4. 儲存時呼叫 `updateGuest(guest.id, ...)`，更新後自動切回卡片標準檢視。

### 2.5 2D 畫布重置視角幾何邊界動態置中 (Canvas Reset View Dynamic Centering)
- **檔案**：`src/components/canvas/WeddingCanvas.tsx`
- **規範**：
  1. 重置視角不再使用固定寫死之位移 `pan: { x: 40, y: 40 }`。
  2. 動態遍歷當前所有桌位（`tables`）與地標（`landmarks`），計算整體會場之幾何邊界包圍盒（Bounding Box：`[minX, maxX]`, `[minY, maxY]`）。
  3. 計算會場幾何中心點：`contentCenterX = (minX + maxX) / 2`，`contentCenterY = (minY + maxY) / 2`。
  4. 取得當前畫布可視寬高 `containerWidth` 與 `containerHeight`，在 `zoom = 1`（100%）時，將平移向量設為：
     - `pan.x = Math.round(containerWidth / 2 - contentCenterX)`
     - `pan.y = Math.round(containerHeight / 2 - contentCenterY)`
  5. 若畫布無任何物件，則將虛擬畫布中心 `(500, 400)` 對齊視窗中心。點擊重置時，所有桌位與地標保證精準置中於螢幕。

---

## 3. 非功能與安全規範 (Non-Functional & Security Invariants)

1. **零信任隱私隔離相容**：
   - 編輯欄位僅限於 `name`, `side`, `meal_type`, `needs_baby_chair`, `cake_count`, `notes`，不影響 `/lookup` 隱私隔離防線。
2. **離線同步與本地快取**：
   - `updateGuest` 透過既有的 `WeddingContext` 與 `storage.ts` 處理，離線時自動排入佇列，網路恢復時自動發送至 Supabase。
3. **無迴歸與測試品質**：
   - 單元測試維持 100% 通過。
