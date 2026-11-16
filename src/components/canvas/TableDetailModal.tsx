import React, { useState } from 'react';
import { Table, Guest } from '../../types';
import { useWedding } from '../../context/WeddingContext';
import {
  X,
  Trash2,
  UserMinus,
  ArrowRightLeft,
  Plus,
  Baby,
  Gift,
  Leaf,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface TableDetailModalProps {
  table: Table;
  onClose: () => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({ table, onClose }) => {
  const {
    tables,
    guests,
    updateTable,
    deleteTable,
    assignGuestToTable,
    addGuest,
  } = useWedding();

  const [tableNo, setTableNo] = useState(table.table_no);
  const [name, setName] = useState(table.name);
  const [capacity, setCapacity] = useState(table.capacity);
  const [shape, setShape] = useState(table.shape);
  const [isBackup, setIsBackup] = useState(table.is_backup);
  const [newGuestName, setNewGuestName] = useState('');
  const [selectedMoveGuest, setSelectedMoveGuest] = useState<string | null>(null);
  const [targetTableId, setTargetTableId] = useState<string>('');

  const tableGuests = guests.filter((g) => g.table_id === table.id);
  const isOver = tableGuests.length > capacity;

  const handleSaveInfo = async () => {
    await updateTable(table.id, {
      table_no: tableNo,
      name,
      capacity: Number(capacity),
      shape,
      is_backup: isBackup,
    });
  };

  const handleDeleteTable = async () => {
    if (window.confirm(`確定要刪除「第 ${table.table_no} 桌」嗎？桌內 ${tableGuests.length} 位賓客將回到未排賓客池。`)) {
      await deleteTable(table.id);
      onClose();
    }
  };

  const handleQuickAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    await addGuest({
      name: newGuestName.trim(),
      table_id: table.id,
      side: 'groom',
      meal_type: 'meat',
    });
    setNewGuestName('');
  };

  const handleMoveGuest = async (guestId: string, destTableId: string) => {
    await assignGuestToTable(guestId, destTableId || null);
    setSelectedMoveGuest(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-rose-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-rose-700">
              {table.table_no.length <= 3 ? `第 ${table.table_no} 桌` : table.table_no}
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {table.name ? `(${table.name})` : ''}
            </span>
            {isBackup && (
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                預備桌
              </span>
            )}
            {isOver && (
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                超額 ({tableGuests.length}/{capacity})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Table Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">桌號 (代稱)</label>
              <input
                type="text"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                onBlur={handleSaveInfo}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="例如: 1, 2, 主桌"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">桌名 / 備註</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveInfo}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="例如: 男方大學同學"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">容納上限 (人)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                onBlur={handleSaveInfo}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">桌子形狀</label>
              <select
                value={shape}
                onChange={(e) => {
                  setShape(e.target.value as any);
                  updateTable(table.id, { shape: e.target.value as any });
                }}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="circle">圓桌 (Circle)</option>
                <option value="rect">長條桌 (Rect)</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBackup}
                  onChange={(e) => {
                    setIsBackup(e.target.checked);
                    updateTable(table.id, { is_backup: e.target.checked });
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                標記為「預備桌 (備桌)」
              </label>
              <button
                type="button"
                onClick={handleSaveInfo}
                className="text-xs bg-rose-600 text-white px-3 py-1 rounded-md hover:bg-rose-700 flex items-center gap-1 font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                儲存桌位設定
              </button>
            </div>
          </div>

          {/* Quick Add Guest to This Table */}
          <form onSubmit={handleQuickAddGuest} className="flex gap-2">
            <input
              type="text"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="輸入賓客姓名，直接加入此桌..."
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!newGuestName.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              加入此桌
            </button>
          </form>

          {/* Seated Guests List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                已入座賓客 ({tableGuests.length} / {capacity} 位)
              </h4>
              <span className="text-xs text-slate-500">
                點擊圖示可移出至未排池或轉移他桌
              </span>
            </div>

            {tableGuests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                目前此桌尚未安排任何賓客。可從右側未排賓客池拖拉入桌。
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {tableGuests.map((guest, idx) => (
                  <div
                    key={guest.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                          <span>{guest.name}</span>
                          {guest.is_placeholder && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                              佔位
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              guest.side === 'groom'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : guest.side === 'bride'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {guest.side === 'groom'
                              ? '男方'
                              : guest.side === 'bride'
                              ? '女方'
                              : guest.side === 'mutual'
                              ? '共同'
                              : '工作人員'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          {guest.meal_type !== 'meat' && (
                            <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
                              <Leaf className="w-3 h-3" />
                              {guest.meal_type === 'vegan'
                                ? '全素'
                                : guest.meal_type === 'vegetarian'
                                ? '蛋奶素'
                                : guest.meal_type === 'kid'
                                ? '兒童餐'
                                : '特殊餐'}
                            </span>
                          )}
                          {guest.needs_baby_chair && (
                            <span className="flex items-center gap-0.5 text-blue-700 font-medium">
                              <Baby className="w-3 h-3" />
                              需兒童椅
                            </span>
                          )}
                          {guest.cake_count > 0 && (
                            <span className="flex items-center gap-0.5 text-pink-700 font-medium">
                              <Gift className="w-3 h-3" />
                              喜餅 x{guest.cake_count}
                            </span>
                          )}
                          {guest.category_tag && (
                            <span className="text-[11px] text-slate-400">
                              #{guest.category_tag}
                            </span>
                          )}
                          {guest.notes && (
                            <span className="text-[11px] text-amber-600 bg-amber-50 px-1 rounded truncate max-w-[150px]">
                              {guest.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for this guest */}
                    <div className="flex items-center gap-1.5">
                      {selectedMoveGuest === guest.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg">
                          <select
                            value={targetTableId}
                            onChange={(e) => setTargetTableId(e.target.value)}
                            className="text-xs border border-rose-300 rounded px-1.5 py-1 bg-white"
                          >
                            <option value="">移至未排池</option>
                            {tables
                              .filter((t) => t.id !== table.id)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  第 {t.table_no} 桌 ({t.name || '無名'})
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={() => handleMoveGuest(guest.id, targetTableId)}
                            className="text-xs bg-rose-600 text-white px-2 py-1 rounded font-medium hover:bg-rose-700"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => setSelectedMoveGuest(null)}
                            className="text-xs text-slate-500 hover:text-slate-800 px-1"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMoveGuest(guest.id);
                              setTargetTableId('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="轉移至其他桌次"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => assignGuestToTable(guest.id, null)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="移出此桌 (返回未指派池)"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={handleDeleteTable}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            刪除此桌位
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
