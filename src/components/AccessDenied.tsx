import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Lock, ArrowLeft, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AccessDeniedProps {
  attemptedPage: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedPage }) => {
  const { activeStaff, setCurrentPage, authenticateManager } = useApp();
  const [managerPin, setManagerPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlockManager = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const clean = managerPin.trim();
    if (!clean) {
      setErrorMsg('Please enter manager PIN (e.g. 123456 or 1234).');
      return;
    }

    const success = authenticateManager(clean);
    if (success) {
      setCurrentPage(attemptedPage);
    } else {
      setErrorMsg('Incorrect manager PIN. Please enter valid passcode (123456 or 1234).');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            Role-Based Access Control (RBAC)
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manager Access Required
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            The <strong className="text-slate-900">{attemptedPage}</strong> module contains confidential venue management, administrative scheduling, and payroll controls restricted to restaurant managers.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Session Identity:</div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                {activeStaff.firstName.charAt(0)}
              </span>
              <div>
                <span className="font-bold text-slate-900">{activeStaff.firstName} {activeStaff.lastName}</span>
                <span className="text-slate-500"> • {activeStaff.position}</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              Employee Role
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            Employees have access to their personal schedules, availability, time clock, assigned tasks, and onboarding dossier.
          </p>
        </div>

        {/* Manager PIN Unlock Form */}
        <form onSubmit={handleUnlockManager} className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enter Manager Passcode to Unlock</span>
            </label>
            <span className="text-[10px] text-indigo-700">Mark Zhang PIN: 123456 or 1234</span>
          </div>

          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={managerPin}
              onChange={(e) => {
                setManagerPin(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="Enter Manager Passcode (123456 or 1234)..."
              autoComplete="off"
              className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold tracking-widest border border-indigo-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={managerPin.length < 4}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs shadow-indigo-200 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              Unlock as Mark Zhang (Manager)
            </button>
          </div>
        </form>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setCurrentPage('My Schedule')}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to My Personal Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
