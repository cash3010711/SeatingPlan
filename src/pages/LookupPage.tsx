import React, { useState } from 'react';
import { lookupGuestPublic, SanitizedLookupResult } from '../services/lookupService';
import { Search, Heart, Sparkles, MapPin, Utensils, Baby, Gift, ShieldCheck, Loader2 } from 'lucide-react';
import { formatTableNo } from '../utils/format';

export const LookupPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SanitizedLookupResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const sanitizedMatches = await lookupGuestPublic(query);
      setResults(sanitizedMatches);
      setSearched(true);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50/40 to-rose-100/60 flex flex-col items-center justify-between p-4 sm:p-6 text-slate-800 font-sans">
      {/* Decorative Wedding Header */}
      <div className="w-full max-w-md pt-8 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-xl shadow-rose-200">
          <span className="text-3xl font-bold font-serif">囍</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-bold tracking-widest uppercase">
            <Heart className="w-3.5 h-3.5 fill-rose-600" />
            <span>Welcome to Our Wedding Banquet</span>
            <Heart className="w-3.5 h-3.5 fill-rose-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            喜宴座位與桌號自查
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            感謝您的蒞臨與祝福！請輸入您的姓名查詢今日入座桌次。
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md my-6 bg-white/95 backdrop-blur rounded-3xl shadow-xl shadow-rose-200/40 border border-rose-100 p-6 space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              required
              autoFocus
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) setSearched(false);
              }}
              placeholder="請輸入您的姓名 (例如: 王大明)..."
              className="w-full pl-12 pr-4 py-3.5 text-base rounded-2xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-60 text-white font-bold text-base rounded-2xl shadow-lg shadow-rose-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{loading ? '查詢中...' : '立即查詢我的桌號'}</span>
          </button>
        </form>

        {/* Results Area */}
        {searched && (
          <div className="space-y-4 pt-2 animate-fadeIn">
            {results.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-700">查無此姓名的座位安排</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  若您使用別名或同行眷屬姓名，請嘗試其他關鍵字，或直接洽詢現場迎賓招待人員為您引導！
                </p>
              </div>
            ) : (
              results.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-rose-50/70 via-amber-50/30 to-white rounded-2xl border-2 border-rose-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-500">貴賓姓名:</span>
                      <span className="text-lg font-black text-slate-900">{item.name}</span>
                    </div>
                    <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      歡迎入座
                    </span>
                  </div>

                  {/* Seating Location Card */}
                  <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-2xs space-y-2">
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      您今日安排的桌次為：
                    </div>
                    <div className="text-2xl font-black text-rose-700 tracking-tight">
                      {formatTableNo(item.tableNo)}
                    </div>
                    {item.tableName && (
                      <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                        桌名標示：{item.tableName}
                      </div>
                    )}
                  </div>

                  {/* Meal & Amenities */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 px-1">
                    <div className="flex items-center gap-1 font-semibold">
                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                      <span>餐食安排: {item.mealType}</span>
                    </div>
                    {item.needsBabyChair && (
                      <div className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        <Baby className="w-3.5 h-3.5" />
                        <span>備有兒童餐椅</span>
                      </div>
                    )}
                    {item.cakeCount > 0 && (
                      <div className="flex items-center gap-1 text-pink-700 font-semibold bg-pink-50 px-2 py-0.5 rounded">
                        <Gift className="w-3.5 h-3.5" />
                        <span>喜餅 {item.cakeCount} 盒</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Strict Privacy Shield Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>隱私保護保證：本系統不公開他人資料與個人紀錄</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 pb-4">
        祝您用餐愉快 • 幸福長久
      </footer>
    </div>
  );
};
