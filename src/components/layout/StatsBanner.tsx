import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import {
  Users,
  Utensils,
  Baby,
  Gift,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';

export const StatsBanner: React.FC = () => {
  const { stats } = useWedding();

  return (
    <section className="bg-white border-b border-rose-100 shadow-sm px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Guest Progress */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">總賓客數</div>
            <div className="font-bold text-slate-800">
              {stats.totalGuests} 位{' '}
              <span className="text-[11px] font-normal text-emerald-600">
                (已排 {stats.assignedGuests} / 未排 {stats.unassignedGuests})
              </span>
            </div>
          </div>
        </div>

        {/* Meal Breakdown */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">飲食統計</div>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <span>葷 {stats.meatCount}</span>
              <span className="text-emerald-700">素 {stats.veganCount + stats.vegetarianCount}</span>
              <span className="text-amber-700">兒童餐 {stats.kidMealCount}</span>
            </div>
          </div>
        </div>

        {/* Baby Chairs */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Baby className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">兒童餐椅需求</div>
            <div className="font-bold text-blue-700">{stats.babyChairCount} 張</div>
          </div>
        </div>

        {/* Cakes */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">喜餅發放進度</div>
            <div className="font-bold text-pink-700">
              {stats.cakeClaimedCount} / {stats.cakeTotalCount} 盒
            </div>
          </div>
        </div>

        {/* Check-ins */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">現場報到率</div>
            <div className="font-bold text-emerald-700">
              {stats.checkedInCount} / {stats.totalGuests}{' '}
              <span className="text-[10px] text-slate-400">
                ({stats.totalGuests ? Math.round((stats.checkedInCount / stats.totalGuests) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Total Gift Cash */}
        <div className="flex items-center gap-2 min-w-max pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">已記禮金總額</div>
            <div className="font-bold text-red-700">
              ${stats.totalGiftAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="flex items-center gap-2 min-w-max">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">席次桌數</div>
            <div className="font-bold text-purple-800">
              {stats.totalTables - stats.backupTables} 正桌{' '}
              {stats.backupTables > 0 && (
                <span className="text-[11px] text-slate-500 font-normal">
                  + {stats.backupTables} 備桌
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
