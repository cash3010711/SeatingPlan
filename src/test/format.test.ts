import { describe, it, expect } from 'vitest';
import { formatTableNo, formatTableLabel } from '../utils/format';

describe('formatTableNo and formatTableLabel utilities', () => {
  it('correctly handles "主桌" without duplicating "第 主桌 桌"', () => {
    expect(formatTableNo('主桌')).toBe('主桌');
    expect(formatTableNo('副主桌')).toBe('副主桌');
    expect(formatTableNo('女方主桌')).toBe('女方主桌');
    expect(formatTableNo('預備桌')).toBe('預備桌');
  });

  it('correctly formats numeric table numbers as "第 X 桌"', () => {
    expect(formatTableNo('1')).toBe('第 1 桌');
    expect(formatTableNo('12')).toBe('第 12 桌');
    expect(formatTableNo('05')).toBe('第 05 桌');
  });

  it('handles existing "第 X 桌" formatting without duplicating', () => {
    expect(formatTableNo('第 1 桌')).toBe('第 1 桌');
    expect(formatTableNo('第 8 桌')).toBe('第 8 桌');
  });

  it('handles single letters and codes', () => {
    expect(formatTableNo('A')).toBe('第 A 桌');
    expect(formatTableNo('B')).toBe('第 B 桌');
    expect(formatTableNo('VIP')).toBe('VIP');
  });

  it('handles null, undefined and empty strings', () => {
    expect(formatTableNo('')).toBe('');
    expect(formatTableNo(null)).toBe('');
    expect(formatTableNo(undefined)).toBe('');
  });

  it('formatTableLabel combines table number and name cleanly', () => {
    expect(formatTableLabel('1', '男方大學同學')).toBe('第 1 桌 (男方大學同學)');
    expect(formatTableLabel('主桌', '新人與雙方主婚人')).toBe('主桌 (新人與雙方主婚人)');
    expect(formatTableLabel('1', '第 1 桌')).toBe('第 1 桌');
    expect(formatTableLabel('主桌', '主桌')).toBe('主桌');
    expect(formatTableLabel('2', '')).toBe('第 2 桌');
  });
});
