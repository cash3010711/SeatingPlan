import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { X, Camera, RotateCcw, Trash2, Plus, Clock, Database } from 'lucide-react';

interface SnapshotModalProps {
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ onClose }) => {
  const { snapshots, createSnapshot, restoreSnapshot, deleteSnapshot } = useWedding();
  const [snapshotName, setSnapshotName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSnapshot(snapshotName);
      setSnapshotName('');
    } catch (err) {
      console.error('Failed to create snapshot', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (
      window.confirm(
        `確定要將當前所有桌位與賓客排座還原至快照「${name}」嗎？目前的未儲存微調將被此快照狀態覆蓋。`
      )
    ) {
      try {
        await restoreSnapshot(id);
        alert(`已成功還原至「${name}」！`);
        onClose();
      } catch (err) {
        console.error('Failed to restore snapshot', err);
        alert('還原失敗');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`確定要刪除快照「${name}」嗎？`)) {
      await deleteSnapshot(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-rose-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">全域狀態快照與版本還原</h3>
              <p className="text-[11px] text-slate-400">隨時備份當前排座狀態，一鍵還原無後顧之憂</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create new snapshot box */}
          <form onSubmit={handleCreate} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              建立全新排座快照
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="例如: 大調動前備份版本、確認版A"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? '建立中...' : '建立快照'}
              </button>
            </div>
          </form>

          {/* Snapshot History list */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              歷史快照紀錄 ({snapshots.length})
            </h4>

            {snapshots.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                尚未建立任何快照備份。建議在大幅調動座位或匯入 Excel 前建立一份！
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50/20 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate">
                        {s.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{new Date(s.created_at).toLocaleString('zh-TW')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Database className="w-3 h-3" />
                          桌 {s.state_data.tables.length} / 賓客 {s.state_data.guests.length} / 地標 {s.state_data.landmarks.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestore(s.id, s.name)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="將當前排座還原至此版本"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        還原至此
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除快照"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
