import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { mapColumn, parseExcelBuffer } from '../utils/excel';

describe('Excel Integration & Column Mapping', () => {
  it('correctly maps fuzzy aliases for standard columns', () => {
    expect(mapColumn('姓名')).toBe('name');
    expect(mapColumn('大名')).toBe('name');
    expect(mapColumn('賓客')).toBe('name');
    expect(mapColumn('出席者')).toBe('name');
    expect(mapColumn('Name')).toBe('name');

    expect(mapColumn('男方/女方')).toBe('side');
    expect(mapColumn('所屬')).toBe('side');
    expect(mapColumn('Side')).toBe('side');

    expect(mapColumn('葷素')).toBe('meal_type');
    expect(mapColumn('飲食習慣')).toBe('meal_type');
    expect(mapColumn('Meal')).toBe('meal_type');

    expect(mapColumn('兒童椅')).toBe('needs_baby_chair');
    expect(mapColumn('娃娃椅')).toBe('needs_baby_chair');
    expect(mapColumn('Baby Chair')).toBe('needs_baby_chair');

    expect(mapColumn('喜餅')).toBe('cake_count');
    expect(mapColumn('喜餅盒數')).toBe('cake_count');
    expect(mapColumn('Cake')).toBe('cake_count');

    expect(mapColumn('同行人數')).toBe('total_count');
    expect(mapColumn('家庭')).toBe('total_count');

    expect(mapColumn('生活圈')).toBe('category_tag');
    expect(mapColumn('關係分類標籤')).toBe('category_tag');

    expect(mapColumn('備註說明')).toBe('notes');
  });

  it('correctly parses Excel buffer with multiple rows and aliases', () => {
    const rawData = [
      {
        '大名': '陳大為',
        '男方/女方': '男方',
        '葷素': '全素',
        '娃娃椅': '是',
        '喜餅': '0',
        '同行人數': 3,
        '生活圈': '大學好友',
        '備註說明': '不吃五辛',
      },
      {
        '姓名': '林美美',
        '類別': '女方親友',
        '餐食': '葷食',
        '兒童椅': '否',
        '盒數': '1',
        '出席人數': 1,
        '標籤': '新娘高中閨蜜',
        '備註': '開車前來',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const parsed = parseExcelBuffer(buffer);

    expect(parsed).toHaveLength(2);

    // Row 1
    expect(parsed[0].name).toBe('陳大為');
    expect(parsed[0].side).toBe('groom');
    expect(parsed[0].meal_type).toBe('vegan');
    expect(parsed[0].needs_baby_chair).toBe(true);
    expect(parsed[0].total_count).toBe(3);
    expect(parsed[0].category_tag).toBe('大學好友');
    expect(parsed[0].notes).toBe('不吃五辛');

    // Row 2
    expect(parsed[1].name).toBe('林美美');
    expect(parsed[1].side).toBe('bride');
    expect(parsed[1].meal_type).toBe('meat');
    expect(parsed[1].needs_baby_chair).toBe(false);
    expect(parsed[1].cake_count).toBe(1);
    expect(parsed[1].cake_status).toBe('unclaimed');
  });

  it('[C-1 Regression] correctly parses standard template export data without dropping rows', () => {
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

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, '賓客名單範本');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const parsed = parseExcelBuffer(buffer);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe('王大明');
    expect(parsed[0].side).toBe('groom');
    expect(parsed[0].category_tag).toBe('大學同學');

    expect(parsed[1].name).toBe('李美琪');
    expect(parsed[1].side).toBe('bride');
    expect(parsed[1].needs_baby_chair).toBe(true);
    expect(parsed[1].cake_count).toBe(1);
    expect(parsed[1].total_count).toBe(3);

    expect(parsed[2].name).toBe('陳國強');
    expect(parsed[2].meal_type).toBe('vegan');
  });
});
