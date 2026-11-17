import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  FileSpreadsheet,
  Camera,
  QrCode,
  UserCheck,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  Zap,
  RotateCcw,
  ChevronDown,
  Trash2,
  Users,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';

interface NavbarProps {
  viewMode: 'canvas' | 'board';
  setViewMode: (mode: 'canvas' | 'board') => void;
  onOpenExcel: () => void;
  onOpenSnapshot: () => void;
  onOpenQr: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  onOpenExcel,
  onOpenSnapshot,
  onOpenQr,
  onOpenSettings,
}) => {
  const {
    isOnline,
    isSyncing,
    isSupabaseActive,
    tables,
    guests,
    autoAssignSeats,
    resetSeating,
    clearVenueLayout,
    restoreDefaultData,
  } = useWedding();

  const [showResetMenu, setShowResetMenu] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const updateMenuPosition = () => {
    if (resetButtonRef.current) {
      const rect = resetButtonRef.current.getBoundingClientRect();
      const right = Math.max(8, window.innerWidth - rect.right);
      const top = rect.bottom + 6;
      setMenuPosition({ top, right });
    }
  };

  const toggleResetMenu = () => {
    if (!showResetMenu) {
      updateMenuPosition();
    }
    setShowResetMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showResetMenu) return;

    updateMenuPosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        resetMenuRef.current &&
        !resetMenuRef.current.contains(target) &&
        resetButtonRef.current &&
        !resetButtonRef.current.contains(target)
      ) {
        setShowResetMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResetMenu(false);
      }
    };

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [showResetMenu]);

  // Handle Smart Auto-Seating
  const handleAutoAssign = async () => {
    const unassignedCount = guests.filter((g) => g.table_id === null).length;
    if (unassignedCount === 0) {
      alert('所有賓客皆已妥善安排座位，目前沒有未排座位的賓客！');
      return;
    }
    const formalTables = tables.filter((t) => !t.is_backup);
    if (formalTables.length === 0) {
      alert('會場目前沒有可用之正式桌次，請先在畫布或看板新增桌子！');
      return;
    }

    if (
      window.confirm(
        `即將為未排座位池的 ${unassignedCount} 位賓客啟動「智慧自動排座」：\n\n` +
          `• 家庭群組整戶同桌不拆散\n` +
          `• 優先聚合同分類生活圈標籤與男女方親友\n` +
          `• 嚴格遵循各桌容納上限\n\n` +
          `是否立即開始編排？`
      )
    ) {
      const res = await autoAssignSeats();
      alert(`🎉 智慧排座完成！共為 ${res.assignedGuests} 位賓客安排入座 ${res.tablesUsed} 張桌次。`);
    }
  };

  // Reset 1: Reset Seating Assignments (all guests to unassigned)
  const handleResetSeating = async () => {
    setShowResetMenu(false);
    if (
      window.confirm(
        '⚠️ 確定要「重置目前排座」嗎？\n\n' +
          '• 所有已排桌的賓客將全數退回「未排座位池」\n' +
          '• 所有桌子、地標與賓客名冊皆會完整保留\n\n' +
          '此操作無法復原，是否繼續？'
      )
    ) {
      await resetSeating();
      alert('已重置所有座位安排，所有賓客已移至未排座位池！');
    }
  };

  // Reset 2: Clear Venue Layout (delete tables & landmarks, unseat guests, keep guest roster)
  const handleClearVenueLayout = async () => {
    setShowResetMenu(false);
    if (
      window.confirm(
        '🚨 確定要「清空桌位與地標」嗎？\n\n' +
          '• 畫布上所有桌位與會場地標將被完全清除\n' +
          '• 賓客名冊與家庭群組將完整保留（所有人移至未排池）\n\n' +
          '此操作無法復原，是否確定清除？'
      )
    ) {
      await clearVenueLayout();
      alert('已清空所有桌位與會場地標，賓客名單已完整保留！');
    }
  };

  // Reset 3: Restore Default Demo Data
  const handleRestoreDefaultData = async () => {
    setShowResetMenu(false);
    if (
      window.confirm(
        '🔄 確定要「回復原版示範資料」嗎？\n\n' +
          '• 將完整還原系統原版示範資料（含主桌、男女親友桌、地標與範例賓客）\n' +
          '• 目前未儲存為快照的自訂改動將會被覆蓋\n\n' +
          '是否確認回復原版示範資料？'
      )
    ) {
      await restoreDefaultData();
      alert('已成功回復系統原版示範資料！');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur border-b border-rose-100 shadow-sm sticky top-0 z-30">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
            <span className="text-xl font-bold font-serif leading-none">囍</span>
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight whitespace-nowrap">
                婚禮座位安排與報到系統
              </h1>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                Live
              </span>
            </div>
            <p className="hidden 2xl:block text-[11px] text-slate-400 whitespace-nowrap">Wedding Seating Plan & Reception Suite</p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">畫布模式</span>
            <span className="sm:hidden">畫布</span>
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              viewMode === 'board'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">看板模式</span>
            <span className="sm:hidden">看板</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Smart Auto Seating Button */}
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-rose-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
            title="依照家庭不拆散、生活圈標籤與男女方智慧排座"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">一鍵排座</span>
          </button>

          {/* Reset / Management Dropdown */}
          <div className="relative shrink-0">
            <button
              ref={resetButtonRef}
              onClick={toggleResetMenu}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors border whitespace-nowrap ${
                showResetMenu
                  ? 'text-rose-700 bg-rose-50 border-rose-300'
                  : 'text-slate-700 hover:text-rose-700 hover:bg-rose-50 border-slate-200'
              }`}
              title="重置座位安排或清空佈局"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xl:inline">重置管理</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showResetMenu ? 'rotate-180' : ''}`} />
            </button>

            {showResetMenu &&
              createPortal(
                <div
                  ref={resetMenuRef}
                  style={{
                    position: 'fixed',
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                    zIndex: 9999,
                  }}
                  className="w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 animate-fadeIn select-none"
                >
                  <button
                    onClick={handleResetSeating}
                    className="w-full text-left px-3 py-2.5 hover:bg-rose-50 text-xs font-medium text-slate-800 flex flex-col gap-0.5 border-b border-slate-100 transition-colors"
                  >
                    <span className="font-bold text-rose-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      重置目前排座 (清空座位)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      所有賓客退回未排池，保留桌子、地標與名冊
                    </span>
                  </button>

                  <button
                    onClick={handleClearVenueLayout}
                    className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-xs font-medium text-slate-800 flex flex-col gap-0.5 border-b border-slate-100 transition-colors"
                  >
                    <span className="font-bold text-red-600 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      清空桌位與地標
                    </span>
                    <span className="text-[11px] text-slate-500">
                      清除畫布上所有桌子與地標，完整保留賓客名冊
                    </span>
                  </button>

                  <button
                    onClick={handleRestoreDefaultData}
                    className="w-full text-left px-3 py-2.5 hover:bg-amber-50 text-xs font-medium text-slate-800 flex flex-col gap-0.5 transition-colors"
                  >
                    <span className="font-bold text-amber-700 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      回復原版示範資料
                    </span>
                    <span className="text-[11px] text-slate-500">
                      載入系統預設示範主桌、地標與賓客名單
                    </span>
                  </button>
                </div>,
                document.body
              )}
          </div>

          {/* Excel Modal */}
          <button
            onClick={onOpenExcel}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
            title="Excel 匯入/匯出與範本"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Excel 整合</span>
          </button>

          {/* Snapshot Modal */}
          <button
            onClick={onOpenSnapshot}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
            title="快照備份與版本還原"
          >
            <Camera className="w-4 h-4 text-rose-600" />
            <span className="hidden lg:inline">快照備份</span>
          </button>

          {/* QR Code Modal */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
            title="迎賓立牌 QR Code 產生"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span className="hidden xl:inline">自查 QR</span>
          </button>

          {/* Usher mode page */}
          <Link
            to="/usher"
            target="_blank"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-200 transition-colors whitespace-nowrap shrink-0"
            title="現場招待報到台 (新分頁開啟)"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden md:inline">現場招待</span>
          </Link>

          {/* Connection Status / Settings */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
              isSupabaseActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isSupabaseActive ? '已連線至 Supabase' : '離線模式 / LocalStorage'}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden 2xl:inline">
              {isSupabaseActive ? '雲端同步' : '離線暫存'}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
