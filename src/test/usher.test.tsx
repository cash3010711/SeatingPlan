import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsherPage } from '../pages/UsherPage';
import { WeddingProvider } from '../context/WeddingContext';

describe('Usher Reception View (FR-4)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders reception dashboard and search bar', () => {
    render(
      <WeddingProvider>
        <UsherPage />
      </WeddingProvider>
    );

    expect(screen.getByText(/現場招待速查與報到台/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/輸入姓名、桌號或備註快速搜尋/i)).toBeInTheDocument();
  });

  it('filters guests quickly when typing in search bar', () => {
    render(
      <WeddingProvider>
        <UsherPage />
      </WeddingProvider>
    );

    const searchInput = screen.getByPlaceholderText(/輸入姓名、桌號或備註快速搜尋/i);

    // Initial mock data has '新郎' and '新娘' in main table
    fireEvent.change(searchInput, { target: { value: '許芳儀' } });

    expect(screen.getByText('許芳儀')).toBeInTheDocument();
    expect(screen.queryByText('李宗盛')).not.toBeInTheDocument();
  });

  it('allows one-click check-in and cake claiming', async () => {
    render(
      <WeddingProvider>
        <UsherPage />
      </WeddingProvider>
    );

    const searchInput = screen.getByPlaceholderText(/輸入姓名、桌號或備註快速搜尋/i);
    fireEvent.change(searchInput, { target: { value: '許芳儀' } });

    // Click '一鍵報到'
    const checkInBtn = screen.getByText('一鍵報到');
    fireEvent.click(checkInBtn);

    expect(screen.getByText('已完成報到')).toBeInTheDocument();

    // Click '領取喜餅'
    const cakeBtn = screen.getByText(/領取喜餅/i);
    fireEvent.click(cakeBtn);

    expect(screen.getByText(/已領喜餅/i)).toBeInTheDocument();
  });
});
