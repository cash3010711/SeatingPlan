import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { StatsBanner } from '../components/layout/StatsBanner';
import { WeddingCanvas } from '../components/canvas/WeddingCanvas';
import { BoardView } from '../components/board/BoardView';
import { UnassignedPoolDrawer } from '../components/guests/UnassignedPoolDrawer';
import { ExcelModal } from '../components/modals/ExcelModal';
import { SnapshotModal } from '../components/modals/SnapshotModal';
import { QrCodeModal } from '../components/modals/QrCodeModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { useWedding } from '../context/WeddingContext';

export const MainPage: React.FC = () => {
  const { assignGuestToTable } = useWedding();

  const [viewMode, setViewMode] = useState<'canvas' | 'board'>('canvas');
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Modals state
  const [showExcel, setShowExcel] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleDropGuestToTable = async (tableId: string, guestId: string) => {
    await assignGuestToTable(guestId, tableId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
      {/* Navigation Header */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenExcel={() => setShowExcel(true)}
        onOpenSnapshot={() => setShowSnapshot(true)}
        onOpenQr={() => setShowQr(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* KPI Stats Ribbon */}
      <StatsBanner />

      {/* Main View Area */}
      <main className="flex-1 flex relative overflow-hidden h-[calc(100vh-6.5rem)]">
        {viewMode === 'canvas' ? (
          <WeddingCanvas onDropGuestToTable={handleDropGuestToTable} />
        ) : (
          <BoardView />
        )}

        {/* Unassigned Pool Drawer on the right (for canvas & board views) */}
        <UnassignedPoolDrawer
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen(!drawerOpen)}
        />
      </main>

      {/* Modals */}
      {showExcel && <ExcelModal onClose={() => setShowExcel(false)} />}
      {showSnapshot && <SnapshotModal onClose={() => setShowSnapshot(false)} />}
      {showQr && <QrCodeModal onClose={() => setShowQr(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
