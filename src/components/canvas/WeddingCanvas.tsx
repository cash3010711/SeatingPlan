import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { TableNode } from './TableNode';
import { LandmarkNode } from './LandmarkNode';
import { TableDetailModal } from './TableDetailModal';
import { Table, LandmarkType } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid,
  Plus,
  Camera,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface WeddingCanvasProps {
  onDropGuestToTable: (tableId: string, guestId: string) => void;
}

export const WeddingCanvas: React.FC<WeddingCanvasProps> = ({ onDropGuestToTable }) => {
  const {
    tables,
    guests,
    landmarks,
    updateTable,
    deleteTable,
    addTable,
    updateLandmark,
    deleteLandmark,
    addLandmark,
  } = useWedding();

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [landmarkDropdown, setLandmarkDropdown] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const landmarkDropdownRef = useRef<HTMLDivElement>(null);

  // Close landmark dropdown when clicking outside
  useEffect(() => {
    if (!landmarkDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (landmarkDropdownRef.current && !landmarkDropdownRef.current.contains(e.target as Node)) {
        setLandmarkDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [landmarkDropdown]);


  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow left click (button 0) or middle click (button 1)
    if (e.button !== 0 && e.button !== 1) return;

    // Don't pan if clicking inside floating controls, canvas nodes, inputs, or buttons
    const target = e.target as HTMLElement;
    if (
      target.closest('.canvas-floating-controls') ||
      target.closest('.canvas-node') ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }

    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, startPan]);

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const contentX = (mouseX - pan.x) / zoom;
    const contentY = (mouseY - pan.y) / zoom;

    const zoomFactor = -e.deltaY * 0.0015;
    const nextZoom = Math.min(Math.max(zoom + zoomFactor, 0.4), 2.5);
    const roundedZoom = Number(nextZoom.toFixed(2));

    const nextPanX = mouseX - contentX * roundedZoom;
    const nextPanY = mouseY - contentY * roundedZoom;

    setZoom(roundedZoom);
    setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
  };

  const zoomAtCenter = (factor: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const contentX = (centerX - pan.x) / zoom;
    const contentY = (centerY - pan.y) / zoom;

    const nextZoom = Math.min(Math.max(zoom + factor, 0.4), 2.5);
    const roundedZoom = Number(nextZoom.toFixed(2));

    const nextPanX = centerX - contentX * roundedZoom;
    const nextPanY = centerY - contentY * roundedZoom;

    setZoom(roundedZoom);
    setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
  };

  const handleZoomIn = () => zoomAtCenter(0.15);
  const handleZoomOut = () => zoomAtCenter(-0.15);
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  // Add Table
  const handleAddTable = async () => {
    const tableIndex = tables.length + 1;
    await addTable({
      table_no: String(tableIndex),
      name: '',
      capacity: 10,
      x: Math.round(-pan.x / zoom + 350 + (tableIndex % 4) * 140),
      y: Math.round(-pan.y / zoom + 300 + Math.floor(tableIndex / 4) * 140),
      is_backup: false,
    });
  };

  // Add Landmark
  const handleAddLandmark = async (type: LandmarkType, name: string) => {
    let w = 180;
    let h = 60;
    if (type === 'stage') {
      w = 320;
      h = 70;
    } else if (type === 'aisle') {
      w = 120;
      h = 450;
    } else if (type === 'pillar') {
      w = 60;
      h = 60;
    }

    await addLandmark({
      name,
      type,
      width: w,
      height: h,
      x: Math.round(-pan.x / zoom + 300),
      y: Math.round(-pan.y / zoom + 200),
      rotation: 0,
    });
    setLandmarkDropdown(false);
  };

  // Export PNG
  const handleExportPng = useCallback(async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#f8fafc',
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `婚禮會場平面圖_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('匯出圖片時發生問題，請確認瀏覽器支援度');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      ref={canvasRef}
      className={`relative flex-1 self-stretch min-h-0 overflow-hidden select-none bg-slate-100 dot-grid canvas-bg ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* Zoom & Pan Container */}
      <div
        ref={contentRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '2600px',
          height: '2200px',
        }}
        className={`absolute top-0 left-0 pointer-events-auto ${
          isPanning ? '' : 'transition-transform duration-75'
        }`}
      >
        {/* Landmarks */}
        {landmarks.map((landmark) => (
          <LandmarkNode
            key={landmark.id}
            landmark={landmark}
            zoom={zoom}
            snapToGrid={snapToGrid}
            onUpdatePosition={(id, x, y) => updateLandmark(id, { x, y })}
            onUpdateLandmark={updateLandmark}
            onDeleteLandmark={deleteLandmark}
          />
        ))}

        {/* Tables */}
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            guests={guests}
            zoom={zoom}
            snapToGrid={snapToGrid}
            onUpdatePosition={(id, x, y) => updateTable(id, { x, y })}
            onClick={(t) => setSelectedTable(t)}
            onDropGuest={onDropGuestToTable}
            onDeleteTable={deleteTable}
          />
        ))}
      </div>

      {/* Canvas Floating Controls */}
      <div className="canvas-floating-controls absolute bottom-5 left-5 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200/90 text-xs">
        {/* Zoom In/Out */}
        <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-700 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            title="放大視角 (滾輪亦可)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-semibold text-slate-600 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-700 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            title="縮小視角"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 text-slate-700 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            title="重置視角 (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Snap to grid */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors ${
            snapToGrid
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="切換磁吸網格對齊 (20px)"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">磁吸對齊</span>
        </button>

        {/* Add Table */}
        <button
          onClick={handleAddTable}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-200 transition-colors"
          title="新增一張圓桌 (預設 10 人)"
        >
          <Plus className="w-4 h-4" />
          <span>新增桌子</span>
        </button>

        {/* Add Landmark Dropdown */}
        <div ref={landmarkDropdownRef} className="relative">
          <button
            onClick={() => setLandmarkDropdown(!landmarkDropdown)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors"
          >
            <span>+ 新增地標</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {landmarkDropdown && (
            <div className="absolute bottom-12 left-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-fadeIn">
              <button
                onClick={() => handleAddLandmark('stage', '主舞台 / 大螢幕')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>主舞台 (Stage)</span>
                <span className="text-[10px] text-slate-400">長方</span>
              </button>
              <button
                onClick={() => handleAddLandmark('aisle', '進場紅毯走道')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>紅毯走道 (Aisle)</span>
                <span className="text-[10px] text-slate-400">走道</span>
              </button>
              <button
                onClick={() => handleAddLandmark('door', '宴會廳正門')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>大門出入口 (Door)</span>
                <span className="text-[10px] text-slate-400">拱門</span>
              </button>
              <button
                onClick={() => handleAddLandmark('pillar', '場地樑柱')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>樑柱遮蔽 (Pillar)</span>
                <span className="text-[10px] text-slate-400">圓柱</span>
              </button>
              <button
                onClick={() => handleAddLandmark('reception', '收禮接待桌')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>收禮桌 (Reception)</span>
                <span className="text-[10px] text-slate-400">長桌</span>
              </button>
              <button
                onClick={() => handleAddLandmark('audio', '音控與燈光台')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>音控燈光台 (Audio)</span>
                <span className="text-[10px] text-slate-400">控制台</span>
              </button>
            </div>
          )}
        </div>

        {/* Export PNG */}
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
          title="匯出畫布為高畫質 PNG 圖片"
        >
          <Camera className="w-4 h-4 text-rose-500" />
          <span className="hidden md:inline">{isExporting ? '匯出中...' : '平面圖 PNG'}</span>
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          title="直接列印會場圖 (A4 最佳化)"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span className="hidden md:inline">列印</span>
        </button>
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
};
