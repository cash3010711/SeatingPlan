import React, { useState, useRef, useEffect } from 'react';
import { Landmark } from '../../types';
import { RotateCw, Trash2, Mic, DoorOpen, Disc, ShieldAlert, Heart } from 'lucide-react';

interface LandmarkNodeProps {
  landmark: Landmark;
  zoom: number;
  snapToGrid: boolean;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateLandmark: (id: string, updates: Partial<Landmark>) => void;
  onDeleteLandmark: (id: string) => void;
}

export const LandmarkNode: React.FC<LandmarkNodeProps> = ({
  landmark,
  zoom,
  snapToGrid,
  onUpdatePosition,
  onUpdateLandmark,
  onDeleteLandmark,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState({ x: landmark.x, y: landmark.y });
  const posRef = useRef({ x: landmark.x, y: landmark.y });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const hasMovedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    posRef.current = { x: landmark.x, y: landmark.y };
    setCurrentPos({ x: landmark.x, y: landmark.y });
  }, [landmark.x, landmark.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
        nodeRef.current.style.transform = `translate(${newX}px, ${newY}px) rotate(${landmark.rotation}deg)`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const finalX = Math.round(posRef.current.x);
      const finalY = Math.round(posRef.current.y);
      setCurrentPos({ x: finalX, y: finalY });
      if (hasMovedRef.current) {
        onUpdatePosition(landmark.id, finalX, finalY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, snapToGrid, landmark.id, landmark.rotation, onUpdatePosition]);

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRot = (landmark.rotation + 90) % 360;
    onUpdateLandmark(landmark.id, { rotation: nextRot });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`確定要刪除地標「${landmark.name}」嗎？`)) {
      onDeleteLandmark(landmark.id);
    }
  };

  // Rendering style by type
  let typeStyles = '';
  let IconComponent = Heart;

  switch (landmark.type) {
    case 'stage':
      typeStyles = 'bg-gradient-to-r from-rose-800 via-rose-700 to-rose-800 text-amber-200 border-2 border-amber-400/80 shadow-md';
      IconComponent = Mic;
      break;
    case 'aisle':
      typeStyles = 'bg-rose-500/20 border-2 border-dashed border-rose-400 text-rose-700 backdrop-blur-xs';
      IconComponent = Heart;
      break;
    case 'door':
      typeStyles = 'bg-indigo-50 border-2 border-indigo-300 text-indigo-700';
      IconComponent = DoorOpen;
      break;
    case 'pillar':
      typeStyles = 'bg-slate-700 border-2 border-slate-900 text-slate-200 rounded-full shadow-inner';
      IconComponent = ShieldAlert;
      break;
    case 'reception':
      typeStyles = 'bg-amber-100 border-2 border-amber-400 text-amber-900';
      IconComponent = Disc;
      break;
    case 'audio':
      typeStyles = 'bg-slate-800 border-2 border-slate-600 text-slate-100';
      IconComponent = Disc;
      break;
  }

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${currentPos.x}px, ${currentPos.y}px) rotate(${landmark.rotation}deg)`,
        width: `${landmark.width}px`,
        height: `${landmark.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`absolute top-0 left-0 select-none transition-shadow rounded-xl flex items-center justify-center p-2 text-center text-xs font-bold canvas-node ${typeStyles}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1.5 pointer-events-none truncate px-1">
        <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate">{landmark.name}</span>
      </div>

      {/* Floating Toolbar when hovered */}
      {isHovered && !isDragging && (
        <div
          className="absolute -top-7 right-0 flex items-center gap-1 bg-white/95 text-slate-700 px-1.5 py-0.5 rounded-lg shadow-md border border-slate-200 z-20"
          style={{ transform: `rotate(${-landmark.rotation}deg)` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRotate}
            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded"
            title="順時針旋轉 90 度"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
            title="刪除此地標"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
