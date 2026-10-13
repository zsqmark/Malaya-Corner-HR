import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Tablet, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthorizeDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthorizeDeviceModal: React.FC<AuthorizeDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { authorizeCurrentDevice, terminalMetadata } = useApp();
  const [managerPin, setManagerPin] = useState('');
  const [terminalName, setTerminalName] = useState(
    terminalMetadata?.terminalName || 'Sunnybank POS Terminal #1'
  );
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPin = managerPin.trim();
    if (!cleanPin) {
      setError('Please enter your manager security PIN (4–6 digits).');
      return;
    }

    const res = authorizeCurrentDevice(cleanPin, terminalName.trim());
    if (!res.success) {
      setError(res.error || 'Authorization failed. Incorrect PIN.');
      return;
    }

    setSuccessMsg(`Device successfully authorized as "${terminalName.trim()}"!`);
    setTimeout(() => {
      setSuccessMsg('');
      setManagerPin('');
      onClose();
      if (onSuccess) onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Authorize Time Clock Terminal</h2>
              <p className="text-xs text-slate-500">Designate this hardware device for shift clocking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            Authorizing this device allows staff to use their personal security PIN to punch in and out. Personal devices without this authorization remain restricted to view-only schedule & timesheet access.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terminal Nickname / Location
            </label>
            <input
              type="text"
              value={terminalName}
              onChange={(e) => setTerminalName(e.target.value)}
              placeholder="e.g. Sunnybank POS Terminal #1"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Manager Security PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter 4–6 digit manager passcode"
                required
                className="w-full px-3.5 py-2.5 pl-10 text-sm tracking-widest font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Default manager PIN: 123456 (or your configured manager security passcode)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Authorize Terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
