import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WeddingProvider } from '../context/WeddingContext';
import { TableDetailModal } from '../components/canvas/TableDetailModal';
import { BoardView } from '../components/board/BoardView';
import { WeddingCanvas } from '../components/canvas/WeddingCanvas';
import { Navbar } from '../components/layout/Navbar';
import { initialTables } from '../mock/initialData';

describe('TableDetailModal Inline Guest Editing & Event Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockTable = initialTables[0]; // tbl-main: 主桌，內有新郎、新娘等賓客

  it('renders table details and supports inline guest editing', async () => {
    const handleClose = vi.fn();

    render(
      <WeddingProvider>
        <TableDetailModal table={mockTable} onClose={handleClose} />
      </WeddingProvider>
    );

    // Check table title
    expect(screen.getByText('主桌')).toBeDefined();

    // Check if edit buttons exist for guests in this table
    const editButtons = screen.getAllByTitle('編輯賓客資訊');
    expect(editButtons.length).toBeGreaterThan(0);

    // Click the first edit button
    act(() => {
      fireEvent.click(editButtons[0]);
    });

    // Inline edit form should appear with save and cancel buttons
    const saveButton = screen.getByText('儲存變更');
    const cancelButton = screen.getByText('取消');
    expect(saveButton).toBeDefined();
    expect(cancelButton).toBeDefined();

    // Edit guest name input
    const nameInput = screen.getByPlaceholderText('賓客姓名') as HTMLInputElement;
    act(() => {
      fireEvent.change(nameInput, { target: { value: '王大同 (已修改)' } });
    });

    // Save changes
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify modified name is displayed in the list
    expect(await screen.findByText('王大同 (已修改)')).toBeDefined();
  });

  it('stops wheel event propagation on modal backdrop and content body', () => {
    const handleClose = vi.fn();

    const { container } = render(
      <WeddingProvider>
        <TableDetailModal table={mockTable} onClose={handleClose} />
      </WeddingProvider>
    );

    const backdrop = container.firstChild as HTMLElement;
    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

    backdrop.dispatchEvent(wheelEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('supports inline editing of guest card inside BoardView', async () => {
    render(
      <WeddingProvider>
        <BoardView />
      </WeddingProvider>
    );

    // Look for edit buttons on board guest cards
    const editButtons = screen.getAllByTitle('編輯賓客資訊');
    expect(editButtons.length).toBeGreaterThan(0);

    // Click the first edit button on a guest card
    act(() => {
      fireEvent.click(editButtons[0]);
    });

    // Inline edit form inside the card should render
    const saveButton = screen.getByText('儲存');
    const cancelButton = screen.getByText('取消');
    expect(saveButton).toBeDefined();
    expect(cancelButton).toBeDefined();

    // Edit name
    const nameInput = screen.getByPlaceholderText('賓客姓名') as HTMLInputElement;
    act(() => {
      fireEvent.change(nameInput, { target: { value: '看板賓客 (已編輯)' } });
    });

    // Save
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify modified name is present
    expect(await screen.findByText('看板賓客 (已編輯)')).toBeDefined();
  });

  it('calculates dynamic centered pan when resetting view on WeddingCanvas', async () => {
    const handleDrop = vi.fn();
    const { container } = render(
      <WeddingProvider>
        <WeddingCanvas onDropGuestToTable={handleDrop} />
      </WeddingProvider>
    );

    const resetButton = screen.getByTitle('重置視角並將桌位圖置中 (100%)');
    expect(resetButton).toBeDefined();

    await act(async () => {
      fireEvent.click(resetButton);
    });

    // Verify that zoom displays 100%
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('renders "畫布模式" toggle in Navbar', () => {
    const handleSetViewMode = vi.fn();
    render(
      <MemoryRouter>
        <WeddingProvider>
          <Navbar
            viewMode="canvas"
            setViewMode={handleSetViewMode}
            onOpenExcel={vi.fn()}
            onOpenSnapshot={vi.fn()}
            onOpenQr={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </WeddingProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('畫布模式')).toBeDefined();
  });

  it('opens and closes reset management dropdown via portal without clipping', () => {
    const handleSetViewMode = vi.fn();
    render(
      <MemoryRouter>
        <WeddingProvider>
          <Navbar
            viewMode="canvas"
            setViewMode={handleSetViewMode}
            onOpenExcel={vi.fn()}
            onOpenSnapshot={vi.fn()}
            onOpenQr={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </WeddingProvider>
      </MemoryRouter>
    );

    const resetBtn = screen.getByTitle('重置座位安排或清空佈局');
    expect(resetBtn).toBeDefined();

    // Menu should not be open initially
    expect(screen.queryByText(/重置目前排座/)).toBeNull();

    // Click to open dropdown
    act(() => {
      fireEvent.click(resetBtn);
    });

    // Check dropdown menu items are visible in DOM (rendered via portal)
    expect(screen.getByText(/重置目前排座/)).toBeDefined();
    expect(screen.getByText(/清空桌位與地標/)).toBeDefined();
    expect(screen.getByText(/回復原版示範資料/)).toBeDefined();

    // Press Escape to close
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // Should be closed
    expect(screen.queryByText(/重置目前排座/)).toBeNull();
  });
});


