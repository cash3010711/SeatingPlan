/**
 * 格式化桌號與桌名顯示
 * - 若桌號或桌名本身已包含「桌」（例如「主桌」、「副主桌」、「第 1 桌」、「預備桌」、「VIP桌」），直接顯示，不重複疊加「第」或「桌」。
 * - 若為純數字（例如 "1", "2", "10"），顯示為「第 X 桌」。
 * - 若為單一英文字母（例如 "A", "B"），顯示為「第 X 桌」。
 * - 其他情況則維持原樣輸出。
 */
export function formatTableNo(tableNo: string | undefined | null): string {
  if (!tableNo) return '';
  const trimmed = tableNo.trim();
  if (!trimmed) return '';

  // 若已經包含「桌」字，直接回傳，避免產生「第 主桌 桌」或「第 第 1 桌 桌」
  if (trimmed.includes('桌')) {
    return trimmed;
  }

  // 純數字格式化為「第 X 桌」
  if (/^\d+$/.test(trimmed)) {
    return `第 ${trimmed} 桌`;
  }

  // 單一英文字母格式化為「第 X 桌」
  if (/^[A-Za-z]$/.test(trimmed)) {
    return `第 ${trimmed} 桌`;
  }

  return trimmed;
}

/**
 * 組合桌號與桌名顯示，避免出現重複如「第 1 桌 (第 1 桌)」
 */
export function formatTableLabel(tableNo: string | undefined | null, tableName?: string | null): string {
  const formattedNo = formatTableNo(tableNo);
  const cleanName = tableName?.trim() || '';

  if (!cleanName || cleanName === formattedNo || cleanName === tableNo?.trim()) {
    return formattedNo;
  }

  return formattedNo ? `${formattedNo} (${cleanName})` : cleanName;
}
