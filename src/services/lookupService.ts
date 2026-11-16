import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { loadGuestsFromStorage, loadTablesFromStorage } from '../utils/storage';
import { MealType } from '../types';

export interface SanitizedLookupResult {
  name: string;
  tableNo: string;
  tableName: string;
  mealType: string;
  needsBabyChair: boolean;
  cakeCount: number;
}

function formatMealType(meal: MealType): string {
  switch (meal) {
    case 'vegan':
      return '全素';
    case 'vegetarian':
      return '蛋奶素';
    case 'kid':
      return '兒童餐';
    case 'special':
      return '特殊需求';
    case 'meat':
    default:
      return '葷食';
  }
}

/**
 * Strictly sanitized lookup query service.
 * Never requests or returns sensitive fields: gift_amount, gift_receipt_no, notes, etc.
 */
export async function lookupGuestPublic(nameQuery: string): Promise<SanitizedLookupResult[]> {
  const query = nameQuery.trim().toLowerCase();
  if (!query) return [];

  const client = getSupabase();

  if (isSupabaseConfigured() && client) {
    try {
      // 1. Fetch tables public info (id, table_no, name) with timeout
      const tablesPromise = client.from('tables').select('id, table_no, name');
      const guestsPromise = client
        .from('guests')
        .select('id, name, table_id, meal_type, needs_baby_chair, cake_count')
        .ilike('name', `%${query}%`);

      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timeout')), 3000)
      );

      const [tablesResult, guestsResult] = await Promise.race([
        Promise.all([tablesPromise, guestsPromise]),
        timeoutPromise.then(() => {
          throw new Error('Supabase query timeout');
        }),
      ]);

      const { data: tablesData } = tablesResult;
      const { data: guestsData, error } = guestsResult;
      const tableMap = new Map((tablesData || []).map((t: any) => [t.id, t]));

      if (!error && guestsData && guestsData.length > 0) {
        return guestsData.map((g: any) => {
          const table = g.table_id ? tableMap.get(g.table_id) : null;
          return {
            name: g.name,
            tableNo: table ? table.table_no : '尚未安排',
            tableName: table?.name || '',
            mealType: formatMealType(g.meal_type as MealType),
            needsBabyChair: Boolean(g.needs_baby_chair),
            cakeCount: Number(g.cake_count) || 0,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase lookup failed or timed out, falling back to local sanitized cache:', err);
    }
  }

  // Local Storage fallback:
  // Immediately sanitize upon retrieval before any component receives data
  const rawTables = loadTablesFromStorage();
  const tableMap = new Map(rawTables.map((t) => [t.id, t]));

  const rawGuests = loadGuestsFromStorage();
  const matching = rawGuests.filter((g) => g.name.trim().toLowerCase().includes(query));

  return matching.map((g) => {
    const table = g.table_id ? tableMap.get(g.table_id) : null;
    return {
      name: g.name,
      tableNo: table ? table.table_no : '尚未安排',
      tableName: table?.name || '',
      mealType: formatMealType(g.meal_type),
      needsBabyChair: Boolean(g.needs_baby_chair),
      cakeCount: Number(g.cake_count) || 0,
    };
  });
}
