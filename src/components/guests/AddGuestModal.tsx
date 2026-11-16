import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { SideType, MealType, CakeStatus } from '../../types';
import { X, UserPlus } from 'lucide-react';

interface AddGuestModalProps {
  onClose: () => void;
}

export const AddGuestModal: React.FC<AddGuestModalProps> = ({ onClose }) => {
  const { addGuest, tables } = useWedding();

  const [name, setName] = useState('');
  const [side, setSide] = useState<SideType>('groom');
  const [mealType, setMealType] = useState<MealType>('meat');
  const [needsBabyChair, setNeedsBabyChair] = useState(false);
  const [cakeCount, setCakeCount] = useState<number>(0);
  const [categoryTag, setCategoryTag] = useState('');
  const [notes, setNotes] = useState('');
  const [targetTableId, setTargetTableId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cake_status: CakeStatus = cakeCount > 0 ? 'unclaimed' : 'none';

    await addGuest({
      name: name.trim(),
      side,
      meal_type: mealType,
      needs_baby_chair: needsBabyChair,
      cake_count: cakeCount,
      cake_status,
      category_tag: categoryTag.trim(),
      notes: notes.trim(),
      table_id: targetTableId || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">新增個別賓客</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              賓客姓名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 王大明"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">所屬方</label>
              <select
                value={side}
                onChange={(e) => {
                  const s = e.target.value as SideType;
                  setSide(s);
                  if (s === 'bride' && cakeCount === 0) setCakeCount(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="groom">男方親友 (Groom)</option>
                <option value="bride">女方親友 (Bride)</option>
                <option value="mutual">雙方共同 (Mutual)</option>
                <option value="staff">工作人員 (Staff)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">飲食習慣</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="meat">葷食 (Meat)</option>
                <option value="vegan">全素 (Vegan)</option>
                <option value="vegetarian">蛋奶素 (Vegetarian)</option>
                <option value="kid">兒童餐 (Kid's Meal)</option>
                <option value="special">特殊需求 (Special)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">喜餅盒數</label>
              <input
                type="number"
                min={0}
                value={cakeCount}
                onChange={(e) => setCakeCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">關係生活圈標籤</label>
              <input
                type="text"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="例如: 大學同學, 伴郎團"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={needsBabyChair}
                onChange={(e) => setNeedsBabyChair(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              需要提供兒童餐椅 (Baby Chair)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">預先指派桌次 (選填)</label>
            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="">放入未指派賓客池 (暫不排桌)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  第 {t.table_no} 桌 ({t.name || '無名'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">備註說明</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="飲食過敏、特殊交通安排等"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200"
            >
              確認建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
