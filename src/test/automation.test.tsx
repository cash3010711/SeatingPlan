import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WeddingProvider, useWedding } from '../context/WeddingContext';

describe('Auto-Seating & Data Reset Operations (FR-10 & FR-11)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <WeddingProvider>{children}</WeddingProvider>
  );

  it('resets all seating assignments while preserving tables and guests (FR-11.1)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    // Initial state has seated guests
    const initialSeatedCount = result.current.guests.filter((g) => g.table_id !== null).length;
    expect(initialSeatedCount).toBeGreaterThan(0);

    const initialTableCount = result.current.tables.length;
    const initialGuestCount = result.current.guests.length;

    await act(async () => {
      await result.current.resetSeating();
    });

    // All guests should now have table_id === null
    const seatedAfter = result.current.guests.filter((g) => g.table_id !== null).length;
    expect(seatedAfter).toBe(0);

    // Tables and guest rosters are strictly preserved
    expect(result.current.tables.length).toBe(initialTableCount);
    expect(result.current.guests.length).toBe(initialGuestCount);
  });

  it('smart auto-seating assigns unassigned guests and groups into tables (FR-10)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    // First unseat all guests
    await act(async () => {
      await result.current.resetSeating();
    });
    expect(result.current.guests.filter((g) => g.table_id !== null).length).toBe(0);

    // Run auto-seating
    let summary: any;
    await act(async () => {
      summary = await result.current.autoAssignSeats();
    });

    expect(summary.assignedGuests).toBeGreaterThan(0);
    expect(summary.tablesUsed).toBeGreaterThan(0);

    // Verify household members are seated in the same table
    const groups = result.current.groups;
    for (const grp of groups) {
      const members = result.current.guests.filter((g) => g.group_id === grp.id && g.table_id !== null);
      if (members.length > 1) {
        const firstTableId = members[0].table_id;
        const allInSameTable = members.every((m) => m.table_id === firstTableId);
        expect(allInSameTable).toBe(true);
      }
    }

    // Verify no table exceeds capacity
    for (const table of result.current.tables) {
      const seated = result.current.guests.filter((g) => g.table_id === table.id).length;
      expect(seated).toBeLessThanOrEqual(table.capacity);
    }
  });

  it('clears all venue layout while preserving guest roster (FR-11.2)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    const initialGuestCount = result.current.guests.length;

    await act(async () => {
      await result.current.clearVenueLayout();
    });

    expect(result.current.tables.length).toBe(0);
    expect(result.current.landmarks.length).toBe(0);
    expect(result.current.guests.length).toBe(initialGuestCount);
    expect(result.current.guests.every((g) => g.table_id === null)).toBe(true);
  });

  it('restores default demo mock data (FR-11.3)', async () => {
    const { result } = renderHook(() => useWedding(), { wrapper });

    // Clear everything first
    await act(async () => {
      await result.current.clearVenueLayout();
    });
    expect(result.current.tables.length).toBe(0);

    // Restore defaults
    await act(async () => {
      await result.current.restoreDefaultData();
    });

    expect(result.current.tables.length).toBeGreaterThanOrEqual(6);
    expect(result.current.landmarks.length).toBeGreaterThanOrEqual(3);
    expect(result.current.guests.length).toBeGreaterThan(0);
  });
});
