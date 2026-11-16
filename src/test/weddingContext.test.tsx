import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WeddingProvider, useWedding } from '../context/WeddingContext';

describe('WeddingContext State & Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <WeddingProvider>{children}</WeddingProvider>
  );

  it('initializes with default tables and guests', () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    expect(result.current.tables.length).toBeGreaterThanOrEqual(6);
    expect(result.current.guests.length).toBeGreaterThan(0);
    expect(result.current.stats.totalGuests).toBe(result.current.guests.length);
  });

  it('supports adding and editing table capacity (FR-1.1 & FR-1.2)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    let newTable: any;
    await act(async () => {
      newTable = await result.current.addTable({
        table_no: '8',
        name: '新郎高中死黨',
        capacity: 10,
        is_backup: false,
      });
    });

    expect(newTable.table_no).toBe('8');
    expect(result.current.tables.some((t) => t.id === newTable.id)).toBe(true);

    // Edit capacity to 12
    await act(async () => {
      await result.current.updateTable(newTable.id, { capacity: 12, name: '高中同學加開' });
    });

    const updated = result.current.tables.find((t) => t.id === newTable.id);
    expect(updated?.capacity).toBe(12);
    expect(updated?.name).toBe('高中同學加開');
  });

  it('supports toggling formal vs backup table (FR-1.3)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    let table: any;
    await act(async () => {
      table = await result.current.addTable({
        table_no: '預備-1',
        is_backup: true,
      });
    });

    expect(table.is_backup).toBe(true);

    await act(async () => {
      await result.current.updateTable(table.id, { is_backup: false });
    });

    const found = result.current.tables.find((t) => t.id === table.id);
    expect(found?.is_backup).toBe(false);
  });

  it('creates household groups with auto-generated placeholder seats (FR-2.2 & AC-2)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    await act(async () => {
      await result.current.addGroup('王大華家庭', 4, '王大華', '攜伴 3 人', 'groom', '大學同學');
    });

    const primaryGuest = result.current.guests.find((g) => g.name === '王大華');
    expect(primaryGuest).toBeDefined();
    expect(primaryGuest?.is_placeholder).toBe(false);

    // Should create 3 placeholders: 眷屬 #1, #2, #3
    const placeholders = result.current.guests.filter((g) => g.name.startsWith('王大華 眷屬'));
    expect(placeholders).toHaveLength(3);
    expect(placeholders.every((p) => p.is_placeholder)).toBe(true);
    expect(placeholders.every((p) => p.group_id === primaryGuest?.group_id)).toBe(true);
  });

  it('supports assigning whole household into a table in one operation (FR-2.2 & AC-2)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    let group: any;
    await act(async () => {
      group = await result.current.addGroup('陳小強一家', 3, '陳小強', '', 'groom');
    });

    const targetTable = result.current.tables[0];

    await act(async () => {
      await result.current.assignGroupToTable(group.id, targetTable.id);
    });

    const groupMembers = result.current.guests.filter((g) => g.group_id === group.id);
    expect(groupMembers).toHaveLength(3);
    expect(groupMembers.every((m) => m.table_id === targetTable.id)).toBe(true);
  });

  it('supports batch assigning guests by category tag (FR-2.3 & AC-2)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    // Add 3 guests with category tag '國小同窗'
    await act(async () => {
      await result.current.addGuest({ name: '同學甲', category_tag: '國小同窗', table_id: null });
      await result.current.addGuest({ name: '同學乙', category_tag: '國小同窗', table_id: null });
      await result.current.addGuest({ name: '同學丙', category_tag: '國小同窗', table_id: null });
    });

    const tagGuests = result.current.guests.filter((g) => g.category_tag === '國小同窗');
    expect(tagGuests).toHaveLength(3);

    const targetTable = result.current.tables[1];

    await act(async () => {
      await result.current.assignGuestsToTable(
        tagGuests.map((g) => g.id),
        targetTable.id
      );
    });

    const updatedTagGuests = result.current.guests.filter((g) => g.category_tag === '國小同窗');
    expect(updatedTagGuests.every((g) => g.table_id === targetTable.id)).toBe(true);
  });

  it('handles guest check-in, cake claim, and gift money recording (FR-4.3 & FR-4.4)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    let guest: any;
    await act(async () => {
      guest = await result.current.addGuest({
        name: '測試招待賓客',
        cake_count: 1,
        cake_status: 'unclaimed',
        is_checked_in: false,
      });
    });

    // Check-in
    await act(async () => {
      await result.current.checkInGuest(guest.id, true);
    });
    expect(result.current.guests.find((g) => g.id === guest.id)?.is_checked_in).toBe(true);

    // Claim cake
    await act(async () => {
      await result.current.claimCake(guest.id, 'claimed');
    });
    expect(result.current.guests.find((g) => g.id === guest.id)?.cake_status).toBe('claimed');

    // Record gift
    await act(async () => {
      await result.current.recordGift(guest.id, 6600, 'NO-888');
    });
    const finalGuest = result.current.guests.find((g) => g.id === guest.id);
    expect(finalGuest?.gift_amount).toBe(6600);
    expect(finalGuest?.gift_receipt_no).toBe('NO-888');
  });

  it('supports snapshot creation, history, and restoration (FR-9.1)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    const initialTableCount = result.current.tables.length;

    // Create snapshot
    let snapshot: any;
    await act(async () => {
      snapshot = await result.current.createSnapshot('測試排座快照A');
    });

    expect(snapshot.name).toBe('測試排座快照A');
    expect(result.current.snapshots.length).toBeGreaterThanOrEqual(1);

    // Make state modifications: add table and remove some guests
    await act(async () => {
      await result.current.addTable({ table_no: '99', name: '快照後新增桌' });
    });
    expect(result.current.tables.length).toBe(initialTableCount + 1);

    // Restore to snapshot
    await act(async () => {
      await result.current.restoreSnapshot(snapshot.id);
    });

    // Should return to snapshot state
    expect(result.current.tables.length).toBe(initialTableCount);
    expect(result.current.tables.some((t) => t.table_no === '99')).toBe(false);
  });

  it('[H-2 Regression] deleteTable correctly queues table_id=null updates in offline action queue', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    let testTable: any;
    await act(async () => {
      testTable = await result.current.addTable({ table_no: '測試桌' });
    });

    let seatedGuest: any;
    await act(async () => {
      seatedGuest = await result.current.addGuest({ name: '被刪桌賓客', table_id: testTable.id });
    });

    // Delete table
    await act(async () => {
      await result.current.deleteTable(testTable.id);
    });

    const guestAfter = result.current.guests.find((g) => g.id === seatedGuest.id);
    expect(guestAfter?.table_id).toBeNull();
  });

  it('[M-1 Regression] importGuests accumulates merge updates for duplicate entries in dynamic map', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    await act(async () => {
      await result.current.addGuest({
        name: '合併測試賓客',
        side: 'groom',
        meal_type: 'meat',
        notes: '第一筆備註',
      });
    });

    const importRows: any[] = [
      {
        name: '合併測試賓客',
        side: 'groom',
        meal_type: 'vegan',
        needs_baby_chair: true,
        cake_count: 1,
        cake_status: 'unclaimed',
        total_count: 1,
        category_tag: '社團好友',
        notes: '第二筆備註',
        isDuplicate: true,
        duplicateAction: 'merge',
      },
    ];

    await act(async () => {
      const outcome = await result.current.importGuests(importRows);
      expect(outcome.merged).toBe(1);
    });

    const mergedGuest = result.current.guests.find((g) => g.name === '合併測試賓客');
    expect(mergedGuest?.meal_type).toBe('vegan');
    expect(mergedGuest?.needs_baby_chair).toBe(true);
    expect(mergedGuest?.cake_count).toBe(1);
    expect(mergedGuest?.category_tag).toBe('社團好友');
    expect(mergedGuest?.notes).toContain('第一筆備註');
    expect(mergedGuest?.notes).toContain('第二筆備註');
  });
});
