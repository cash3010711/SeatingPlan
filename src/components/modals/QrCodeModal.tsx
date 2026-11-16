import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon, Sparkles } from 'lucide-react';

interface QrCodeModalProps {
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lookupUrl = `${window.location.origin}/lookup`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        lookupUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#9F1239', // Wedding Burgundy
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR code', error);
        }
      );
    }
  }, [lookupUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(lookupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `婚禮迎賓自查桌號_QRCode_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-rose-100 text-center">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-amber-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <QrIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">迎賓自查立牌 QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              <Sparkles className="w-3 h-3 text-amber-500" />
              賓客現場免登入掃碼速查
            </span>
            <p className="text-xs text-slate-500">
              可印製於婚宴會館正門、收禮桌立牌。賓客輸入姓名即可得知桌號與葷素。
            </p>
          </div>

          {/* QR Code Canvas */}
          <div className="p-4 bg-gradient-to-b from-rose-50/50 to-amber-50/30 rounded-2xl border border-rose-100 inline-block shadow-inner">
            <canvas ref={canvasRef} className="rounded-xl shadow-xs" />
          </div>

          {/* URL text */}
          <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="truncate text-slate-600 font-mono text-[11px] flex-1 text-left px-1">
              {lookupUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 shrink-0 font-semibold"
              title="複製網址"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{copied ? '已複製' : '複製'}</span>
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadQr}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            下載迎賓立牌 QR Code 圖檔 (PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
