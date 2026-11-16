import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Guest, Table } from '../types';
import { formatTableNo } from '../utils/format';
import {
  Search,
  CheckCircle2,
  Gift,
  DollarSign,
  Wifi,
  WifiOff,
  RefreshCw,
  Baby,
  Leaf,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export const UsherPage: React.FC = () => {
  const {
    guests,
    tables,
    isOnline,
    isSyncing,
    isSupabaseActive,
    checkInGuest,
    claimCake,
    recordGift,
  } = useWedding();

  const [search, setSearch] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState<'all' | 'uncheked' | 'checked'>('all');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [expandedGiftId, setExpandedGiftId] = useState<string | null>(null);

  // Table lookup map
  const tableMap = useMemo(() => new Map<string, Table>(tables.map((t) => [t.id, t])), [tables]);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchNotes = (g.notes || '').toLowerCase().includes(q);
        const matchTag = (g.category_tag || '').toLowerCase().includes(q);
        const table = g.table_id ? tableMap.get(g.table_id) : null;
        const matchTable = table ? table.table_no.toLowerCase().includes(q) || table.name.toLowerCase().includes(q) : false;
        if (!matchName && !matchNotes && !matchTag && !matchTable) return false;
      }

      // Check-in filter
      if (filterCheckIn === 'uncheked' && g.is_checked_in) return false;
      if (filterCheckIn === 'checked' && !g.is_checked_in) return false;

      // Side filter
      if (filterSide !== 'all' && g.side !== filterSide) return false;

      return true;
    });
  }, [guests, search, filterCheckIn, filterSide, tableMap]);

  // Usher stats
  const checkInCount = guests.filter((g) => g.is_checked_in).length;
  const totalCakes = guests.reduce((sum, g) => sum + g.cake_count, 0);
  const claimedCakes = guests
    .filter((g) => g.cake_status === 'claimed')
    .reduce((sum, g) => sum + (g.cake_count || 1), 0);
  const totalGift = guests.reduce((sum, g) => sum + (g.gift_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Reception Header */}
      <header className="bg-rose-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-700 flex items-center justify-center font-serif text-xl font-bold shadow-sm">
              囍
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-1.5">
                現場招待速查與報到台
              </h1>
              <div className="text-[11px] text-rose-100">
                已報到 {checkInCount} / {guests.length} 位 ({guests.length ? Math.round((checkInCount / guests.length) * 100) : 0}%)
              </div>
            </div>
          </div>

          {/* Connection status badge */}
          <div className="flex items-center gap-1.5 bg-rose-800/80 px-3 py-1.5 rounded-xl border border-rose-600 text-xs font-semibold">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : isOnline && isSupabaseActive ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
            <span className="text-[11px]">
              {isSyncing
                ? '同步中...'
                : isOnline && isSupabaseActive
                ? '🟢 線上同步中'
                : '🟡 離線暫存模式'}
            </span>
          </div>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="bg-rose-800/60 border-t border-rose-600/50 px-4 py-1.5 text-xs text-rose-100">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar font-medium">
            <span>
              喜餅發放: <strong className="text-white">{claimedCakes} / {totalCakes} 盒</strong>
            </span>
            <span>•</span>
            <span>
              已收禮金: <strong className="text-amber-300">${totalGift.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1 flex flex-col space-y-3">
        {/* Search Bar - Big Mobile Friendly */}
        <div className="relative shadow-sm rounded-2xl bg-white border border-slate-200">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="輸入姓名、桌號或備註快速搜尋 (如: 陳、林、主桌)..."
            className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setFilterCheckIn('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterCheckIn === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            全部賓客 ({guests.length})
          </button>
          <button
            onClick={() => setFilterCheckIn('uncheked')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterCheckIn === 'uncheked'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-slate-200'
            }`}
          >
            未報到 ({guests.length - checkInCount})
          </button>
          <button
            onClick={() => setFilterCheckIn('checked')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterCheckIn === 'checked'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-slate-200'
            }`}
          >
            已報到 ({checkInCount})
          </button>

          <span className="text-slate-300">|</span>

          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700"
          >
            <option value="all">全部所屬</option>
            <option value="groom">男方親友</option>
            <option value="bride">女方親友</option>
            <option value="mutual">共同親友</option>
            <option value="staff">工作人員</option>
          </select>
        </div>

        {/* Guest Cards list */}
        <div className="space-y-3 flex-1 pb-10">
          {filteredGuests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold">查無符合條件的賓客</p>
              <p className="text-xs text-slate-400 mt-1">請嘗試修改搜尋關鍵字或重設過濾條件</p>
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const table = guest.table_id ? tableMap.get(guest.table_id) : null;
              const isGiftOpen = expandedGiftId === guest.id;

              return (
                <div
                  key={guest.id}
                  className={`bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${
                    guest.is_checked_in
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Guest Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                          {guest.name}
                        </span>
                        {guest.is_placeholder && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            同行佔位席
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            guest.side === 'groom'
                              ? 'bg-blue-100 text-blue-800'
                              : guest.side === 'bride'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-purple-100 text-purple-800'
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
                        {guest.category_tag && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            #{guest.category_tag}
                          </span>
                        )}
                      </div>

                      {/* Seating Table Banner */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          {table
                            ? formatTableNo(table.table_no)
                            : '⚠️ 尚未排桌'}
                          {table?.name && table.name !== formatTableNo(table.table_no) && (
                            <span className="font-normal text-slate-600 ml-1">({table.name})</span>
                          )}
                        </span>
                      </div>

                      {/* Dietary & Accommodations */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 flex-wrap">
                        {guest.meal_type !== 'meat' ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Leaf className="w-3.5 h-3.5" />
                            {guest.meal_type === 'vegan'
                              ? '全素'
                              : guest.meal_type === 'vegetarian'
                              ? '蛋奶素'
                              : guest.meal_type === 'kid'
                              ? '兒童餐'
                              : '特殊餐'}
                          </span>
                        ) : (
                          <span className="text-slate-500">葷食</span>
                        )}

                        {guest.needs_baby_chair && (
                          <span className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            <Baby className="w-3.5 h-3.5" />
                            需要兒童椅
                          </span>
                        )}

                        {guest.notes && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                            備註: {guest.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Touch Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Cake Button (if bride side or cake_count > 0) */}
                      {(guest.cake_count > 0 || guest.side === 'bride') && (
                        <button
                          onClick={() =>
                            claimCake(
                              guest.id,
                              guest.cake_status === 'claimed' ? 'unclaimed' : 'claimed'
                            )
                          }
                          className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                            guest.cake_status === 'claimed'
                              ? 'bg-pink-100 text-pink-700 border border-pink-300'
                              : 'bg-pink-600 hover:bg-pink-700 text-white'
                          }`}
                        >
                          <Gift className="w-4 h-4" />
                          <span>
                            {guest.cake_status === 'claimed'
                              ? `已領喜餅 (${guest.cake_count || 1}盒)`
                              : `領取喜餅 (${guest.cake_count || 1}盒)`}
                          </span>
                        </button>
                      )}

                      {/* Check-In Button */}
                      <button
                        onClick={() => checkInGuest(guest.id, !guest.is_checked_in)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md ${
                          guest.is_checked_in
                            ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-600'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{guest.is_checked_in ? '已完成報到' : '一鍵報到'}</span>
                      </button>

                      {/* Gift Drawer Toggle */}
                      <button
                        onClick={() => setExpandedGiftId(isGiftOpen ? null : guest.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                          guest.gift_amount
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="登記禮金"
                      >
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">
                          {guest.gift_amount ? `$${guest.gift_amount}` : '記禮金'}
                        </span>
                        {isGiftOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Gift Input Drawer */}
                  {isGiftOpen && (
                    <UsherGiftDrawer
                      guest={guest}
                      onSave={async (amount, receipt) => {
                        await recordGift(guest.id, amount, receipt);
                        setExpandedGiftId(null);
                      }}
                      onClose={() => setExpandedGiftId(null)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

// Sub-component for Gift Money quick input drawer
interface UsherGiftDrawerProps {
  guest: Guest;
  onSave: (amount: number | null, receiptNo: string | null) => Promise<void>;
  onClose: () => void;
}

const UsherGiftDrawer: React.FC<UsherGiftDrawerProps> = ({ guest, onSave, onClose }) => {
  const [amount, setAmount] = useState<string>(guest.gift_amount ? String(guest.gift_amount) : '');
  const [receipt, setReceipt] = useState<string>(guest.gift_receipt_no || '');

  const quickAmounts = [2000, 2600, 3200, 3600, 6000, 6600, 12000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = amount ? parseInt(amount, 10) : null;
    onSave(parsedAmount, receipt.trim() || null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-amber-50/70 p-4 border-t border-amber-200 text-xs space-y-3 animate-fadeIn"
    >
      <div className="flex items-center justify-between font-bold text-amber-900">
        <span>💰 禮金台記帳 — {guest.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          取消
        </button>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-500 text-[11px] font-medium mr-1">快捷金額:</span>
        {quickAmounts.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setAmount(String(val))}
            className="px-2.5 py-1 bg-white hover:bg-amber-200/80 border border-amber-300 rounded-lg font-bold text-amber-900 shadow-2xs"
          >
            ${val.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            禮金金額 (NT$)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例如: 3600"
            className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            紅包收據編號 / 備註
          </label>
          <input
            type="text"
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            placeholder="例如: A001"
            className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setAmount('');
            setReceipt('');
            onSave(null, null);
          }}
          className="px-3 py-1.5 text-slate-500 hover:text-red-600 font-semibold text-xs"
        >
          清除此筆禮金
        </button>
        <button
          type="submit"
          className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors"
        >
          儲存禮金記錄
        </button>
      </div>
    </form>
  );
};
