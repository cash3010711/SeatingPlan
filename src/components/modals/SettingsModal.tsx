import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { X, Settings, Database, RotateCcw, Check, Wifi, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    supabaseConfig,
    isSupabaseActive,
    isOnline,
    updateConfig,
    resetToMockData,
  } = useWedding();

  const [url, setUrl] = useState(supabaseConfig.supabaseUrl);
  const [key, setKey] = useState(supabaseConfig.supabaseAnonKey);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(url, key);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        '確定要重置所有資料為系統預載的範例測試資料嗎？這將覆蓋現有所有桌位與名單。'
      )
    ) {
      resetToMockData();
      alert('已重置為預設範例資料！');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">系統與資料庫連線設定</h3>
              <p className="text-[11px] text-slate-400">Supabase Realtime 跨裝置同步與離線降級管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Status banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              isSupabaseActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="font-bold">
                {isSupabaseActive ? '🟢 Supabase 雲端 Realtime 同步中' : '🟡 本地離線暫存模式 (LocalStorage)'}
              </span>
            </div>
            <span className="text-[11px]">網路: {isOnline ? '連線中' : '離線'}</span>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            💡 若未配置 Supabase 金鑰，所有桌位、賓客名單與招待報到依然可於瀏覽器 LocalStorage 完整離線運作。若需多台手機/平板現場同時即時連動，請填寫專屬的 Supabase Project URL 與 Anon Key。
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              Supabase Public Anon Key
            </label>
            <textarea
              rows={2}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置為範例測試資料
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200 transition-colors flex items-center gap-1"
            >
              {savedToast ? <Check className="w-3.5 h-3.5" /> : null}
              {savedToast ? '已儲存！' : '儲存連線設定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
