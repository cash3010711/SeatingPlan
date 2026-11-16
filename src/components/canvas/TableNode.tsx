import React, { useState, useRef, useEffect } from 'react';
import { Table, Guest } from '../../types';
import { AlertTriangle, Baby, Gift, Leaf } from 'lucide-react';

interface TableNodeProps {
  table: Table;
  guests: Guest[];
  zoom: number;
  snapToGrid: boolean;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onClick: (table: Table) => void;
  onDropGuest: (tableId: string, guestId: string) => void;
}

export const TableNode: React.FC<TableNodeProps> = ({
  table,
  guests,
  zoom,
  snapToGrid,
  onUpdatePosition,
  onClick,
  onDropGuest,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentPos, setCurrentPos] = useState({ x: table.x, y: table.y });
  const posRef = useRef({ x: table.x, y: table.y });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    posRef.current = { x: table.x, y: table.y };
    setCurrentPos({ x: table.x, y: table.y });
  }, [table.x, table.y]);

  const tableGuests = guests.filter((g) => g.table_id === table.id);
  const seatedCount = tableGuests.length;
  const isOverCapacity = seatedCount > table.capacity;
  const isFull = seatedCount === table.capacity;
  const isMainTable = table.table_no.includes('主') || table.name.includes('主');

  // Stats in table
  const vegCount = tableGuests.filter((g) => g.meal_type === 'vegan' || g.meal_type === 'vegetarian').length;
  const babyChairCount = tableGuests.filter((g) => g.needs_baby_chair).length;
  const cakeCount = tableGuests.reduce((sum, g) => sum + g.cake_count, 0);

  // Dragging logic with high-performance direct transform
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    e.stopPropagation();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragOffsetRef.current = {
      x: e.clientX / zoom - posRef.current.x,
      y: e.clientY / zoom - posRef.current.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      hasMovedRef.current = true;
      let newX = e.clientX / zoom - dragOffsetRef.current.x;
      let newY = e.clientY / zoom - dragOffsetRef.current.y;

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      posRef.current = { x: newX, y: newY };
      if (nodeRef.current) {
        nodeRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const finalX = Math.round(posRef.current.x);
      const finalY = Math.round(posRef.current.y);
      setCurrentPos({ x: finalX, y: finalY });
      if (hasMovedRef.current) {
        onUpdatePosition(table.id, finalX, finalY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, snapToGrid, table.id, onUpdatePosition]);

  // Drag and drop for guests
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const guestId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('guestId');
    if (guestId) {
      onDropGuest(table.id, guestId);
    }
  };

  // Dimensions
  const isCircle = table.shape === 'circle';
  const size = isMainTable ? 130 : 115;
  const rectWidth = isMainTable ? 150 : 130;
  const rectHeight = isMainTable ? 100 : 85;

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        width: isCircle ? `${size}px` : `${rectWidth}px`,
        height: isCircle ? `${size}px` : `${rectHeight}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`absolute top-0 left-0 select-none transition-shadow ${
        isCircle ? 'rounded-full' : 'rounded-2xl'
      } ${
        isOverCapacity
          ? 'border-2 border-rose-500 bg-rose-50/90 shadow-lg shadow-rose-200/50 animate-excess'
          : table.is_backup
          ? 'border-2 border-dashed border-slate-400 bg-slate-50/95 shadow-sm'
          : isMainTable
          ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50 shadow-md shadow-amber-100'
          : 'border-2 border-rose-200 bg-white/95 shadow-sm hover:shadow-md'
      } ${isDragOver ? 'ring-4 ring-rose-400 ring-offset-2 scale-105' : ''} flex flex-col items-center justify-center p-2 text-center z-10`}
      onMouseDown={handleMouseDown}
      onClick={() => {
        if (!hasMovedRef.current) onClick(table);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Table No / Name Header */}
      <div className="flex items-center gap-1 leading-none">
        <span
          className={`font-black tracking-tight ${
            isMainTable ? 'text-amber-800 text-base' : 'text-slate-800 text-sm'
          }`}
        >
          {table.table_no.length <= 3 ? `第 ${table.table_no} 桌` : table.table_no}
        </span>
        {table.is_backup && (
          <span className="bg-slate-200 text-slate-700 text-[9px] px-1 py-0.5 rounded font-bold">
            備桌
          </span>
        )}
      </div>

      {/* Table custom name */}
      <div className="text-[10px] text-slate-500 truncate max-w-[90px] font-medium my-0.5" title={table.name}>
        {table.name || (table.is_backup ? '預備桌' : '—')}
      </div>

      {/* Seated / Capacity count badge */}
      <div
        className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
          isOverCapacity
            ? 'bg-rose-600 text-white shadow-sm'
            : isFull
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-700'
        }`}
      >
        <span>
          {seatedCount}/{table.capacity}
        </span>
        {isOverCapacity && <AlertTriangle className="w-3 h-3 text-amber-200 animate-bounce" />}
      </div>

      {/* Micro badges: Veg / Baby / Cake */}
      <div className="flex items-center gap-1 mt-1 text-[10px]">
        {vegCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-100/80 px-1 py-0.2 rounded"
            title={`素食: ${vegCount} 位`}
          >
            <Leaf className="w-2.5 h-2.5" />
            {vegCount}
          </span>
        )}
        {babyChairCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-blue-700 font-bold bg-blue-100/80 px-1 py-0.2 rounded"
            title={`兒童椅: ${babyChairCount} 張`}
          >
            <Baby className="w-2.5 h-2.5" />
            {babyChairCount}
          </span>
        )}
        {cakeCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-pink-700 font-bold bg-pink-100/80 px-1 py-0.2 rounded"
            title={`喜餅: ${cakeCount} 盒`}
          >
            <Gift className="w-2.5 h-2.5" />
            {cakeCount}
          </span>
        )}
      </div>
    </div>
  );
};
