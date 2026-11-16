import { Table, Guest, Group, Landmark, Snapshot, OfflineSyncAction } from '../types';
import { initialTables, initialGuests, initialGroups, initialLandmarks } from '../mock/initialData';

const STORAGE_KEYS = {
  TABLES: 'wedding_tables_v1',
  GUESTS: 'wedding_guests_v1',
  GROUPS: 'wedding_groups_v1',
  LANDMARKS: 'wedding_landmarks_v1',
  SNAPSHOTS: 'wedding_snapshots_v1',
  OFFLINE_QUEUE: 'wedding_offline_queue_v1',
  CONFIG: 'wedding_supabase_config_v1',
};

export interface StoredConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function loadStoredConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored config', e);
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveStoredConfig(config: StoredConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function loadTablesFromStorage(): Table[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tables from storage', e);
  }
  saveTablesToStorage(initialTables);
  return initialTables;
}

export function saveTablesToStorage(tables: Table[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  } catch (e) {
    console.error('Failed to save tables', e);
  }
}

export function loadGuestsFromStorage(): Guest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GUESTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load guests from storage', e);
  }
  saveGuestsToStorage(initialGuests);
  return initialGuests;
}

export function saveGuestsToStorage(guests: Guest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  } catch (e) {
    console.error('Failed to save guests', e);
  }
}

export function loadGroupsFromStorage(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load groups from storage', e);
  }
  saveGroupsToStorage(initialGroups);
  return initialGroups;
}

export function saveGroupsToStorage(groups: Group[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.error('Failed to save groups', e);
  }
}

export function loadLandmarksFromStorage(): Landmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANDMARKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load landmarks from storage', e);
  }
  saveLandmarksToStorage(initialLandmarks);
  return initialLandmarks;
}

export function saveLandmarksToStorage(landmarks: Landmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(landmarks));
  } catch (e) {
    console.error('Failed to save landmarks', e);
  }
}

export function loadSnapshotsFromStorage(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load snapshots', e);
  }
  return [];
}

export function saveSnapshotsToStorage(snapshots: Snapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
  } catch (e) {
    console.error('Failed to save snapshots', e);
  }
}

export function loadOfflineQueue(): OfflineSyncAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load offline queue', e);
  }
  return [];
}

export function saveOfflineQueue(queue: OfflineSyncAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export function enqueueOfflineAction(action: Omit<OfflineSyncAction, 'id' | 'timestamp'>): void {
  const queue = loadOfflineQueue();
  queue.push({
    ...action,
    id: 'sync-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    timestamp: Date.now(),
  });
  saveOfflineQueue(queue);
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([]);
}
