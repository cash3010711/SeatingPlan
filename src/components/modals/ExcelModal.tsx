import React, { useState, useRef } from 'react';
import { useWedding } from '../../context/WeddingContext';
import {
  parseExcelBuffer,
  downloadExcelTemplate,
  exportHotelSummary,
  exportGiftBook,
  exportCakeList,
  ParsedRow,
} from '../../utils/excel';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Gift,
  Hotel,
} from 'lucide-react';

interface ExcelModalProps {
  onClose: () => void;
}

export const ExcelModal: React.FC<ExcelModalProps> = ({ onClose }) => {
  const { tables, guests, importGuests } = useWedding();

  const [activeTab, setActiveTab] = useState<'import' | 'template' | 'export'>('import');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection & parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelBuffer(buffer);

      let dupCount = 0;
      const checkedRows = rows.map((r) => {
        const isDup = guests.some((g) => g.name.trim().toLowerCase() === r.name.trim().toLowerCase());
        if (isDup) dupCount++;
        return {
          ...r,
          isDuplicate: isDup,
          duplicateAction: isDup ? ('add' as const) : ('add' as const),
        };
      });

      setParsedRows(checkedRows);
      setDuplicateCount(dupCount);
    } catch (err) {
      console.error('Failed to parse excel file', err);
      alert('無法解析此檔案，請確認為標準 .xlsx 或 .csv 檔案格式');
    }
  };

  // Change duplicate action
  const handleActionChange = (index: number, action: 'add' | 'skip' | 'merge') => {
    setParsedRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, duplicateAction: action } : row))
    );
  };

  // Execute import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const result = await importGuests(parsedRows);
      setToastMessage(
        `匯入完成！成功新增 ${result.added} 位，略過 ${result.skipped} 位，合併更新 ${result.merged} 位。`
      );
      setParsedRows([]);
      setDuplicateCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Import failed', err);
      alert('匯入資料時發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-rose-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Excel 智慧匯入與報表匯出</h3>
              <p className="text-[11px] text-slate-400">Append 增量防呆、別名映射與會館交接總表</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            匯入名冊與防呆比對
            {parsedRows.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {parsedRows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            下載空白範本檔
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            匯出交接報表套件
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-medium animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-emerald-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  點擊或拖曳 Excel 檔案至此上傳
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  支援 .xlsx 與 .csv 格式。系統具備智慧模糊欄位映射（姓名、葷素、男方女方、兒童椅、喜餅等）
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                  ✅ 增量新增模式 (Append-only)：絕不覆蓋、不刪除現有已排座位！
                </p>
              </div>

              {/* Preview & Deduplication Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        預覽即將匯入名單 ({parsedRows.length} 筆)
                      </span>
                      {duplicateCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          偵測到 {duplicateCount} 筆同名重複
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto text-xs bg-white">
                    <table className="w-full text-left divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2">姓名</th>
                          <th className="px-2 py-2">所屬方</th>
                          <th className="px-2 py-2">飲食</th>
                          <th className="px-2 py-2">兒童椅</th>
                          <th className="px-2 py-2">喜餅</th>
                          <th className="px-2 py-2">人數</th>
                          <th className="px-3 py-2">重複防呆處理策略</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={
                              row.isDuplicate
                                ? 'bg-amber-50/80 hover:bg-amber-100/70'
                                : 'hover:bg-slate-50'
                            }
                          >
                            <td className="px-3 py-2 font-bold text-slate-800 flex items-center gap-1">
                              <span>{row.name}</span>
                              {row.isDuplicate && (
                                <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded font-bold">
                                  同名
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-slate-600">
                              {row.side === 'groom'
                                ? '男方'
                                : row.side === 'bride'
                                ? '女方'
                                : '共同'}
                            </td>
                            <td className="px-2 py-2 text-slate-600">
                              {row.meal_type === 'vegan'
                                ? '全素'
                                : row.meal_type === 'vegetarian'
                                ? '蛋奶素'
                                : row.meal_type === 'kid'
                                ? '兒童餐'
                                : '葷食'}
                            </td>
                            <td className="px-2 py-2 text-slate-600">
                              {row.needs_baby_chair ? '是' : '否'}
                            </td>
                            <td className="px-2 py-2 text-slate-600">
                              {row.cake_count > 0 ? `${row.cake_count} 盒` : '無'}
                            </td>
                            <td className="px-2 py-2 text-slate-600">
                              {row.total_count > 1 ? `${row.total_count} 人(含眷屬)` : '1 人'}
                            </td>
                            <td className="px-3 py-2">
                              {row.isDuplicate ? (
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`dup-action-${idx}`}
                                      checked={row.duplicateAction === 'add'}
                                      onChange={() => handleActionChange(idx, 'add')}
                                    />
                                    同名新增
                                  </label>
                                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`dup-action-${idx}`}
                                      checked={row.duplicateAction === 'skip'}
                                      onChange={() => handleActionChange(idx, 'skip')}
                                    />
                                    略過此筆
                                  </label>
                                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`dup-action-${idx}`}
                                      checked={row.duplicateAction === 'merge'}
                                      onChange={() => handleActionChange(idx, 'merge')}
                                    />
                                    合併更新
                                  </label>
                                </div>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> 全新賓客
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleExecuteImport}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isProcessing ? '處理中...' : '確認執行增量匯入'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEMPLATE */}
          {activeTab === 'template' && (
            <div className="space-y-4 py-4 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">標準 Excel 賓客匯入範本</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  提供預先填寫完整欄位抬頭（姓名、男方/女方、飲食習慣、兒童椅需求、喜餅盒數、同行總人數、關係標籤、備註）的標準檔案。下載後填寫完畢即可於「匯入名冊」分頁直接上傳！
                </p>
                <div className="pt-2">
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下載空白範本檔案 (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT */}
          {activeTab === 'export' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
              {/* Hotel handover summary */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">飯店會館交接專用總表</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    匯出各桌桌號、桌名、容納數、實排數、葷/素/蛋奶/兒童餐配額、需兒童椅張數與特殊飲食備註。
                  </p>
                </div>
                <button
                  onClick={() => exportHotelSummary(tables, guests)}
                  className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出總表 (.xlsx)
                </button>
              </div>

              {/* Guest list & gift cash book */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">完整名冊與禮金簿</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    匯出完整名單（序號、桌號、桌名、姓名、所屬、餐飲、紅包編號、禮金金額、報到狀態）。
                  </p>
                </div>
                <button
                  onClick={() => exportGiftBook(tables, guests)}
                  className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出禮金簿 (.xlsx)
                </button>
              </div>

              {/* Bride cake distribution list */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">喜餅發放清冊</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    匯出女方/需領餅賓客名錄、應發盒數、是否已領取與備註，方便收禮接待人員點交核銷。
                  </p>
                </div>
                <button
                  onClick={() => exportCakeList(guests)}
                  className="mt-4 w-full py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出喜餅冊 (.xlsx)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
