import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CanvasErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 p-6 bg-red-50 text-red-800 overflow-auto border border-red-200 m-4 rounded-xl">
          <h2 className="text-lg font-bold mb-2">2D 畫布渲染錯誤 (Canvas Render Error)</h2>
          <p className="font-mono text-sm bg-white p-3 rounded border border-red-300 mb-3">
            {this.state.error?.toString()}
          </p>
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            重試渲染
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
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
      <main className="flex-1 min-h-0 flex relative overflow-hidden">
        {viewMode === 'canvas' ? (
          <CanvasErrorBoundary>
            <WeddingCanvas onDropGuestToTable={handleDropGuestToTable} />
          </CanvasErrorBoundary>
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
