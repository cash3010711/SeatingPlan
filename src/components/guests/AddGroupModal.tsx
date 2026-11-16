import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { SideType } from '../../types';
import { X, Users } from 'lucide-react';

interface AddGroupModalProps {
  onClose: () => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ onClose }) => {
  const { addGroup } = useWedding();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [totalCount, setTotalCount] = useState<number>(3);
  const [side, setSide] = useState<SideType>('groom');
  const [categoryTag, setCategoryTag] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addGroup(
      name.trim(),
      Math.max(1, totalCount),
      contactPerson.trim() || name.trim(),
      notes.trim(),
      side,
      categoryTag.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">建立家庭同行群組</h3>
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
              家庭群組名稱 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!contactPerson) setContactPerson(e.target.value.replace(/一家|家庭/, ''));
              }}
              placeholder="例如: 王大華一家"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">主要聯絡人姓名</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="例如: 王大華"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">同行總人數配額</label>
              <input
                type="number"
                min={1}
                max={15}
                value={totalCount}
                onChange={(e) => setTotalCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
            💡 系統將自動為您建立 1 位主要出席者，並自動補足 {Math.max(0, totalCount - 1)} 位「
            {contactPerson || name || '聯絡人'} 眷屬 #...」佔位席。後續可直接整家一鍵帶入某桌，亦可個別編輯姓名與素食需求！
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">所屬方</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as SideType)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="groom">男方親友</option>
                <option value="bride">女方親友</option>
                <option value="mutual">雙方共同</option>
                <option value="staff">工作人員</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">生活圈分類標籤</label>
              <input
                type="text"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="例如: 大學同學"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">備註說明</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如: 帶 1 幼兒需兒童椅"
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
              建立家庭與佔位席
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
