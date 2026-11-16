export type SideType = 'groom' | 'bride' | 'mutual' | 'staff';
export type MealType = 'meat' | 'vegan' | 'vegetarian' | 'kid' | 'special';
export type CakeStatus = 'none' | 'unclaimed' | 'claimed';
export type TableShape = 'circle' | 'rect';
export type LandmarkType = 'stage' | 'aisle' | 'reception' | 'pillar' | 'audio' | 'door';

export interface Table {
  id: string;
  table_no: string;
  name: string;
  capacity: number;
  shape: TableShape;
  is_backup: boolean;
  x: number;
  y: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  total_count: number;
  contact_person?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Guest {
  id: string;
  table_id: string | null;
  group_id: string | null;
  name: string;
  side: SideType;
  meal_type: MealType;
  needs_baby_chair: boolean;
  cake_status: CakeStatus;
  cake_count: number;
  is_checked_in: boolean;
  gift_amount: number | null;
  gift_receipt_no: string | null;
  category_tag: string;
  notes: string;
  is_placeholder: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Landmark {
  id: string;
  name: string;
  type: LandmarkType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  created_at?: string;
}

export interface Snapshot {
  id: string;
  name: string;
  state_data: {
    tables: Table[];
    guests: Guest[];
    groups: Group[];
    landmarks: Landmark[];
  };
  created_at: string;
}

export interface OfflineSyncAction {
  id: string;
  action: 'UPDATE_GUEST' | 'CHECK_IN' | 'CLAIM_CAKE' | 'RECORD_GIFT' | 'UPSERT_TABLE' | 'DELETE_TABLE' | 'UPSERT_GUEST' | 'DELETE_GUEST' | 'UPSERT_GROUP' | 'DELETE_GROUP' | 'UPSERT_LANDMARK' | 'DELETE_LANDMARK';
  guestId?: string;
  payload: any;
  timestamp: number;
}

export interface StatsSummary {
  totalGuests: number;
  assignedGuests: number;
  unassignedGuests: number;
  meatCount: number;
  veganCount: number;
  vegetarianCount: number;
  kidMealCount: number;
  specialMealCount: number;
  babyChairCount: number;
  cakeTotalCount: number;
  cakeClaimedCount: number;
  checkedInCount: number;
  totalGiftAmount: number;
  totalTables: number;
  backupTables: number;
}
