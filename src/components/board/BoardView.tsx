import React, { useState, useRef } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Guest, Table } from '../../types';
import { formatTableNo } from '../../utils/format';
import {
  Users,
  AlertTriangle,
  GripVertical,
  Plus,
  UserMinus,
  Baby,
  Gift,
  Leaf,
  Layers,
} from 'lucide-react';

export const BoardView: React.FC = () => {
  const {
    tables,
    guests,
    assignGuestToTable,
    addTable,
    addGuest,
  } = useWedding();

  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);
  const [quickInputTableId, setQuickInputTableId] = useState<string | null>(null);
  const [quickGuestName, setQuickGuestName] = useState('');

  const unassignedGuests = guests.filter((g) => g.table_id === null);

  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('text/plain', guestId);
    e.dataTransfer.setData('guestId', guestId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGuestId(guestId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== targetId) {
      setActiveDropColumn(targetId);
    }
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTableId: string | null) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const guestId = e.dataTransfer.getData('text/plain') || draggedGuestId;
    if (guestId) {
      await assignGuestToTable(guestId, targetTableId);
    }
    setDraggedGuestId(null);
  };

  const handleQuickAdd = async (tableId: string | null) => {
    if (!quickGuestName.trim()) return;
    await addGuest({
      name: quickGuestName.trim(),
      table_id: tableId,
      side: 'groom',
      meal_type: 'meat',
    });
    setQuickGuestName('');
    setQuickInputTableId(null);
  };

  const boardRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // If vertical delta is 0 or user is using trackpad horizontal gesture, let default happen
    if (e.deltaY === 0) return;

    // Check if the wheel event occurred inside a vertically scrollable container that can scroll
    let target = e.target as HTMLElement | null;
    let canScrollVertically = false;

    while (target && target !== boardRef.current) {
      const style = window.getComputedStyle(target);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const canScrollDown = e.deltaY > 0 && target.scrollTop + target.clientHeight < target.scrollHeight - 1;
        const canScrollUp = e.deltaY < 0 && target.scrollTop > 1;
        if (canScrollDown || canScrollUp) {
          canScrollVertically = true;
          break;
        }
      }
      target = target.parentElement;
    }

    if (!canScrollVertically && boardRef.current) {
      boardRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={boardRef}
      onWheel={handleWheel}
      className="flex-1 overflow-x-auto p-4 bg-slate-100 flex gap-4 items-start h-[calc(100vh-8rem)]"
    >
      {/* Unassigned Pool Column */}
      <div
        onDragOver={(e) => handleDragOver(e, 'unassigned')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={`w-80 shrink-0 bg-slate-50 rounded-2xl border-2 flex flex-col max-h-full transition-all shadow-sm ${
          activeDropColumn === 'unassigned'
            ? 'border-rose-400 ring-2 ring-rose-200'
            : 'border-slate-200'
        }`}
      >
        {/* Column Header */}
        <div className="p-3.5 border-b border-slate-200/80 bg-white/70 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
              {unassignedGuests.length}
            </div>
            <h3 className="font-bold text-sm text-slate-800">未排座位池</h3>
          </div>
          <button
            onClick={() => {
              setQuickInputTableId(quickInputTableId === 'unassigned' ? null : 'unassigned');
              setQuickGuestName('');
            }}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
            title="快速新增至未排池"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Input */}
        {quickInputTableId === 'unassigned' && (
          <div className="p-2 bg-white border-b border-slate-200 flex gap-1">
            <input
              type="text"
              autoFocus
              value={quickGuestName}
              onChange={(e) => setQuickGuestName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(null)}
              placeholder="賓客姓名..."
              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
            />
            <button
              onClick={() => handleQuickAdd(null)}
              className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold"
            >
              新增
            </button>
          </div>
        )}

        {/* Guest Cards list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {unassignedGuests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              暫無未安排賓客
            </div>
          ) : (
            unassignedGuests.map((guest) => (
              <BoardGuestCard
                key={guest.id}
                guest={guest}
                onDragStart={handleDragStart}
                onUnassign={() => {}}
                showUnassign={false}
              />
            ))
          )}
        </div>
      </div>

      {/* Table Columns */}
      {tables.map((table) => {
        const tableGuests = guests.filter((g) => g.table_id === table.id);
        const isOver = tableGuests.length > table.capacity;
        const isFull = tableGuests.length === table.capacity;

        return (
          <div
            key={table.id}
            onDragOver={(e) => handleDragOver(e, table.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, table.id)}
            className={`w-72 shrink-0 bg-white rounded-2xl border-2 flex flex-col max-h-full transition-all shadow-sm ${
              activeDropColumn === table.id
                ? 'border-rose-400 ring-2 ring-rose-200'
                : isOver
                ? 'border-rose-400 bg-rose-50/30'
                : table.is_backup
                ? 'border-dashed border-slate-300'
                : 'border-slate-200'
            }`}
          >
            {/* Table Column Header */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-800">
                    {formatTableNo(table.table_no)}
                  </span>
                  {table.is_backup && (
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                      備桌
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                  {table.name && table.name !== formatTableNo(table.table_no) ? table.name : '—'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    isOver
                      ? 'bg-rose-600 text-white animate-bounce'
                      : isFull
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>
                    {tableGuests.length}/{table.capacity}
                  </span>
                  {isOver && <AlertTriangle className="w-3 h-3 text-amber-200" />}
                </span>

                <button
                  onClick={() => {
                    setQuickInputTableId(quickInputTableId === table.id ? null : table.id);
                    setQuickGuestName('');
                  }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                  title="快速加入賓客至此桌"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Add Input */}
            {quickInputTableId === table.id && (
              <div className="p-2 bg-rose-50 border-b border-rose-200 flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={quickGuestName}
                  onChange={(e) => setQuickGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(table.id)}
                  placeholder="輸入姓名直接排入..."
                  className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
                />
                <button
                  onClick={() => handleQuickAdd(table.id)}
                  className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold"
                >
                  排入
                </button>
              </div>
            )}

            {/* Seated Guests Cards list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {tableGuests.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl m-1">
                  拖曳賓客至此桌入座
                </div>
              ) : (
                tableGuests.map((guest) => (
                  <BoardGuestCard
                    key={guest.id}
                    guest={guest}
                    onDragStart={handleDragStart}
                    onUnassign={() => assignGuestToTable(guest.id, null)}
                    showUnassign={true}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Add New Table Quick Button */}
      <button
        onClick={() =>
          addTable({
            table_no: String(tables.length + 1),
            name: '',
            capacity: 10,
          })
        }
        className="w-48 shrink-0 h-28 border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all font-semibold text-xs"
      >
        <Plus className="w-5 h-5" />
        <span>+ 新增一張桌子</span>
      </button>
    </div>
  );
};

interface BoardGuestCardProps {
  guest: Guest;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onUnassign: () => void;
  showUnassign: boolean;
}

const BoardGuestCard: React.FC<BoardGuestCardProps> = ({
  guest,
  onDragStart,
  onUnassign,
  showUnassign,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, guest.id)}
      className="group bg-white p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-slate-800 truncate">
              {guest.name}
            </span>
            {guest.is_placeholder && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-semibold">
                佔位
              </span>
            )}
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                guest.side === 'groom'
                  ? 'bg-blue-50 text-blue-700'
                  : guest.side === 'bride'
                  ? 'bg-pink-50 text-pink-700'
                  : 'bg-purple-50 text-purple-700'
              }`}
            >
              {guest.side === 'groom' ? '男' : guest.side === 'bride' ? '女' : '共'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
            {guest.meal_type !== 'meat' && (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <Leaf className="w-2.5 h-2.5" />
                {guest.meal_type === 'vegan' ? '全素' : guest.meal_type === 'vegetarian' ? '蛋奶素' : '兒童餐'}
              </span>
            )}
            {guest.needs_baby_chair && (
              <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                <Baby className="w-2.5 h-2.5" />椅
              </span>
            )}
            {guest.cake_count > 0 && (
              <span className="text-pink-700 font-semibold flex items-center gap-0.5">
                <Gift className="w-2.5 h-2.5" />x{guest.cake_count}
              </span>
            )}
            {guest.category_tag && (
              <span className="text-slate-500">#{guest.category_tag}</span>
            )}
          </div>
        </div>
      </div>

      {showUnassign && (
        <button
          onClick={onUnassign}
          className="p-1 text-slate-300 hover:text-amber-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="移出此桌回到未排池"
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
