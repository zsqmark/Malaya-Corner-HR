import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AccessDenied } from './components/AccessDenied';
import { Shield, User, Lock, KeyRound, LogOut, AlertCircle } from 'lucide-react';

// Staff Pages
import { StaffHome } from './pages/staff/StaffHome';
import { StaffSchedule } from './pages/staff/StaffSchedule';
import { StaffAvailability } from './pages/staff/StaffAvailability';
import { StaffClock } from './pages/staff/StaffClock';
import { StaffTasks } from './pages/staff/StaffTasks';
import { StaffChecklist } from './pages/staff/StaffChecklist';
import { StaffOnboarding } from './pages/staff/StaffOnboarding';
import { StaffDocuments } from './pages/staff/StaffDocuments';

// Manager Pages
import { ManagerHome } from './pages/manager/ManagerHome';
import { ManagerSchedule } from './pages/manager/ManagerSchedule';
import { ManagerTimesheet } from './pages/manager/ManagerTimesheet';
import { ManagerTasks } from './pages/manager/ManagerTasks';
import { ManagerOnboarding } from './pages/manager/ManagerOnboarding';
import { ManagerDocuments } from './pages/manager/ManagerDocuments';
import { ManagerAuditLog } from './pages/manager/ManagerAuditLog';

const MainContent: React.FC = () => {
  const {
    currentRole,
    currentPage,
    activeStaff,
    authenticateManager,
    switchRole,
    staffUsers,
    switchUser,
    isTerminalLocked,
    setIsTerminalLocked,
    lockTerminal,
    addAuditLog,
  } = useApp();
  // Terminal Sign-In State
  const [terminalUserId, setTerminalUserId] = useState('');
  const [terminalError, setTerminalError] = useState('');

  // Strict RBAC: Staff users are strictly locked to staff views
  const effectiveRole = activeStaff.role === 'staff' ? 'staff' : currentRole;

  const handleTerminalUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminalError('');

    if (!terminalUserId) {
      setTerminalError('Please choose an employee profile to sign in.');
      return;
    }

    const selectedUser = staffUsers.find((u) => u.id === terminalUserId);
    if (!selectedUser) return;

    // Successful login without PIN
    addAuditLog({
      actionType: 'login',
      title: `Terminal Sign-In: ${selectedUser.firstName} ${selectedUser.lastName}`,
      details: `${selectedUser.firstName} signed into workforce session (${selectedUser.position}).`,
      actorName: `${selectedUser.firstName} (${selectedUser.position})`,
      actorRole: selectedUser.role,
      severity: 'info',
      terminal: 'Sunnybank POS Terminal #1',
    });

    switchUser(terminalUserId);
    setIsTerminalLocked(false);
    setTerminalUserId('');
  };

  const renderContent = () => {
    if (effectiveRole === 'staff') {
      // If a staff user attempts to view manager administrative pages, trigger AccessDenied
      const managerOnlyPages = ['Weekly Schedule', 'Timesheet', 'Task', 'Staffs', 'Onboarding Progress', 'Audit Log'];
      if (managerOnlyPages.includes(currentPage)) {
        return <AccessDenied attemptedPage={currentPage} />;
      }

      switch (currentPage) {
        case 'Homepage':
          return <StaffHome />;
        case 'My Schedule':
          return <StaffSchedule />;
        case 'My Availability':
          return <StaffAvailability />;
        case 'Clock In/Out':
          return <StaffClock />;
        case 'My Task':
          return <StaffTasks />;
        case 'Daily Checklist':
          return <StaffChecklist />;
        case 'Onboarding':
          return <StaffOnboarding />;
        case 'Documents':
          return <StaffDocuments />;
        default:
          return <StaffHome />;
      }
    } else {
      // Manager Pages
      switch (currentPage) {
        case 'Homepage':
          return <ManagerHome />;
        case 'Weekly Schedule':
          return <ManagerSchedule />;
        case 'Timesheet':
          return <ManagerTimesheet />;
        case 'Task':
          return <ManagerTasks />;
        case 'Staffs':
        case 'Onboarding Progress':
          return <ManagerOnboarding />;
        case 'Documents':
          return <ManagerDocuments />;
        case 'Audit Log':
          return <ManagerAuditLog />;
        default:
          return <ManagerHome />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 antialiased selection:bg-indigo-600 selection:text-slate-950" style={{ backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top RBAC Security Status Strip (Desktop persistent view; mobile has clean unified header) */}
        <div className="hidden md:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 items-center justify-between text-xs">
          {effectiveRole === 'manager' ? (
            <div className="flex items-center gap-1.5 text-indigo-900 font-semibold min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate text-xs">Manager Console</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline font-normal text-slate-600 truncate">Admin: {activeStaff.firstName} {activeStaff.lastName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Verified Session"></span>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate text-xs">
                {activeStaff.firstName} {activeStaff.lastName}
              </span>
              <span className="text-slate-500 font-normal hidden sm:inline">({activeStaff.position})</span>
              <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200 uppercase tracking-wider">
                <Shield className="w-2.5 h-2.5 text-slate-400" />
                Verified
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {effectiveRole === 'staff' ? (
              <>
                <button
                  onClick={() => switchRole('manager')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Switch to Manager Console"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Manager Console</span>
                </button>
                <button
                  onClick={() => {
                    setTerminalUserId(activeStaff.id);
                    setTerminalError('');
                    setIsTerminalLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Switch employee profile or sign out"
                >
                  <LogOut className="w-3 h-3 text-slate-600" />
                  <span>Switch User</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:inline">
                  Manager Mode
                </span>
                <button
                  onClick={() => switchRole('staff')}
                  className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:underline cursor-pointer px-1.5 py-0.5"
                  title="Switch to Staff Mode"
                >
                  Staff Mode
                </button>
                <button
                  onClick={() => {
                    setTerminalUserId(activeStaff.id);
                    setTerminalError('');
                    setIsTerminalLocked(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer ml-1"
                  title="Switch user or sign out"
                >
                  <LogOut className="w-3 h-3 text-slate-500" />
                  <span>Switch User</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <OnboardingGuard>
            {renderContent()}
          </OnboardingGuard>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 text-xs text-slate-500 pb-20 md:pb-3.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span>Restaurant HR, Workforce Roster, & Operations</span>
            </div>
            <div className="text-slate-400">
              Sunnybank Market Square, QLD • Malaya Corner
            </div>
          </div>
        </footer>
      </div>

      {/* Workforce Terminal Sign-In Screen (Direct Profile Selection, No PIN Required) */}
      {isTerminalLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 text-left space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Terminal Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Workforce Sign-In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sunnybank Market Square • Choose Employee Profile
              </p>
            </div>

            {/* Terminal Sign-In Form */}
            <form onSubmit={handleTerminalUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Employee Profile
                </label>
                <select
                  value={terminalUserId}
                  onChange={(e) => setTerminalUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Employee Profile --</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.position} • {u.role === 'manager' ? 'Manager' : 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              {terminalUserId && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  {(() => {
                    const sel = staffUsers.find((u) => u.id === terminalUserId);
                    if (!sel) return null;
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sel.firstName} {sel.lastName}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{sel.position}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sel.role === 'manager' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {sel.role === 'manager' ? 'Manager' : 'Staff'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {terminalError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{terminalError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTerminalLocked(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  Sign In Directly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
