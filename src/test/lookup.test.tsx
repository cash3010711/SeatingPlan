import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LookupPage } from '../pages/LookupPage';
import { lookupGuestPublic } from '../services/lookupService';
import { saveGuestsToStorage, saveTablesToStorage } from '../utils/storage';
import { initialGuests, initialTables } from '../mock/initialData';

// Mock Supabase to test sanitized local cache fallback deterministically
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => false,
  getSupabase: () => null,
}));

describe('LookupPage & Strict Privacy Protection (FR-5 / H-1)', () => {
  beforeEach(() => {
    localStorage.clear();
    saveTablesToStorage(initialTables);
    saveGuestsToStorage(initialGuests);
  });

  it('lookupGuestPublic strictly omits sensitive fields (gift_amount, gift_receipt_no, notes)', async () => {
    // In initial data, '張偉' has gift_amount: 3600, gift_receipt_no: 'A001', notes: '室友'
    const results = await lookupGuestPublic('張偉');
    expect(results).toHaveLength(1);
    const guest = results[0];

    expect(guest.name).toBe('張偉');
    expect(guest.tableNo).toBe('3');
    expect(guest.tableName).toBe('男方大學同學');
    expect(guest.mealType).toBe('葷食');

    // Verify sensitive keys are NOT present on the returned object
    expect((guest as any).gift_amount).toBeUndefined();
    expect((guest as any).gift_receipt_no).toBeUndefined();
    expect((guest as any).notes).toBeUndefined();
  });

  it('renders welcome screen with wedding greeting standalone', () => {
    render(<LookupPage />);

    expect(screen.getByText(/喜宴座位與桌號自查/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/請輸入您的姓名/i)).toBeInTheDocument();
  });

  it('searches for guest and displays table number without leaking privacy data in DOM', async () => {
    const { container } = render(<LookupPage />);

    const input = screen.getByPlaceholderText(/請輸入您的姓名/i);
    const searchBtn = screen.getByRole('button', { name: /立即查詢我的桌號/i });

    fireEvent.change(input, { target: { value: '張偉' } });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('張偉')).toBeInTheDocument();
    });

    expect(screen.getByText(/第 3 桌/i)).toBeInTheDocument();

    // STRICT PRIVACY VERIFICATION:
    // Ensure gift amount, receipt number, and other guests are NOT in the DOM!
    const textContent = container.textContent || '';
    expect(textContent).not.toContain('3600');
    expect(textContent).not.toContain('A001');
    expect(textContent).not.toContain('$');
    expect(textContent).not.toContain('許芳儀'); // other guest in table 4
    expect(textContent).not.toContain('周杰倫'); // unassigned guest
  });

  it('shows friendly not-found message when guest name is not in database', async () => {
    render(<LookupPage />);

    const input = screen.getByPlaceholderText(/請輸入您的姓名/i);
    const searchBtn = screen.getByRole('button', { name: /立即查詢我的桌號/i });

    fireEvent.change(input, { target: { value: '無名氏不存在' } });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/查無此姓名的座位安排/i)).toBeInTheDocument();
    });
  });
});
