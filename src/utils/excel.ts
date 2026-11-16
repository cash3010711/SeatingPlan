import * as XLSX from 'xlsx';
import { Table, Guest, Group, SideType, MealType, CakeStatus } from '../types';

export interface ParsedRow {
  name: string;
  side: SideType;
  meal_type: MealType;
  needs_baby_chair: boolean;
  cake_count: number;
  cake_status: CakeStatus;
  total_count: number;
  category_tag: string;
  notes: string;
  raw: Record<string, any>;
  isDuplicate?: boolean;
  duplicateAction?: 'add' | 'skip' | 'merge';
}

const SIDE_MAP: Record<string, SideType> = {
  男方: 'groom',
  groom: 'groom',
  男: 'groom',
  女方: 'bride',
  bride: 'bride',
  女: 'bride',
  共同: 'mutual',
  mutual: 'mutual',
  雙方: 'mutual',
  工作人員: 'staff',
  staff: 'staff',
  工作人員親友: 'staff',
};

const MEAL_MAP: Record<string, MealType> = {
  葷: 'meat',
  葷食: 'meat',
  meat: 'meat',
  全素: 'vegan',
  純素: 'vegan',
  vegan: 'vegan',
  素: 'vegetarian',
  素食: 'vegetarian',
  蛋奶素: 'vegetarian',
  vegetarian: 'vegetarian',
  兒童餐: 'kid',
  兒童: 'kid',
  kid: 'kid',
  特殊: 'special',
  special: 'special',
};

// Fuzzy match column names
export function mapColumn(header: string): string | null {
  // Strip asterisks, brackets, and extra whitespace
  const clean = header
    .replace(/[*＊()（）[\]]/g, '')
    .trim()
    .toLowerCase();

  if (/^(姓名|大名|賓客|出席者|聯絡人|name)$/i.test(clean)) return 'name';
  if (/^(所屬|男方\/女方|男方女方|類別|群組|親友|side)$/i.test(clean)) return 'side';
  if (/^(葷素|飲食|餐食|飲食習慣|素食|meal)$/i.test(clean)) return 'meal_type';
  if (/^(兒童椅|兒童座椅|娃娃椅|baby\s*chair|餐椅|兒童椅需求)$/i.test(clean)) return 'needs_baby_chair';
  if (/^(喜餅|大餅|盒數|餅|cake|喜餅盒數)$/i.test(clean)) return 'cake_count';
  if (/^(人數|同行人數|出席人數|大人小孩|家庭|總人數|同行總人數|total_count)$/i.test(clean)) return 'total_count';
  if (/^(標籤|生活圈|關係|部門|同學會|tag|關係分類標籤)$/i.test(clean)) return 'category_tag';
  if (/^(備註|特殊需求|過敏|notes|remark|備註說明)$/i.test(clean)) return 'notes';
  return null;
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsed: ParsedRow[] = [];

  for (const row of rawRows) {
    const rowObj: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const mapped = mapColumn(key);
      if (mapped) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          rowObj[mapped] = val;
        } else if (rowObj[mapped] === undefined) {
          rowObj[mapped] = val;
        }
      }
    }

    const nameStr = String(rowObj['name'] || '').trim();
    if (!nameStr) continue; // Name is mandatory

    // Side
    const sideRaw = String(rowObj['side'] || '').trim().toLowerCase();
    let side: SideType = 'groom';
    if (sideRaw.includes('女') || sideRaw.includes('bride')) side = 'bride';
    else if (sideRaw.includes('共') || sideRaw.includes('mutual')) side = 'mutual';
    else if (sideRaw.includes('工') || sideRaw.includes('staff')) side = 'staff';
    else if (SIDE_MAP[sideRaw]) side = SIDE_MAP[sideRaw];

    // Meal
    const mealRaw = String(rowObj['meal_type'] || '').trim().toLowerCase();
    let meal_type: MealType = 'meat';
    if (mealRaw.includes('全素') || mealRaw.includes('純素') || mealRaw.includes('vegan')) meal_type = 'vegan';
    else if (mealRaw.includes('素') || mealRaw.includes('蛋奶') || mealRaw.includes('vegetarian')) meal_type = 'vegetarian';
    else if (mealRaw.includes('童') || mealRaw.includes('kid')) meal_type = 'kid';
    else if (mealRaw.includes('特') || mealRaw.includes('special')) meal_type = 'special';
    else if (MEAL_MAP[mealRaw]) meal_type = MEAL_MAP[mealRaw];

    // Baby Chair
    const chairRaw = String(rowObj['needs_baby_chair'] || '').trim().toLowerCase();
    const needs_baby_chair = /^(是|y|yes|要|1|true)$/i.test(chairRaw);

    // Cake count
    const cakeRaw = String(rowObj['cake_count'] || '').trim();
    let cake_count = 0;
    const parsedCake = parseInt(cakeRaw, 10);
    if (!isNaN(parsedCake) && parsedCake > 0) {
      cake_count = parsedCake;
    } else if (/^(是|y|yes|要|true)$/i.test(cakeRaw)) {
      cake_count = 1;
    } else if (side === 'bride' && cakeRaw === '') {
      // Default to 1 for bride side if unspecified, or keep 0 if not sure?
      // Spec says: "喜餅盒數: 數值（例如 1 或 2，若填「是」預設為 1，其餘 0）"
      cake_count = 0;
    }

    const cake_status: CakeStatus = cake_count > 0 ? 'unclaimed' : 'none';

    // Total Count (Household)
    const countRaw = String(rowObj['total_count'] || '').trim();
    const parsedTotal = parseInt(countRaw, 10);
    const total_count = !isNaN(parsedTotal) && parsedTotal >= 1 ? parsedTotal : 1;

    // Tags & Notes
    const category_tag = String(rowObj['category_tag'] || '').trim();
    const notes = String(rowObj['notes'] || '').trim();

    parsed.push({
      name: nameStr,
      side,
      meal_type,
      needs_baby_chair,
      cake_count,
      cake_status,
      total_count,
      category_tag,
      notes,
      raw: row,
      isDuplicate: false,
      duplicateAction: 'add',
    });
  }

  return parsed;
}

// Download Blank Template
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      '姓名 *': '王大明',
      '男方/女方 *': '男方',
      '飲食習慣': '葷食',
      '兒童椅需求': '否',
      '喜餅盒數': 0,
      '同行總人數': 1,
      '關係分類標籤': '大學同學',
      '備註說明': '預計開車前來',
    },
    {
      '姓名 *': '李美琪',
      '男方/女方 *': '女方',
      '飲食習慣': '葷食',
      '兒童椅需求': '是',
      '喜餅盒數': 1,
      '同行總人數': 3,
      '關係分類標籤': '高中閨蜜',
      '備註說明': '帶 1 幼童需兒童椅',
    },
    {
      '姓名 *': '陳國強',
      '男方/女方 *': '男方',
      '飲食習慣': '全素',
      '兒童椅需求': '否',
      '喜餅盒數': 0,
      '同行總人數': 1,
      '關係分類標籤': '父親同事',
      '備註說明': '不吃五辛',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '賓客名單範本');
  XLSX.writeFile(wb, '婚禮賓客匯入範本_Wedding_Guest_Template.xlsx');
}

// Export FR-6.1 Hotel Venue Handover Summary
export function exportHotelSummary(tables: Table[], guests: Guest[]): void {
  const rows = tables.map((t) => {
    const tableGuests = guests.filter((g) => g.table_id === t.id);
    const meatCount = tableGuests.filter((g) => g.meal_type === 'meat').length;
    const veganCount = tableGuests.filter((g) => g.meal_type === 'vegan').length;
    const vegetarianCount = tableGuests.filter((g) => g.meal_type === 'vegetarian').length;
    const kidMealCount = tableGuests.filter((g) => g.meal_type === 'kid').length;
    const babyChairCount = tableGuests.filter((g) => g.needs_baby_chair).length;
    const specialNotes = tableGuests
      .filter((g) => g.notes && g.notes.trim())
      .map((g) => `${g.name}: ${g.notes}`)
      .join('; ');

    return {
      '桌號': t.table_no,
      '桌名': t.name || (t.is_backup ? '備桌' : ''),
      '正式/備桌': t.is_backup ? '備桌 (預備桌)' : '正式桌',
      '容納人數': t.capacity,
      '實排人數': tableGuests.length,
      '葷食人數': meatCount,
      '全素人數': veganCount,
      '蛋奶素人數': vegetarianCount,
      '兒童餐數': kidMealCount,
      '需兒童餐椅張數': babyChairCount,
      '特殊飲食備註': specialNotes || '無',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '飯店會館交接專用總表');
  XLSX.writeFile(wb, `飯店會館交接專用總表_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export FR-6.2 Guest List & Cash Gift Book
export function exportGiftBook(tables: Table[], guests: Guest[]): void {
  const tableMap = new Map(tables.map((t) => [t.id, t]));

  const rows = guests.map((g, index) => {
    const table = g.table_id ? tableMap.get(g.table_id) : null;
    const sideLabel = {
      groom: '男方',
      bride: '女方',
      mutual: '共同',
      staff: '工作人員',
    }[g.side] || g.side;

    const mealLabel = {
      meat: '葷食',
      vegan: '全素',
      vegetarian: '蛋奶素',
      kid: '兒童餐',
      special: '特殊',
    }[g.meal_type] || g.meal_type;

    return {
      '序號': index + 1,
      '桌號': table ? table.table_no : '未排桌',
      '桌名': table ? table.name : '',
      '賓客姓名': g.name + (g.is_placeholder ? ' (佔位)' : ''),
      '所屬方': sideLabel,
      '飲食習慣': mealLabel,
      '兒童椅': g.needs_baby_chair ? '是' : '否',
      '喜餅領取盒數': g.cake_count,
      '喜餅領取狀態': g.cake_status === 'claimed' ? '已領取' : g.cake_status === 'unclaimed' ? '未領取' : '不需領',
      '紅包編號': g.gift_receipt_no || '',
      '禮金金額': g.gift_amount !== null ? g.gift_amount : '',
      '當天報到狀態': g.is_checked_in ? '已報到' : '未報到',
      '關係標籤': g.category_tag || '',
      '備註說明': g.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '禮金清冊與名冊');
  XLSX.writeFile(wb, `完整賓客名冊與禮金簿_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export FR-6.3 Bride Cake Distribution List
export function exportCakeList(guests: Guest[]): void {
  const cakeGuests = guests.filter((g) => g.cake_count > 0 || g.cake_status !== 'none' || g.side === 'bride');

  const rows = cakeGuests.map((g) => {
    const sideLabel = {
      groom: '男方',
      bride: '女方',
      mutual: '共同',
      staff: '工作人員',
    }[g.side] || g.side;

    return {
      '姓名/戶名': g.name,
      '所屬方': sideLabel,
      '需發盒數': g.cake_count,
      '是否已領取': g.cake_status === 'claimed' ? '已領取' : '未領取',
      '報到狀態': g.is_checked_in ? '已到' : '未到',
      '關係標籤': g.category_tag || '',
      '代領人/備註': g.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '喜餅發放清冊');
  XLSX.writeFile(wb, `喜餅發放清冊_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
