import React, { useState, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Guest, SideType, MealType, CakeStatus } from '../../types';
import { AddGuestModal } from './AddGuestModal';
import { AddGroupModal } from './AddGroupModal';
import { formatTableNo, formatTableLabel } from '../../utils/format';
import {
  Search,
  Filter,
  UserPlus,
  Users,
  ChevronRight,
  GripVertical,
  Baby,
  Gift,
  Leaf,
  Layers,
  Sparkles,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface UnassignedPoolDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const UnassignedPoolDrawer: React.FC<UnassignedPoolDrawerProps> = ({
  isOpen,
  onToggle,
}) => {
  const {
    guests,
    groups,
    tables,
    assignGuestToTable,
    assignGuestsToTable,
    assignGroupToTable,
    deleteGuest,
    updateGuest,
    deleteGroup,
  } = useWedding();

  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [filterVegOnly, setFilterVegOnly] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [batchTargetTableId, setBatchTargetTableId] = useState<string>('');

  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSide, setEditSide] = useState<SideType>('groom');
  const [editMeal, setEditMeal] = useState<MealType>('meat');
  const [editBabyChair, setEditBabyChair] = useState(false);
  const [editCakeCount, setEditCakeCount] = useState(0);

  // Unassigned guests
  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => g.table_id === null);
  }, [guests]);

  // Extract distinct tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    unassignedGuests.forEach((g) => {
      if (g.category_tag && g.category_tag.trim()) {
        set.add(g.category_tag.trim());
      }
    });
    return Array.from(set);
  }, [unassignedGuests]);

  // Filtered unassigned guests
  const filteredGuests = useMemo(() => {
    return unassignedGuests.filter((g) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchNotes = (g.notes || '').toLowerCase().includes(q);
        const matchTag = (g.category_tag || '').toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchTag) return false;
      }
      // Side filter
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      // Veg filter
      if (filterVegOnly && g.meal_type === 'meat') return false;
      // Tag filter
      if (selectedTag !== 'all' && g.category_tag !== selectedTag) return false;

      return true;
    });
  }, [unassignedGuests, search, filterSide, filterVegOnly, selectedTag]);

  // Grouped by household
  const { householdGroups, standaloneGuests } = useMemo(() => {
    const groupMap = new Map<string, Guest[]>();
    const standalone: Guest[] = [];

    filteredGuests.forEach((g) => {
      if (g.group_id) {
        if (!groupMap.has(g.group_id)) groupMap.set(g.group_id, []);
        groupMap.get(g.group_id)!.push(g);
      } else {
        standalone.push(g);
      }
    });

    const groupsList = Array.from(groupMap.entries()).map(([groupId, members]) => {
      const groupInfo = groups.find((grp) => grp.id === groupId);
      return {
        id: groupId,
        name: groupInfo ? groupInfo.name : '家庭群組',
        totalCount: groupInfo ? groupInfo.total_count : members.length,
        notes: groupInfo?.notes || '',
        members,
      };
    });

    return { householdGroups: groupsList, standaloneGuests: standalone };
  }, [filteredGuests, groups]);

  // Batch assign by Tag
  const handleBatchAssignByTag = async () => {
    if (!selectedTag || selectedTag === 'all' || !batchTargetTableId) return;
    const targetGuests = unassignedGuests.filter((g) => g.category_tag === selectedTag);
    if (targetGuests.length === 0) return;

    await assignGuestsToTable(
      targetGuests.map((g) => g.id),
      batchTargetTableId
    );
    setBatchTargetTableId('');
  };

  // Drag start
  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('text/plain', guestId);
    e.dataTransfer.setData('guestId', guestId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const startEditGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setEditName(guest.name);
    setEditSide(guest.side);
    setEditMeal(guest.meal_type);
    setEditBabyChair(guest.needs_baby_chair);
    setEditCakeCount(guest.cake_count);
  };

  const saveEditGuest = async (guestId: string) => {
    const cake_status: CakeStatus = editCakeCount > 0 ? 'unclaimed' : 'none';
    await updateGuest(guestId, {
      name: editName.trim(),
      side: editSide,
      meal_type: editMeal,
      needs_baby_chair: editBabyChair,
      cake_count: editCakeCount,
      cake_status,
      is_placeholder: false, // Once edited name, it's no longer just a placeholder
    });
    setEditingGuestId(null);
  };

  return (
    <>
      {/* Collapse/Expand Toggle Tab on edge */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-36 z-20 bg-rose-600 text-white p-2 rounded-l-xl shadow-lg hover:bg-rose-700 transition-transform ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        title="展開未排賓客名冊抽屜"
      >
        <div className="flex flex-col items-center gap-1 text-[11px] font-bold">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="writing-mode-vertical">未指派名冊 ({unassignedGuests.length})</span>
        </div>
      </button>

      {/* Main Drawer Panel */}
      <aside
        className={`fixed top-16 right-0 bottom-0 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50/60 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              {unassignedGuests.length}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">未安排座位池</h2>
              <p className="text-[11px] text-slate-500">拖曳賓客至左側畫布桌次</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="p-3 border-b border-slate-100 grid grid-cols-2 gap-2 bg-slate-50/50">
          <button
            onClick={() => setShowAddGuest(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-rose-600" />
            + 新增賓客
          </button>
          <button
            onClick={() => setShowAddGroup(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            + 新增家庭群組
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 space-y-2 border-b border-slate-100">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋姓名、備註或標籤..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => setFilterSide('all')}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                filterSide === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterSide('groom')}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                filterSide === 'groom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              男方
            </button>
            <button
              onClick={() => setFilterSide('bride')}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                filterSide === 'bride'
                  ? 'bg-pink-600 text-white'
                  : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
              }`}
            >
              女方
            </button>
            <button
              onClick={() => setFilterVegOnly(!filterVegOnly)}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                filterVegOnly
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              素食
            </button>
          </div>

          {/* Tag filter & Batch assign shortcut */}
          {allTags.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
              >
                <option value="all">生活圈標籤: 全部</option>
                {allTags.map((tag) => {
                  const count = unassignedGuests.filter((g) => g.category_tag === tag).length;
                  return (
                    <option key={tag} value={tag}>
                      #{tag} ({count}人)
                    </option>
                  );
                })}
              </select>

              {selectedTag !== 'all' && (
                <div className="flex items-center gap-1">
                  <select
                    value={batchTargetTableId}
                    onChange={(e) => setBatchTargetTableId(e.target.value)}
                    className="text-[11px] border border-rose-300 rounded-lg px-1.5 py-1 bg-white"
                  >
                    <option value="">批次排入...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {formatTableLabel(t.table_no, t.name)}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!batchTargetTableId}
                    onClick={handleBatchAssignByTag}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg"
                    title="整批標籤成員一鍵排入此桌"
                  >
                    一鍵排桌
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Guest / Family Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {householdGroups.length === 0 && standaloneGuests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p>沒有符合條件的未排賓客</p>
              <p className="mt-1 text-[11px]">所有名冊賓客均已妥善入座！ 🎉</p>
            </div>
          ) : (
            <>
              {/* Household Groups Section */}
              {householdGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-amber-50/50 rounded-xl border border-amber-200 p-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      <span className="font-bold text-xs text-amber-900">
                        {group.name}
                      </span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Bring whole family to table dropdown */}
                    <div className="flex items-center gap-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignGroupToTable(group.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-[10px] bg-white border border-amber-300 rounded px-1.5 py-0.5 text-slate-700 font-medium"
                      >
                        <option value="">整家帶入...</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {formatTableLabel(t.table_no, t.name)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要解散群組「${group.name}」嗎？成員將保留為個別獨立賓客。`)) {
                            deleteGroup(group.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="解散家庭群組 (成員變為個別單人)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {group.notes && (
                    <div className="text-[10px] text-amber-700/80 mb-2 italic">
                      備註: {group.notes}
                    </div>
                  )}

                  {/* Member cards inside this family */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-amber-300/80">
                    {group.members.map((member) => (
                      <GuestCardItem
                        key={member.id}
                        guest={member}
                        tables={tables}
                        editingGuestId={editingGuestId}
                        editName={editName}
                        editSide={editSide}
                        editMeal={editMeal}
                        editBabyChair={editBabyChair}
                        editCakeCount={editCakeCount}
                        setEditName={setEditName}
                        setEditSide={setEditSide}
                        setEditMeal={setEditMeal}
                        setEditBabyChair={setEditBabyChair}
                        setEditCakeCount={setEditCakeCount}
                        onDragStart={handleDragStart}
                        onStartEdit={startEditGuest}
                        onSaveEdit={saveEditGuest}
                        onCancelEdit={() => setEditingGuestId(null)}
                        onAssignToTable={(tableId) => assignGuestToTable(member.id, tableId)}
                        onDelete={() => deleteGuest(member.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Standalone Guests Section */}
              {standaloneGuests.map((guest) => (
                <GuestCardItem
                  key={guest.id}
                  guest={guest}
                  tables={tables}
                  editingGuestId={editingGuestId}
                  editName={editName}
                  editSide={editSide}
                  editMeal={editMeal}
                  editBabyChair={editBabyChair}
                  editCakeCount={editCakeCount}
                  setEditName={setEditName}
                  setEditSide={setEditSide}
                  setEditMeal={setEditMeal}
                  setEditBabyChair={setEditBabyChair}
                  setEditCakeCount={setEditCakeCount}
                  onDragStart={handleDragStart}
                  onStartEdit={startEditGuest}
                  onSaveEdit={saveEditGuest}
                  onCancelEdit={() => setEditingGuestId(null)}
                  onAssignToTable={(tableId) => assignGuestToTable(guest.id, tableId)}
                  onDelete={() => deleteGuest(guest.id)}
                />
              ))}
            </>
          )}
        </div>
      </aside>

      {/* Modals */}
      {showAddGuest && <AddGuestModal onClose={() => setShowAddGuest(false)} />}
      {showAddGroup && <AddGroupModal onClose={() => setShowAddGroup(false)} />}
    </>
  );
};

// Sub-component for individual guest card
interface GuestCardItemProps {
  guest: Guest;
  tables: any[];
  editingGuestId: string | null;
  editName: string;
  editSide: SideType;
  editMeal: MealType;
  editBabyChair: boolean;
  editCakeCount: number;
  setEditName: (v: string) => void;
  setEditSide: (v: SideType) => void;
  setEditMeal: (v: MealType) => void;
  setEditBabyChair: (v: boolean) => void;
  setEditCakeCount: (v: number) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onStartEdit: (guest: Guest) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onAssignToTable: (tableId: string | null) => void;
  onDelete: () => void;
}

const GuestCardItem: React.FC<GuestCardItemProps> = ({
  guest,
  tables,
  editingGuestId,
  editName,
  editSide,
  editMeal,
  editBabyChair,
  editCakeCount,
  setEditName,
  setEditSide,
  setEditMeal,
  setEditBabyChair,
  setEditCakeCount,
  onDragStart,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAssignToTable,
  onDelete,
}) => {
  const isEditing = editingGuestId === guest.id;

  if (isEditing) {
    return (
      <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-xs space-y-2">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full px-2 py-1 border border-slate-300 rounded font-bold"
          placeholder="姓名"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={editSide}
            onChange={(e) => setEditSide(e.target.value as SideType)}
            className="border border-slate-300 rounded px-1 py-0.5 bg-white text-[11px]"
          >
            <option value="groom">男方</option>
            <option value="bride">女方</option>
            <option value="mutual">共同</option>
            <option value="staff">工作人員</option>
          </select>
          <select
            value={editMeal}
            onChange={(e) => setEditMeal(e.target.value as MealType)}
            className="border border-slate-300 rounded px-1 py-0.5 bg-white text-[11px]"
          >
            <option value="meat">葷食</option>
            <option value="vegan">全素</option>
            <option value="vegetarian">蛋奶素</option>
            <option value="kid">兒童餐</option>
            <option value="special">特殊</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={editBabyChair}
              onChange={(e) => setEditBabyChair(e.target.checked)}
            />
            需兒童椅
          </label>
          <div className="flex items-center gap-1">
            <span>喜餅:</span>
            <input
              type="number"
              min={0}
              value={editCakeCount}
              onChange={(e) => setEditCakeCount(parseInt(e.target.value, 10) || 0)}
              className="w-12 border border-slate-300 rounded px-1 py-0.5 text-center"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-1">
          <button
            onClick={onCancelEdit}
            className="px-2 py-0.5 rounded text-slate-500 hover:bg-slate-200 text-[11px]"
          >
            取消
          </button>
          <button
            onClick={() => onSaveEdit(guest.id)}
            className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 text-[11px] flex items-center gap-0.5"
          >
            <Check className="w-3 h-3" /> 儲存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, guest.id)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-rose-300 p-2 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-slate-800 truncate">
              {guest.name}
            </span>
            {guest.is_placeholder && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-semibold">
                佔位
              </span>
            )}
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                guest.side === 'groom'
                  ? 'bg-blue-50 text-blue-700'
                  : guest.side === 'bride'
                  ? 'bg-pink-50 text-pink-700'
                  : 'bg-purple-50 text-purple-700'
              }`}
            >
              {guest.side === 'groom' ? '男' : guest.side === 'bride' ? '女' : '共'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
            {guest.meal_type !== 'meat' && (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <Leaf className="w-2.5 h-2.5" />
                {guest.meal_type === 'vegan' ? '全素' : guest.meal_type === 'vegetarian' ? '蛋奶素' : '兒童餐'}
              </span>
            )}
            {guest.needs_baby_chair && (
              <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                <Baby className="w-2.5 h-2.5" />椅
              </span>
            )}
            {guest.cake_count > 0 && (
              <span className="text-pink-700 font-semibold flex items-center gap-0.5">
                <Gift className="w-2.5 h-2.5" />x{guest.cake_count}
              </span>
            )}
            {guest.category_tag && (
              <span className="text-slate-500">#{guest.category_tag}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onAssignToTable(e.target.value);
              e.target.value = '';
            }
          }}
          className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 text-slate-700 hover:border-rose-400"
        >
          <option value="">指派至...</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {formatTableLabel(t.table_no, t.name)}
            </option>
          ))}
        </select>

        <button
          onClick={() => onStartEdit(guest)}
          className="p-1 text-slate-300 hover:text-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="編輯資訊"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            if (window.confirm(`確定要刪除「${guest.name}」嗎？`)) {
              onDelete();
            }
          }}
          className="p-1 text-slate-300 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="刪除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
