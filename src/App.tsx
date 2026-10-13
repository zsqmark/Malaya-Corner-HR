import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AccessDenied } from './components/AccessDenied';
import {
  Shield,
  User,
  Lock,
  KeyRound,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Delete,
  X,
  HelpCircle,
  CheckCircle2,
  Tablet,
} from 'lucide-react';
import { ManagerPinResetModal } from './components/ManagerPinResetModal';

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
    authenticateStaffPin,
    isDeviceAuthorizedTerminal,
    terminalMetadata,
  } = useApp();
  // Terminal Sign-In State
  const [terminalUserId, setTerminalUserId] = useState('');
  const [terminalPin, setTerminalPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [terminalError, setTerminalError] = useState('');
  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
  const [pinResetToast, setPinResetToast] = useState<string | null>(null);

  const handlePinResetSuccess = (staffId: string, newPin: string) => {
    setTerminalUserId(staffId);
    setTerminalPin(newPin);
    setTerminalError('');
    const staffObj = staffUsers.find((s) => s.id === staffId);
    const name = staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : 'Employee';
    setPinResetToast(`PIN reset authorized by manager! ${name}'s PIN is now updated to ${newPin}. Ready for sign-in.`);
    setTimeout(() => setPinResetToast(null), 8000);
  };

  // Strict RBAC: Staff users are strictly locked to staff views
  const effectiveRole = activeStaff.role === 'staff' ? 'staff' : currentRole;

  const handleSelectUser = (id: string) => {
    setTerminalUserId(id);
    setTerminalPin('');
    setTerminalError('');
  };

  const handleKeypadDigit = (digit: string) => {
    if (terminalPin.length >= 6) return;
    setTerminalPin((prev) => prev + digit);
    setTerminalError('');
  };

  const handleKeypadBackspace = () => {
    setTerminalPin((prev) => prev.slice(0, -1));
    setTerminalError('');
  };

  const handleKeypadClear = () => {
    setTerminalPin('');
    setTerminalError('');
  };

  const handleTerminalUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTerminalError('');

    if (!terminalUserId) {
      setTerminalError('Please choose an employee profile first.');
      return;
    }

    const cleanPin = terminalPin.trim();

    if (!cleanPin) {
      setTerminalError('Mandatory PIN required: Please enter your 4 to 6 digit security passcode.');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanPin)) {
      setTerminalError('Security PIN must be between 4 and 6 digits (numbers only).');
      return;
    }

    const selectedUser = staffUsers.find((u) => u.id === terminalUserId);
    if (!selectedUser) {
      setTerminalError('Selected employee profile was not found.');
      return;
    }

    // Verify mandatory PIN
    const isPinValid = authenticateStaffPin(terminalUserId, cleanPin);

    if (!isPinValid) {
      setTerminalError('Incorrect PIN. Please enter your valid 4 to 6 digit security passcode.');
      addAuditLog({
        actionType: 'login',
        title: `Failed Terminal Sign-In: ${selectedUser.firstName} ${selectedUser.lastName}`,
        details: `Invalid security PIN entered on Workforce Terminal for ${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.position}).`,
        actorName: `${selectedUser.firstName} (${selectedUser.position})`,
        actorRole: selectedUser.role,
        severity: 'warning',
        terminal: terminalMetadata?.terminalName || (isDeviceAuthorizedTerminal ? 'Sunnybank POS Terminal #1' : 'Personal Device Portal'),
        metadata: { staffId: selectedUser.id, attemptedDigits: cleanPin.length },
      });
      return;
    }

    // Successful login with verified 4 to 6 digit PIN
    addAuditLog({
      actionType: 'login',
      title: `Terminal Sign-In (PIN Verified): ${selectedUser.firstName} ${selectedUser.lastName}`,
      details: `${selectedUser.firstName} successfully authenticated with mandatory ${cleanPin.length}-digit security PIN (${selectedUser.position}). Ready for shift timeclock and floor duties.`,
      actorName: `${selectedUser.firstName} (${selectedUser.position})`,
      actorRole: selectedUser.role,
      severity: 'info',
      terminal: terminalMetadata?.terminalName || (isDeviceAuthorizedTerminal ? 'Sunnybank POS Terminal #1' : 'Personal Device Portal'),
      metadata: { staffId: selectedUser.id, pinLength: cleanPin.length },
    });

    switchUser(terminalUserId, true);
    setIsTerminalLocked(false);
    setTerminalUserId('');
    setTerminalPin('');
    setShowPin(false);
  };

  const renderContent = () => {
    if (effectiveRole === 'staff') {
      // If a staff user attempts to view manager administrative pages, trigger AccessDenied
      const managerOnlyPages = ['Weekly Schedule', 'Timesheet', 'Task', 'Staff', 'Staffs', 'Onboarding Progress', 'Audit Log'];
      if (activeStaff.role !== 'manager' && managerOnlyPages.includes(currentPage)) {
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
        case 'Staff':
        case 'Staffs':
          return <ManagerOnboarding />;
        case 'Onboarding':
          return activeStaff.role === 'manager' ? <ManagerOnboarding /> : <StaffOnboarding />;
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
        case 'Staff':
        case 'Staffs':
        case 'Onboarding Progress':
        case 'Onboarding':
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
              {isDeviceAuthorizedTerminal ? (
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                  <Tablet className="w-3 h-3 text-amber-700" />
                  {terminalMetadata?.terminalName || 'Store Terminal'}
                </span>
              ) : (
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                  Personal Device
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {effectiveRole === 'staff' ? (
              <>
                <button
                  onClick={() => {
                    setTerminalUserId('staff-mark');
                    setTerminalPin('');
                    setTerminalError('');
                    setIsTerminalLocked(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                  title="Sign in as Manager (Mark Zhang)"
                >
                  <Shield className="w-3.5 h-3.5" />
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

      {/* Workforce Terminal Sign-In Screen (Mandatory 4 to 6 Digit PIN Security) */}
      {isTerminalLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Terminal Header */}
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-2.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Workforce Terminal Sign-In
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5 font-medium">
                <span>Sunnybank Market Square</span>
                <span>•</span>
                <span className="text-indigo-600 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 inline" /> 4–6 Digit PIN Required
                </span>
              </p>
            </div>

            {/* Terminal Sign-In Form */}
            <form onSubmit={handleTerminalUnlock} className="space-y-3.5">
              {pinResetToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{pinResetToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinResetToast(null)}
                    className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Select Employee Profile</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={terminalUserId}
                  onChange={(e) => handleSelectUser(e.target.value)}
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
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
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

              {/* Mandatory 4 to 6 digit PIN input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Enter Security PIN</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    terminalPin.length >= 4 && terminalPin.length <= 6
                      ? 'text-emerald-600'
                      : terminalPin.length > 0
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}>
                    {terminalPin.length}/6 digits (min 4)
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={terminalPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTerminalPin(val);
                      setTerminalError('');
                    }}
                    placeholder="Enter 4 to 6 digit passcode..."
                    autoComplete="off"
                    className="w-full pl-3.5 pr-20 py-2.5 text-base sm:text-lg font-mono font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {terminalPin && (
                      <button
                        type="button"
                        onClick={handleKeypadClear}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Clear PIN"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Forgot PIN Link */}
                <div className="flex items-center justify-between text-xs pt-0.5 pb-0.5 px-0.5">
                  <span className="text-[11px] text-slate-400">Locked out or forgotten?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTerminalError('');
                      setIsForgotPinOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Forgot PIN?</span>
                  </button>
                </div>

                {/* Touch Keypad for POS Terminal Touchscreens */}
                <div className="pt-1.5 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadDigit(digit)}
                        className="py-2.5 text-sm sm:text-base font-bold font-mono bg-white hover:bg-indigo-50 active:scale-95 text-slate-800 hover:text-indigo-700 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-red-50 active:scale-95 text-slate-600 hover:text-red-700 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadDigit('0')}
                      className="py-2.5 text-sm sm:text-base font-bold font-mono bg-white hover:bg-indigo-50 active:scale-95 text-slate-800 hover:text-indigo-700 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-amber-50 active:scale-95 text-slate-600 hover:text-amber-800 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                <span className="font-bold">Security Passcode:</span> Mandatory 4–6 digit PIN (e.g., <strong>1001</strong> for John Tan, <strong>1002</strong> for L'Erica, <strong>123456</strong> or <strong>1234</strong> for Mark Zhang).
              </div>

              {terminalError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{terminalError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsTerminalLocked(false);
                    setTerminalPin('');
                    setTerminalError('');
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!terminalUserId || terminalPin.length < 4}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify PIN &amp; Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Identity Verification & PIN Reset Modal */}
      <ManagerPinResetModal
        isOpen={isForgotPinOpen}
        onClose={() => setIsForgotPinOpen(false)}
        targetStaffId={terminalUserId}
        onPinResetSuccess={handlePinResetSuccess}
      />
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
