import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Table, Guest, Group, Landmark, Snapshot, StatsSummary, CakeStatus } from '../types';
import {
  loadTablesFromStorage,
  saveTablesToStorage,
  loadGuestsFromStorage,
  saveGuestsToStorage,
  loadGroupsFromStorage,
  saveGroupsToStorage,
  loadLandmarksFromStorage,
  saveLandmarksToStorage,
  loadSnapshotsFromStorage,
  saveSnapshotsToStorage,
  loadOfflineQueue,
  clearOfflineQueue,
  enqueueOfflineAction,
  saveStoredConfig,
  loadStoredConfig,
} from '../utils/storage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ParsedRow } from '../utils/excel';
import { initialTables, initialGuests, initialGroups, initialLandmarks } from '../mock/initialData';

interface WeddingContextType {
  tables: Table[];
  guests: Guest[];
  groups: Group[];
  landmarks: Landmark[];
  snapshots: Snapshot[];
  stats: StatsSummary;
  isOnline: boolean;
  isSyncing: boolean;
  isSupabaseActive: boolean;
  supabaseConfig: { supabaseUrl: string; supabaseAnonKey: string };
  // Table operations
  addTable: (table: Partial<Table>) => Promise<Table>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  // Guest operations
  addGuest: (guest: Partial<Guest>) => Promise<Guest>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  assignGuestToTable: (guestId: string, tableId: string | null) => Promise<void>;
  assignGuestsToTable: (guestIds: string[], tableId: string | null) => Promise<void>;
  assignGroupToTable: (groupId: string, tableId: string | null) => Promise<void>;
  checkInGuest: (guestId: string, isCheckedIn: boolean) => Promise<void>;
  claimCake: (guestId: string, status: CakeStatus) => Promise<void>;
  recordGift: (guestId: string, amount: number | null, receiptNo: string | null) => Promise<void>;
  // Group operations
  addGroup: (name: string, totalCount: number, contactPerson?: string, notes?: string, side?: Guest['side'], categoryTag?: string) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  // Landmark operations
  addLandmark: (landmark: Partial<Landmark>) => Promise<Landmark>;
  updateLandmark: (id: string, updates: Partial<Landmark>) => Promise<void>;
  deleteLandmark: (id: string) => Promise<void>;
  // Excel import
  importGuests: (parsedRows: ParsedRow[]) => Promise<{ added: number; skipped: number; merged: number }>;
  // Snapshots
  createSnapshot: (name: string) => Promise<Snapshot>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
  // Config & Reset
  updateConfig: (url: string, key: string) => void;
  resetToMockData: () => void;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>(() => loadTablesFromStorage());
  const [guests, setGuests] = useState<Guest[]>(() => loadGuestsFromStorage());
  const [groups, setGroups] = useState<Group[]>(() => loadGroupsFromStorage());
  const [landmarks, setLandmarks] = useState<Landmark[]>(() => loadLandmarksFromStorage());
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => loadSnapshotsFromStorage());

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseConfig, setSupabaseConfig] = useState(() => loadStoredConfig());

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    saveTablesToStorage(tables);
  }, [tables]);

  useEffect(() => {
    saveGuestsToStorage(guests);
  }, [guests]);

  useEffect(() => {
    saveGroupsToStorage(groups);
  }, [groups]);

  useEffect(() => {
    saveLandmarksToStorage(landmarks);
  }, [landmarks]);

  useEffect(() => {
    saveSnapshotsToStorage(snapshots);
  }, [snapshots]);

  // Process offline sync queue to Supabase when connected
  const processOfflineQueue = useCallback(async () => {
    const client = getSupabase();
    if (!client || !isOnline) return;

    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      for (const item of queue) {
        if (item.action === 'UPDATE_GUEST' || item.action === 'CHECK_IN' || item.action === 'CLAIM_CAKE' || item.action === 'RECORD_GIFT') {
          if (item.guestId) {
            await client.from('guests').update(item.payload).eq('id', item.guestId);
          }
        } else if (item.action === 'UPSERT_TABLE') {
          await client.from('tables').upsert(item.payload);
        } else if (item.action === 'DELETE_TABLE') {
          await client.from('tables').delete().eq('id', item.payload.id);
        } else if (item.action === 'UPSERT_GUEST') {
          await client.from('guests').upsert(item.payload);
        } else if (item.action === 'DELETE_GUEST') {
          await client.from('guests').delete().eq('id', item.payload.id);
        } else if (item.action === 'UPSERT_GROUP') {
          await client.from('groups').upsert(item.payload);
        } else if (item.action === 'DELETE_GROUP') {
          await client.from('groups').delete().eq('id', item.payload.id);
        } else if (item.action === 'UPSERT_LANDMARK') {
          await client.from('landmarks').upsert(item.payload);
        } else if (item.action === 'DELETE_LANDMARK') {
          await client.from('landmarks').delete().eq('id', item.payload.id);
        }
      }
      clearOfflineQueue();
    } catch (err) {
      console.error('Error processing offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Initial fetch and Realtime subscription with Supabase
  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setIsSupabaseActive(false);
      return;
    }

    setIsSupabaseActive(true);
    let isSubscribed = true;

    async function fetchAll() {
      setIsSyncing(true);
      try {
        const [tblRes, gstRes, grpRes, lmRes, snpRes] = await Promise.all([
          client!.from('tables').select('*').order('sort_order', { ascending: true }),
          client!.from('guests').select('*'),
          client!.from('groups').select('*'),
          client!.from('landmarks').select('*'),
          client!.from('snapshots').select('*').order('created_at', { ascending: false }),
        ]);

        if (isSubscribed) {
          if (tblRes.data && tblRes.data.length > 0) setTables(tblRes.data);
          if (gstRes.data && gstRes.data.length > 0) setGuests(gstRes.data);
          if (grpRes.data && grpRes.data.length > 0) setGroups(grpRes.data);
          if (lmRes.data && lmRes.data.length > 0) setLandmarks(lmRes.data);
          if (snpRes.data && snpRes.data.length > 0) setSnapshots(snpRes.data);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, continuing with local storage:', err);
      } finally {
        if (isSubscribed) setIsSyncing(false);
      }
    }

    fetchAll();

    // Subscribe to Realtime
    const channel = client
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTables((prev) => [...prev.filter((t) => t.id !== (payload.new as Table).id), payload.new as Table]);
        } else if (payload.eventType === 'UPDATE') {
          setTables((prev) => prev.map((t) => (t.id === (payload.new as Table).id ? (payload.new as Table) : t)));
        } else if (payload.eventType === 'DELETE') {
          setTables((prev) => prev.filter((t) => t.id !== (payload.old as Table).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setGuests((prev) => [...prev.filter((g) => g.id !== (payload.new as Guest).id), payload.new as Guest]);
        } else if (payload.eventType === 'UPDATE') {
          setGuests((prev) => prev.map((g) => (g.id === (payload.new as Guest).id ? (payload.new as Guest) : g)));
        } else if (payload.eventType === 'DELETE') {
          setGuests((prev) => prev.filter((g) => g.id !== (payload.old as Guest).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setGroups((prev) => [...prev.filter((g) => g.id !== (payload.new as Group).id), payload.new as Group]);
        } else if (payload.eventType === 'UPDATE') {
          setGroups((prev) => prev.map((g) => (g.id === (payload.new as Group).id ? (payload.new as Group) : g)));
        } else if (payload.eventType === 'DELETE') {
          setGroups((prev) => prev.filter((g) => g.id !== (payload.old as Group).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'landmarks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLandmarks((prev) => [...prev.filter((l) => l.id !== (payload.new as Landmark).id), payload.new as Landmark]);
        } else if (payload.eventType === 'UPDATE') {
          setLandmarks((prev) => prev.map((l) => (l.id === (payload.new as Landmark).id ? (payload.new as Landmark) : l)));
        } else if (payload.eventType === 'DELETE') {
          setLandmarks((prev) => prev.filter((l) => l.id !== (payload.old as Landmark).id));
        }
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      client.removeChannel(channel);
    };
  }, [supabaseConfig]);

  // Statistics calculator
  const stats: StatsSummary = useMemo(() => {
    let assignedGuests = 0;
    let meatCount = 0;
    let veganCount = 0;
    let vegetarianCount = 0;
    let kidMealCount = 0;
    let specialMealCount = 0;
    let babyChairCount = 0;
    let cakeTotalCount = 0;
    let cakeClaimedCount = 0;
    let checkedInCount = 0;
    let totalGiftAmount = 0;

    guests.forEach((g) => {
      if (g.table_id) assignedGuests++;
      if (g.meal_type === 'meat') meatCount++;
      else if (g.meal_type === 'vegan') veganCount++;
      else if (g.meal_type === 'vegetarian') vegetarianCount++;
      else if (g.meal_type === 'kid') kidMealCount++;
      else if (g.meal_type === 'special') specialMealCount++;

      if (g.needs_baby_chair) babyChairCount++;
      cakeTotalCount += g.cake_count;
      if (g.cake_status === 'claimed') cakeClaimedCount += g.cake_count || 1;
      if (g.is_checked_in) checkedInCount++;
      if (g.gift_amount) totalGiftAmount += g.gift_amount;
    });

    const backupTables = tables.filter((t) => t.is_backup).length;

    return {
      totalGuests: guests.length,
      assignedGuests,
      unassignedGuests: guests.length - assignedGuests,
      meatCount,
      veganCount,
      vegetarianCount,
      kidMealCount,
      specialMealCount,
      babyChairCount,
      cakeTotalCount,
      cakeClaimedCount,
      checkedInCount,
      totalGiftAmount,
      totalTables: tables.length,
      backupTables,
    };
  }, [tables, guests]);

  // Table operations
  const addTable = async (data: Partial<Table>): Promise<Table> => {
    const newTable: Table = {
      id: 'tbl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      table_no: data.table_no || String(tables.length + 1),
      name: data.name || '',
      capacity: data.capacity !== undefined ? data.capacity : 10,
      shape: data.shape || 'circle',
      is_backup: data.is_backup || false,
      x: data.x !== undefined ? data.x : 200 + (tables.length % 5) * 160,
      y: data.y !== undefined ? data.y : 300 + Math.floor(tables.length / 5) * 160,
      sort_order: data.sort_order !== undefined ? data.sort_order : tables.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTables((prev) => [...prev, newTable]);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('tables').insert(newTable);
      } catch (err) {
        console.warn('Failed to insert table to Supabase, queuing offline:', err);
        enqueueOfflineAction({ action: 'UPSERT_TABLE', payload: newTable });
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_TABLE', payload: newTable });
    }

    return newTable;
  };

  const updateTable = async (id: string, updates: Partial<Table>): Promise<void> => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('tables').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Failed to update table on Supabase, queuing offline:', err);
        enqueueOfflineAction({ action: 'UPSERT_TABLE', payload: { id, ...updates } });
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_TABLE', payload: { id, ...updates } });
    }
  };

  const deleteTable = async (id: string): Promise<void> => {
    const unassignedGuestIds = guests.filter((g) => g.table_id === id).map((g) => g.id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    // Unassign guests in this table
    setGuests((prev) => prev.map((g) => (g.table_id === id ? { ...g, table_id: null } : g)));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').update({ table_id: null }).eq('table_id', id);
        await client.from('tables').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete table on Supabase, queuing offline:', err);
        for (const gid of unassignedGuestIds) {
          enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: gid, payload: { table_id: null } });
        }
        enqueueOfflineAction({ action: 'DELETE_TABLE', payload: { id } });
      }
    } else {
      for (const gid of unassignedGuestIds) {
        enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: gid, payload: { table_id: null } });
      }
      enqueueOfflineAction({ action: 'DELETE_TABLE', payload: { id } });
    }
  };

  // Guest operations
  const addGuest = async (data: Partial<Guest>): Promise<Guest> => {
    const newGuest: Guest = {
      id: 'gst-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      table_id: data.table_id || null,
      group_id: data.group_id || null,
      name: data.name || '新賓客',
      side: data.side || 'groom',
      meal_type: data.meal_type || 'meat',
      needs_baby_chair: data.needs_baby_chair || false,
      cake_status: data.cake_status || 'none',
      cake_count: data.cake_count !== undefined ? data.cake_count : 0,
      is_checked_in: data.is_checked_in || false,
      gift_amount: data.gift_amount || null,
      gift_receipt_no: data.gift_receipt_no || null,
      category_tag: data.category_tag || '',
      notes: data.notes || '',
      is_placeholder: data.is_placeholder || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setGuests((prev) => [...prev, newGuest]);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').insert(newGuest);
      } catch (err) {
        enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: newGuest });
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: newGuest });
    }

    return newGuest;
  };

  const updateGuest = async (id: string, updates: Partial<Guest>): Promise<void> => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
    );

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').update(updates).eq('id', id);
      } catch (err) {
        enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: id, payload: updates });
      }
    } else {
      enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: id, payload: updates });
    }
  };

  const deleteGuest = async (id: string): Promise<void> => {
    setGuests((prev) => prev.filter((g) => g.id !== id));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').delete().eq('id', id);
      } catch (err) {
        enqueueOfflineAction({ action: 'DELETE_GUEST', payload: { id } });
      }
    } else {
      enqueueOfflineAction({ action: 'DELETE_GUEST', payload: { id } });
    }
  };

  const assignGuestToTable = async (guestId: string, tableId: string | null): Promise<void> => {
    await updateGuest(guestId, { table_id: tableId });
  };

  const assignGuestsToTable = async (guestIds: string[], tableId: string | null): Promise<void> => {
    setGuests((prev) =>
      prev.map((g) => (guestIds.includes(g.id) ? { ...g, table_id: tableId, updated_at: new Date().toISOString() } : g))
    );

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').update({ table_id: tableId }).in('id', guestIds);
      } catch (err) {
        for (const gid of guestIds) {
          enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: gid, payload: { table_id: tableId } });
        }
      }
    } else {
      for (const gid of guestIds) {
        enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: gid, payload: { table_id: tableId } });
      }
    }
  };

  const assignGroupToTable = async (groupId: string, tableId: string | null): Promise<void> => {
    const groupGuestIds = guests.filter((g) => g.group_id === groupId).map((g) => g.id);
    if (groupGuestIds.length > 0) {
      await assignGuestsToTable(groupGuestIds, tableId);
    }
  };

  const checkInGuest = async (guestId: string, isCheckedIn: boolean): Promise<void> => {
    await updateGuest(guestId, { is_checked_in: isCheckedIn });
  };

  const claimCake = async (guestId: string, status: CakeStatus): Promise<void> => {
    await updateGuest(guestId, { cake_status: status });
  };

  const recordGift = async (guestId: string, amount: number | null, receiptNo: string | null): Promise<void> => {
    await updateGuest(guestId, { gift_amount: amount, gift_receipt_no: receiptNo });
  };

  // Group operations
  const addGroup = async (
    name: string,
    totalCount: number,
    contactPerson?: string,
    notes?: string,
    side: Guest['side'] = 'groom',
    categoryTag: string = ''
  ): Promise<Group> => {
    const newGroup: Group = {
      id: 'grp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name,
      total_count: totalCount,
      contact_person: contactPerson || name,
      notes: notes || '',
      created_at: new Date().toISOString(),
    };

    setGroups((prev) => [...prev, newGroup]);

    // Create primary contact guest
    const primaryGuest: Guest = {
      id: 'gst-' + Date.now() + '-1',
      table_id: null,
      group_id: newGroup.id,
      name: contactPerson || name,
      side,
      meal_type: 'meat',
      needs_baby_chair: false,
      cake_status: side === 'bride' ? 'unclaimed' : 'none',
      cake_count: side === 'bride' ? 1 : 0,
      is_checked_in: false,
      gift_amount: null,
      gift_receipt_no: null,
      category_tag: categoryTag,
      notes: notes || '',
      is_placeholder: false,
      created_at: new Date().toISOString(),
    };

    const newGuestsToAdd: Guest[] = [primaryGuest];

    // Create placeholder guests if totalCount > 1
    for (let i = 1; i < totalCount; i++) {
      newGuestsToAdd.push({
        id: 'gst-' + Date.now() + '-' + (i + 1) + '-' + Math.random().toString(36).slice(2, 5),
        table_id: null,
        group_id: newGroup.id,
        name: `${contactPerson || name} 眷屬 #${i}`,
        side,
        meal_type: 'meat',
        needs_baby_chair: false,
        cake_status: 'none',
        cake_count: 0,
        is_checked_in: false,
        gift_amount: null,
        gift_receipt_no: null,
        category_tag: categoryTag,
        notes: '',
        is_placeholder: true,
        created_at: new Date().toISOString(),
      });
    }

    setGuests((prev) => [...prev, ...newGuestsToAdd]);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('groups').insert(newGroup);
        await client.from('guests').insert(newGuestsToAdd);
      } catch (err) {
        enqueueOfflineAction({ action: 'UPSERT_GROUP', payload: newGroup });
        for (const g of newGuestsToAdd) {
          enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: g });
        }
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_GROUP', payload: newGroup });
      for (const g of newGuestsToAdd) {
        enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: g });
      }
    }

    return newGroup;
  };

  const deleteGroup = async (groupId: string): Promise<void> => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setGuests((prev) => prev.map((g) => (g.group_id === groupId ? { ...g, group_id: null } : g)));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('guests').update({ group_id: null }).eq('group_id', groupId);
        await client.from('groups').delete().eq('id', groupId);
      } catch (err) {
        enqueueOfflineAction({ action: 'DELETE_GROUP', payload: { id: groupId } });
      }
    } else {
      enqueueOfflineAction({ action: 'DELETE_GROUP', payload: { id: groupId } });
    }
  };

  // Landmark operations
  const addLandmark = async (data: Partial<Landmark>): Promise<Landmark> => {
    const newLm: Landmark = {
      id: 'lm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: data.name || '新地標',
      type: data.type || 'stage',
      x: data.x !== undefined ? data.x : 200,
      y: data.y !== undefined ? data.y : 100,
      width: data.width !== undefined ? data.width : 200,
      height: data.height !== undefined ? data.height : 60,
      rotation: data.rotation || 0,
      created_at: new Date().toISOString(),
    };

    setLandmarks((prev) => [...prev, newLm]);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('landmarks').insert(newLm);
      } catch (err) {
        enqueueOfflineAction({ action: 'UPSERT_LANDMARK', payload: newLm });
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_LANDMARK', payload: newLm });
    }

    return newLm;
  };

  const updateLandmark = async (id: string, updates: Partial<Landmark>): Promise<void> => {
    setLandmarks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('landmarks').update(updates).eq('id', id);
      } catch (err) {
        enqueueOfflineAction({ action: 'UPSERT_LANDMARK', payload: { id, ...updates } });
      }
    } else {
      enqueueOfflineAction({ action: 'UPSERT_LANDMARK', payload: { id, ...updates } });
    }
  };

  const deleteLandmark = async (id: string): Promise<void> => {
    setLandmarks((prev) => prev.filter((l) => l.id !== id));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('landmarks').delete().eq('id', id);
      } catch (err) {
        enqueueOfflineAction({ action: 'DELETE_LANDMARK', payload: { id } });
      }
    } else {
      enqueueOfflineAction({ action: 'DELETE_LANDMARK', payload: { id } });
    }
  };

  // Excel Import: Append-only with deduplication strategy
  const importGuests = async (parsedRows: ParsedRow[]): Promise<{ added: number; skipped: number; merged: number }> => {
    let added = 0;
    let skipped = 0;
    let merged = 0;

    const newGuestsToAdd: Guest[] = [];
    const newGroupsToAdd: Group[] = [];
    const guestsToUpdate: { id: string; updates: Partial<Guest> }[] = [];
    
    // Dynamic map to track current state during multi-row batch processing
    const guestMap = new Map<string, Guest>();
    for (const g of guests) {
      guestMap.set(g.name.trim().toLowerCase(), { ...g });
    }

    for (const row of parsedRows) {
      const key = row.name.trim().toLowerCase();
      const existing = guestMap.get(key);

      if (existing && row.duplicateAction === 'skip') {
        skipped++;
        continue;
      }

      if (existing && row.duplicateAction === 'merge') {
        // Merge updates into existing guest
        merged++;
        const mergedNotes = [existing.notes, row.notes].filter(Boolean).join('; ');
        const updatedGuest: Guest = {
          ...existing,
          side: row.side,
          meal_type: row.meal_type,
          needs_baby_chair: row.needs_baby_chair || existing.needs_baby_chair,
          cake_count: row.cake_count > 0 ? row.cake_count : existing.cake_count,
          cake_status: row.cake_count > 0 ? row.cake_status : existing.cake_status,
          category_tag: row.category_tag || existing.category_tag,
          notes: mergedNotes,
          updated_at: new Date().toISOString(),
        };

        guestMap.set(key, updatedGuest);
        const existingUpdateIdx = guestsToUpdate.findIndex((u) => u.id === existing.id);
        if (existingUpdateIdx >= 0) {
          guestsToUpdate[existingUpdateIdx].updates = updatedGuest;
        } else {
          guestsToUpdate.push({ id: existing.id, updates: updatedGuest });
        }
        continue;
      }

      // Add as new guest (Option 1 or new)
      added++;
      const gid = 'gst-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      let groupId: string | null = null;

      // If total_count > 1, create group and placeholders
      if (row.total_count > 1) {
        const grpId = 'grp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        groupId = grpId;
        const newGroup: Group = {
          id: grpId,
          name: `${row.name}一家`,
          total_count: row.total_count,
          contact_person: row.name,
          notes: row.notes,
          created_at: new Date().toISOString(),
        };
        newGroupsToAdd.push(newGroup);

        // Placeholders
        for (let i = 1; i < row.total_count; i++) {
          newGuestsToAdd.push({
            id: 'gst-' + Date.now() + '-' + (i + 1) + '-' + Math.random().toString(36).slice(2, 6),
            table_id: null,
            group_id: grpId,
            name: `${row.name} 眷屬 #${i}`,
            side: row.side,
            meal_type: 'meat',
            needs_baby_chair: false,
            cake_status: 'none',
            cake_count: 0,
            is_checked_in: false,
            gift_amount: null,
            gift_receipt_no: null,
            category_tag: row.category_tag,
            notes: '',
            is_placeholder: true,
            created_at: new Date().toISOString(),
          });
        }
      }

      const primaryNewGuest: Guest = {
        id: gid,
        table_id: null,
        group_id: groupId,
        name: row.name,
        side: row.side,
        meal_type: row.meal_type,
        needs_baby_chair: row.needs_baby_chair,
        cake_status: row.cake_status,
        cake_count: row.cake_count,
        is_checked_in: false,
        gift_amount: null,
        gift_receipt_no: null,
        category_tag: row.category_tag,
        notes: row.notes,
        is_placeholder: false,
        created_at: new Date().toISOString(),
      };

      newGuestsToAdd.push(primaryNewGuest);
      guestMap.set(key, primaryNewGuest);
    }

    if (newGroupsToAdd.length > 0) {
      setGroups((prev) => [...prev, ...newGroupsToAdd]);
      const client = getSupabase();
      if (client && isOnline) {
        try {
          await client.from('groups').insert(newGroupsToAdd);
        } catch (err) {
          for (const grp of newGroupsToAdd) enqueueOfflineAction({ action: 'UPSERT_GROUP', payload: grp });
        }
      } else {
        for (const grp of newGroupsToAdd) enqueueOfflineAction({ action: 'UPSERT_GROUP', payload: grp });
      }
    }

    if (newGuestsToAdd.length > 0) {
      setGuests((prev) => [...prev, ...newGuestsToAdd]);
      const client = getSupabase();
      if (client && isOnline) {
        try {
          await client.from('guests').insert(newGuestsToAdd);
        } catch (err) {
          for (const g of newGuestsToAdd) enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: g });
        }
      } else {
        for (const g of newGuestsToAdd) enqueueOfflineAction({ action: 'UPSERT_GUEST', payload: g });
      }
    }

    if (guestsToUpdate.length > 0) {
      setGuests((prev) =>
        prev.map((g) => {
          const item = guestsToUpdate.find((u) => u.id === g.id);
          return item ? { ...g, ...item.updates } : g;
        })
      );
      const client = getSupabase();
      if (client && isOnline) {
        for (const item of guestsToUpdate) {
          try {
            await client.from('guests').update(item.updates).eq('id', item.id);
          } catch (err) {
            enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: item.id, payload: item.updates });
          }
        }
      } else {
        for (const item of guestsToUpdate) {
          enqueueOfflineAction({ action: 'UPDATE_GUEST', guestId: item.id, payload: item.updates });
        }
      }
    }

    return { added, skipped, merged };
  };

  // Snapshot operations
  const createSnapshot = async (name: string): Promise<Snapshot> => {
    const newSnapshot: Snapshot = {
      id: 'snp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: name.trim() || `快照備份 ${new Date().toLocaleString('zh-TW')}`,
      state_data: {
        tables: JSON.parse(JSON.stringify(tables)),
        guests: JSON.parse(JSON.stringify(guests)),
        groups: JSON.parse(JSON.stringify(groups)),
        landmarks: JSON.parse(JSON.stringify(landmarks)),
      },
      created_at: new Date().toISOString(),
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('snapshots').insert(newSnapshot);
      } catch (err) {
        console.warn('Failed to insert snapshot to Supabase:', err);
      }
    }

    return newSnapshot;
  };

  const restoreSnapshot = async (snapshotId: string): Promise<void> => {
    const target = snapshots.find((s) => s.id === snapshotId);
    if (!target) throw new Error('快照不存在');

    const { tables: rTables, guests: rGuests, groups: rGroups, landmarks: rLandmarks } = target.state_data;
    setTables(rTables);
    setGuests(rGuests);
    setGroups(rGroups);
    setLandmarks(rLandmarks);

    const client = getSupabase();
    if (client && isOnline) {
      try {
        // Clear and replace
        await Promise.all([
          client.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          client.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          client.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          client.from('landmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        ]);
        if (rTables.length) await client.from('tables').insert(rTables);
        if (rGroups.length) await client.from('groups').insert(rGroups);
        if (rGuests.length) await client.from('guests').insert(rGuests);
        if (rLandmarks.length) await client.from('landmarks').insert(rLandmarks);
      } catch (err) {
        console.warn('Failed to sync restored snapshot to Supabase:', err);
      }
    }
  };

  const deleteSnapshot = async (snapshotId: string): Promise<void> => {
    setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));

    const client = getSupabase();
    if (client && isOnline) {
      try {
        await client.from('snapshots').delete().eq('id', snapshotId);
      } catch (err) {
        console.warn('Failed to delete snapshot on Supabase:', err);
      }
    }
  };

  // Config & Reset
  const updateConfig = (url: string, key: string) => {
    const config = { supabaseUrl: url.trim(), supabaseAnonKey: key.trim() };
    saveStoredConfig(config);
    setSupabaseConfig(config);
    setIsSupabaseActive(isSupabaseConfigured());
  };

  const resetToMockData = () => {
    setTables(initialTables);
    setGuests(initialGuests);
    setGroups(initialGroups);
    setLandmarks(initialLandmarks);
    saveTablesToStorage(initialTables);
    saveGuestsToStorage(initialGuests);
    saveGroupsToStorage(initialGroups);
    saveLandmarksToStorage(initialLandmarks);
  };

  return (
    <WeddingContext.Provider
      value={{
        tables,
        guests,
        groups,
        landmarks,
        snapshots,
        stats,
        isOnline,
        isSyncing,
        isSupabaseActive,
        supabaseConfig,
        addTable,
        updateTable,
        deleteTable,
        addGuest,
        updateGuest,
        deleteGuest,
        assignGuestToTable,
        assignGuestsToTable,
        assignGroupToTable,
        checkInGuest,
        claimCake,
        recordGift,
        addGroup,
        deleteGroup,
        addLandmark,
        updateLandmark,
        deleteLandmark,
        importGuests,
        createSnapshot,
        restoreSnapshot,
        deleteSnapshot,
        updateConfig,
        resetToMockData,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = (): WeddingContextType => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};
