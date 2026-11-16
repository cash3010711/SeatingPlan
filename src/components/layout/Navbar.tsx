import React, { useState } from 'react';
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
  Plus,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import { LandmarkType } from '../../types';

interface NavbarProps {
  viewMode: 'canvas' | 'board';
  setViewMode: (mode: 'canvas' | 'board') => void;
  onOpenExcel: () => void;
  onOpenSnapshot: () => void;
  onOpenQr: () => void;
  onOpenSettings: () => void;
  onAddTable: () => void;
  onAddLandmark: (type: LandmarkType, name: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  onOpenExcel,
  onOpenSnapshot,
  onOpenQr,
  onOpenSettings,
  onAddTable,
  onAddLandmark,
}) => {
  const { isOnline, isSyncing, isSupabaseActive } = useWedding();
  const [landmarkDropdown, setLandmarkDropdown] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur border-b border-rose-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <span className="text-xl font-bold font-serif leading-none">囍</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                婚禮座位安排與報到系統
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                Live
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">Wedding Seating Plan & Reception Suite</p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'canvas'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D 畫布模式</span>
            <span className="sm:hidden">畫布</span>
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Primary Creation Actions (Add Table & Add Landmark) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddTable}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-rose-200 transition-colors"
            title="新增一張桌子 (可自訂桌號與容納人數)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增桌子</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setLandmarkDropdown(!landmarkDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              title="新增會場地標 (舞台、紅毯、柱子、收禮桌)"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>新增地標</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {landmarkDropdown && (
              <div
                className="absolute top-10 left-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-fadeIn"
                onMouseLeave={() => setLandmarkDropdown(false)}
              >
                <button
                  onClick={() => {
                    onAddLandmark('stage', '主舞台 / 大螢幕');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>主舞台 (Stage)</span>
                  <span className="text-[10px] text-slate-400">長方</span>
                </button>
                <button
                  onClick={() => {
                    onAddLandmark('aisle', '進場紅毯走道');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>紅毯走道 (Aisle)</span>
                  <span className="text-[10px] text-slate-400">走道</span>
                </button>
                <button
                  onClick={() => {
                    onAddLandmark('door', '宴會廳正門');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>大門出入口 (Door)</span>
                  <span className="text-[10px] text-slate-400">拱門</span>
                </button>
                <button
                  onClick={() => {
                    onAddLandmark('pillar', '場地樑柱');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>樑柱遮蔽 (Pillar)</span>
                  <span className="text-[10px] text-slate-400">圓柱</span>
                </button>
                <button
                  onClick={() => {
                    onAddLandmark('reception', '收禮接待桌');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>收禮桌 (Reception)</span>
                  <span className="text-[10px] text-slate-400">長桌</span>
                </button>
                <button
                  onClick={() => {
                    onAddLandmark('audio', '音控與燈光台');
                    setLandmarkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
                >
                  <span>音控燈光台 (Audio)</span>
                  <span className="text-[10px] text-slate-400">控制台</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Excel Modal */}
          <button
            onClick={onOpenExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
            title="Excel 匯入/匯出與範本"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Excel 整合</span>
          </button>

          {/* Snapshot Modal */}
          <button
            onClick={onOpenSnapshot}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
            title="快照備份與版本還原"
          >
            <Camera className="w-4 h-4 text-rose-600" />
            <span className="hidden md:inline">快照備份</span>
          </button>

          {/* QR Code Modal */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
            title="迎賓立牌 QR Code 產生"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">自查 QR</span>
          </button>

          {/* Usher mode page */}
          <Link
            to="/usher"
            target="_blank"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-200 transition-colors"
            title="現場招待報到台 (新分頁開啟)"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">現場招待</span>
          </Link>

          {/* Connection Status / Settings */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
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
            <span className="hidden lg:inline">
              {isSupabaseActive ? '雲端同步' : '離線暫存'}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
