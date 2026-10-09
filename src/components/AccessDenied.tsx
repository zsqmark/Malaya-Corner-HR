import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AccessDeniedProps {
  attemptedPage: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedPage }) => {
  const { activeStaff, setCurrentPage, authenticateManager } = useApp();

  const handleUnlockManager = () => {
    authenticateManager();
    setCurrentPage(attemptedPage);
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentPage('My Schedule')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to My Personal Schedule
          </button>

          <button
            onClick={handleUnlockManager}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            Switch to Manager Console
          </button>
        </div>
      </div>
    </div>
  );
};
