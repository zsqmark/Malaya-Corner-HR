import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftType } from '../../types';
import {
  Clock,
  MapPin,
  Calendar,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
  Tablet,
  Lock,
  Unlock,
  RotateCcw,
  UserCheck,
  ChevronRight,
  LogOut,
  Info,
  Timer,
} from 'lucide-react';
import { AuthorizeDeviceModal } from '../../components/AuthorizeDeviceModal';

export const StaffClock: React.FC = () => {
  const {
    activeStaff,
    clockRecords,
    clockIn,
    clockOut,
    toggleBreak,
    isDeviceAuthorizedTerminal,
    terminalMetadata,
    deauthorizeCurrentDevice,
    isTerminalLocked,
    setIsTerminalLocked,
    lockTerminal,
  } = useApp();

  const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = useState(false);

  // Active clock record for activeStaff
  const activeRecord = clockRecords.find(
    (r) => r.staffId === activeStaff.id && (r.status === 'clocked_in' || r.status === 'on_break')
  );

  // My punch history
  const myPunches = clockRecords.filter((r) => r.staffId === activeStaff.id);

  // Live clock ticker
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Shift session selection
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>(() => {
    const hour = new Date().getHours();
    return hour >= 15 ? 'dinner' : 'lunch';
  });

  // Punch feedback and 10-second auto-lock countdown state
  const [recentPunchEvent, setRecentPunchEvent] = useState<{
    type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
    time: string;
    shiftType: string;
  } | null>(null);

  const [autoLockCountdown, setAutoLockCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1-second live clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle 10-second post-punch countdown
  useEffect(() => {
    if (autoLockCountdown === null) return;

    if (autoLockCountdown <= 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setAutoLockCountdown(null);
      setRecentPunchEvent(null);
      lockTerminal();
      return;
    }

    countdownIntervalRef.current = setTimeout(() => {
      setAutoLockCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
    };
  }, [autoLockCountdown, lockTerminal]);

  // Idle timeout: if unlocked on terminal and no action for 35 seconds, lock back to keypad
  useEffect(() => {
    if (!isDeviceAuthorizedTerminal || isTerminalLocked) return;

    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        // Only auto-lock if not in active punch countdown
        if (autoLockCountdown === null) {
          lockTerminal();
        }
      }, 35000);
    };

    resetIdleTimer();
    const handleActivity = () => resetIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isDeviceAuthorizedTerminal, isTerminalLocked, autoLockCountdown, lockTerminal]);

  // Trigger punch with 10s countdown
  const handleClockIn = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    clockIn(activeStaff.id, selectedShiftType);
    setRecentPunchEvent({
      type: 'clock_in',
      time: nowStr,
      shiftType: selectedShiftType.toUpperCase(),
    });
    setAutoLockCountdown(10);
  };

  const handleClockOut = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const shift = activeRecord?.shiftType?.toUpperCase() || 'SHIFT';
    clockOut(activeStaff.id);
    setRecentPunchEvent({
      type: 'clock_out',
      time: nowStr,
      shiftType: shift,
    });
    setAutoLockCountdown(10);
  };

  const handleToggleBreak = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isStarting = activeRecord?.status !== 'on_break';
    toggleBreak(activeStaff.id);
    setRecentPunchEvent({
      type: isStarting ? 'break_start' : 'break_end',
      time: nowStr,
      shiftType: activeRecord?.shiftType?.toUpperCase() || 'SHIFT',
    });
    setAutoLockCountdown(10);
  };

  const handleImmediateLock = () => {
    if (countdownIntervalRef.current) clearTimeout(countdownIntervalRef.current);
    setAutoLockCountdown(null);
    setRecentPunchEvent(null);
    lockTerminal();
  };

  // =========================================================================
  // CASE 1: UNAUTHORIZED PERSONAL DEVICE VIEW
  // =========================================================================
  if (!isDeviceAuthorizedTerminal) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Authorize Device Modal */}
        <AuthorizeDeviceModal
          isOpen={isAuthorizeModalOpen}
          onClose={() => setIsAuthorizeModalOpen(false)}
        />

        {/* Header */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">
              <Tablet className="w-3.5 h-3.5" />
              <span>Personal Device View</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shift Clock Station
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Malaya Corner • Sunnybank Market Square Restaurant
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setIsAuthorizeModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Authorize Device</span>
            </button>
          </div>
        </div>

        {/* Store Terminal Clock-In Enforced Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>In-Store Terminal Clock-In Enforced</span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                  On-Premise Only
                </span>
              </h2>
              <p className="text-xs text-amber-900/90 mt-1 max-w-xl leading-relaxed">
                To maintain verified floor attendance, clocking in and out is restricted to authorized on-premise hardware terminals. Please sign in with your 4–6 digit security PIN on the store POS terminal upon arrival.
              </p>
              <div className="mt-2 text-[11px] text-amber-800/80 font-medium flex items-center gap-2">
                <span>Designated Terminal: Sunnybank POS Terminal #1</span>
                <span>·</span>
                <span>Counter Station</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-stretch md:self-center flex md:flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsAuthorizeModalOpen(true)}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-4 cursor-pointer"
            >
              Manager: Authorize this device →
            </button>
          </div>
        </div>

        {/* Real-Time Shift Status Card (Read-Only) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Employee Status
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {activeStaff.firstName} {activeStaff.lastName} ({activeStaff.position})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Store Time</div>
                <div className="font-mono text-sm font-bold text-slate-800 tabular-nums">{currentTime}</div>
              </div>
            </div>
          </div>

          {activeRecord ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-emerald-900 text-sm">
                    {activeRecord.status === 'on_break' ? 'Currently on Meal Break' : 'Actively Clocked In on Shift'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                    {activeRecord.shiftType}
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Punch recorded at <strong className="font-mono">{activeRecord.clockInTime}</strong> on {activeRecord.date}.
                </p>
              </div>

              <div className="text-xs text-emerald-700 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-200/80 font-medium self-stretch sm:self-center text-center">
                Punch out via in-store terminal
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-800">Not Clocked In</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Sign in at the counter POS terminal using your PIN when your shift commences.
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-400 font-mono">OFF DUTY</div>
            </div>
          )}
        </div>

        {/* My Timesheet Punch Records */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>My Verified Timesheet & Punch Log</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {myPunches.length} punch records
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {myPunches.length > 0 ? (
              myPunches.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{rec.date}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rec.shiftType}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          rec.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'clocked_in'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] tabular-nums">
                      In: {rec.clockInTime} {rec.clockOutTime ? `· Out: ${rec.clockOutTime}` : '· In Progress'}
                      {rec.breakMinutes > 0 && ` · ${rec.breakMinutes}m break`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                      {rec.totalHours ? `${rec.totalHours} hrs` : 'Active'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      ${rec.hourlyRate.toFixed(2)}/hr
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No past clock punches recorded yet for this profile.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: AUTHORIZED HARDWARE TIME CLOCK TERMINAL
  // =========================================================================
  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Authorize Modal (can also be invoked to re-configure or rename terminal) */}
      <AuthorizeDeviceModal
        isOpen={isAuthorizeModalOpen}
        onClose={() => setIsAuthorizeModalOpen(false)}
      />

      {/* Terminal Bar & Hardware Identity */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Authorized Store Terminal
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {terminalMetadata?.terminalName || 'Sunnybank POS Terminal #1'}
            </h1>
            <p className="text-[11px] text-slate-400">
              Hardware Verified · Sunnybank Market Square Counter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={lockTerminal}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock terminal to employee PIN keypad"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Lock Kiosk</span>
          </button>

          <button
            type="button"
            onClick={deauthorizeCurrentDevice}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
            title="Revoke terminal status from this device"
          >
            De-authorize
          </button>
        </div>
      </div>

      {/* 10-Second Post-Punch Countdown Notification Banner */}
      {recentPunchEvent && autoLockCountdown !== null && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Punch Recorded: {recentPunchEvent.type === 'clock_in' && 'Clocked In'}
                  {recentPunchEvent.type === 'clock_out' && 'Clocked Out'}
                  {recentPunchEvent.type === 'break_start' && 'Meal Break Started'}
                  {recentPunchEvent.type === 'break_end' && 'Meal Break Ended'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Verified at {recentPunchEvent.time} · {activeStaff.firstName} {activeStaff.lastName} ({recentPunchEvent.shiftType})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleImmediateLock}
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              Lock Now ({autoLockCountdown}s)
            </button>
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(autoLockCountdown / 10) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-100">
            <span>Terminal will auto-lock for the next staff member</span>
            <span className="font-mono font-bold tabular-nums">{autoLockCountdown} seconds remaining</span>
          </div>
        </div>
      )}

      {/* Main Terminal Punch Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 rounded-2xl shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Terminal Live Time
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5 text-white tabular-nums">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Automated 15-minute timesheet rounding (:00, :15, :30, :45)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm uppercase border border-white/15">
              {activeStaff.firstName[0]}
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-white">
                {activeStaff.firstName} {activeStaff.lastName}
              </div>
              <div className="text-[11px] text-indigo-200">{activeStaff.position}</div>
            </div>

            <button
              type="button"
              onClick={lockTerminal}
              className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Switch user / lock terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Punch Controls */}
        {activeRecord ? (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold text-emerald-300 text-sm uppercase">
                    {activeRecord.status === 'on_break' ? 'Currently on Break' : 'Actively Clocked In'}
                  </span>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded uppercase text-white">
                    {activeRecord.shiftType} Shift
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono tabular-nums">
                  Started at: <strong className="text-white">{activeRecord.clockInTime}</strong> · Date: {activeRecord.date}
                </div>
              </div>

              {activeRecord.status === 'on_break' && (
                <div className="text-xs text-amber-300 font-medium bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  Meal break in progress
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleToggleBreak}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  activeRecord.status === 'on_break'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>{activeRecord.status === 'on_break' ? 'End Meal Break' : 'Take 30m Meal Break'}</span>
              </button>

              <button
                type="button"
                onClick={handleClockOut}
                className="py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-red-900/40"
              >
                <Square className="w-4 h-4" />
                <span>Clock Out from Shift</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Select Your Shift Session:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedShiftType('lunch')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedShiftType === 'lunch'
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <Sun className="w-3.5 h-3.5" />
                    Lunch Service
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">11:00am – 2:30pm</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShiftType('dinner')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedShiftType === 'dinner'
                      ? 'bg-indigo-500/30 border-indigo-400 text-white ring-2 ring-indigo-400/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-300">
                    <Moon className="w-3.5 h-3.5" />
                    Dinner Service
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">4:30pm – 10:00pm</div>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClockIn}
              className="w-full py-4 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/40"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Clock In for {selectedShiftType.toUpperCase()} Shift</span>
            </button>
          </div>
        )}
      </div>

      {/* Terminal History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Recent Terminal Punches ({activeStaff.firstName})</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            {myPunches.length} records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {myPunches.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              className="p-3 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{rec.date}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {rec.shiftType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rec.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'clocked_in'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
                <div className="text-slate-500 font-mono text-[11px] tabular-nums">
                  In: {rec.clockInTime} {rec.clockOutTime ? `· Out: ${rec.clockOutTime}` : '· In Progress'}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                  {rec.totalHours ? `${rec.totalHours} hrs` : 'Active'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
