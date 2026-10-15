import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek, ShiftType, ShiftSlot, StaffUser } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Moon,
  Users,
  Wine,
  Utensils,
  ChefHat,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  Sparkles,
  Edit2,
  Trash2,
  Send,
  Lock,
  Unlock,
  CheckCheck,
  Archive,
  Copy,
  Wand2,
  RotateCcw,
  Search,
  Zap,
  Check,
  X,
  SlidersHorizontal,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  SHIFT_WINDOWS,
  validateShiftStartTime,
  formatTime12h,
  formatTimeTo24h,
} from '../../utils/shiftTimes';
import { WeeklyTimesheetExportModal } from '../../components/timesheet/WeeklyTimesheetExportModal';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ManagerSchedule: React.FC = () => {
  const {
    shifts,
    staffUsers,
    availabilities,
    assignStaffToShift,
    unassignStaffFromShift,
    createShift,
    updateShift,
    deleteShift,
    cyclePhase,
    isAvailabilityLocked,
    isScheduleSent,
    lastScheduleSentAt,
    lastTimesheetExportedAt,
    sendOutScheduleToStaff,
    executeSundayCloseAndTimesheetExport,
    setCyclePhaseManual,
    resetAvailabilitiesTable,
    openNewWeeklyCycle,
  } = useApp();

  const [showWeeklyExportModal, setShowWeeklyExportModal] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'csv_grid' | 'calendar_board'>('csv_grid');
  const [mobileDayFilter, setMobileDayFilter] = useState<DayOfWeek | 'ALL'>('MON');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MON');

  // In-Table Quick Edit mode (direct in-cell input & 1-click edits with no limits)
  const [inlineEditMode, setInlineEditMode] = useState(true);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showCopyDayModal, setShowCopyDayModal] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<DayOfWeek>('MON');
  const [copyTargetDay, setCopyTargetDay] = useState<DayOfWeek>('TUE');

  // Quick cell input popover state (when clicking "+ Custom" on a cell)
  const [quickInputCell, setQuickInputCell] = useState<{ staffId: string; day: DayOfWeek; shiftType: ShiftType } | null>(null);
  const [quickInputStart, setQuickInputStart] = useState('11:15');
  const [quickInputEnd, setQuickInputEnd] = useState('14:30');

  // Add shift state (Unrestricted)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShiftDay, setNewShiftDay] = useState<DayOfWeek>('MON');
  const [newShiftType, setNewShiftType] = useState<ShiftType>('lunch');
  const [newShiftStart, setNewShiftStart] = useState('11:15');
  const [newShiftEndTime, setNewShiftEndTime] = useState('14:30');
  const [newShiftStaffId, setNewShiftStaffId] = useState<string>('');
  const [newShiftRoleRequired, setNewShiftRoleRequired] = useState<string>('Wait Staff');
  const [newShiftNotes, setNewShiftNotes] = useState<string>('');
  const [newShiftMultipleDays, setNewShiftMultipleDays] = useState<DayOfWeek[]>([]);

  // Editing existing shift state (Full unrestricted editing: start, end, staff, day, type, role, notes, duplicate)
  const [editingShift, setEditingShift] = useState<ShiftSlot | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editStaffId, setEditStaffId] = useState<string>('');
  const [editDay, setEditDay] = useState<DayOfWeek>('MON');
  const [editShiftType, setEditShiftType] = useState<ShiftType>('lunch');
  const [editRoleRequired, setEditRoleRequired] = useState<string>('Wait Staff');
  const [editNotes, setEditNotes] = useState<string>('');
  const [copyToDays, setCopyToDays] = useState<DayOfWeek[]>([]);

  // Modal staff view / filter by role state
  const [modalRoleFilter, setModalRoleFilter] = useState<'all' | 'wait_staff' | 'bar_staff' | 'kitchen' | 'manager'>('all');

  // Quick helper to categorize and group staff by role
  const getStaffByRoles = (list: StaffUser[], filter: string = 'all') => {
    const isBar = (s: StaffUser) => s.staffType === 'bar_staff' || s.position?.toLowerCase().includes('bar');
    const isKitchen = (s: StaffUser) =>
      s.position?.toLowerCase().includes('kitchen') ||
      s.position?.toLowerCase().includes('runner') ||
      s.position?.toLowerCase().includes('cook') ||
      s.position?.toLowerCase().includes('chef');
    const isManager = (s: StaffUser) =>
      s.role === 'manager' || s.position?.toLowerCase().includes('manager') || s.position?.toLowerCase().includes('supervisor');
    const isWait = (s: StaffUser) => !isBar(s) && !isKitchen(s) && !isManager(s);

    if (filter === 'bar_staff') return [{ label: 'Bar Staff', items: list.filter(isBar) }];
    if (filter === 'wait_staff') return [{ label: 'Wait Staff / Floor Staff', items: list.filter(isWait) }];
    if (filter === 'kitchen') return [{ label: 'Kitchen Staff & Runners', items: list.filter(isKitchen) }];
    if (filter === 'manager') return [{ label: 'Management & Supervisors', items: list.filter(isManager) }];

    return [
      { label: 'Wait Staff / Floor Staff', items: list.filter(isWait) },
      { label: 'Bar Staff', items: list.filter(isBar) },
      { label: 'Kitchen Staff & Runners', items: list.filter(isKitchen) },
      { label: 'Management & Supervisors', items: list.filter(isManager) },
    ].filter((group) => group.items.length > 0);
  };

  // Quick helper to check if a staff is available on day & shift
  const checkStaffAvailable = (staffId: string, day: DayOfWeek, shiftType: ShiftType): boolean => {
    const record = availabilities[staffId];
    if (!record || !record.availabilities || !record.availabilities[day]) return false;
    return Boolean(record.availabilities[day][shiftType]);
  };

  // Handle assigning staff
  const handleAssignChange = (shiftId: string, staffId: string) => {
    if (!staffId) {
      unassignStaffFromShift(shiftId);
    } else {
      assignStaffToShift(shiftId, staffId);
    }
  };

  // Direct In-Table Time Modification (Immediate, no modal required)
  const handleInlineTimeChange = (shiftId: string, newStart: string, newEnd?: string) => {
    const cleanStart = formatTimeTo24h(newStart) || newStart.trim();
    const cleanEnd = newEnd !== undefined ? (formatTimeTo24h(newEnd) || newEnd.trim() || undefined) : undefined;
    updateShift(shiftId, {
      startTime: cleanStart,
      ...(newEnd !== undefined ? { endTime: cleanEnd } : {}),
    });
    setActionFeedback(`Shift updated to ${cleanStart}${cleanEnd ? ` - ${cleanEnd}` : ''} (saved instantly)`);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Direct 1-click Shift Creation (No Limits)
  const handleDirectAddShift = (
    staffId: string | undefined,
    day: DayOfWeek,
    shiftType: ShiftType,
    customStart?: string,
    customEnd?: string
  ) => {
    const cleanStart = (customStart && (formatTimeTo24h(customStart) || customStart.trim())) || (shiftType === 'lunch' ? '11:15' : '16:45');
    const cleanEnd = (customEnd && (formatTimeTo24h(customEnd) || customEnd.trim())) || (shiftType === 'lunch' ? '14:30' : '22:00');
    const staff = staffUsers.find((s) => s.id === staffId);

    createShift({
      day,
      dateStr: '2026-09-07',
      shiftType,
      startTime: cleanStart,
      endTime: cleanEnd,
      assignedStaffId: staffId || undefined,
      roleRequired: staff?.position || 'Wait Staff',
      status: 'published',
    });

    setActionFeedback(`Shift scheduled for ${day} ${shiftType.toUpperCase()} (${cleanStart}${cleanEnd ? ` - ${cleanEnd}` : ''}) with no restrictions.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Duplicate an entire day's roster to another day
  const handleCopyDayRoster = (sourceDay: DayOfWeek, targetDay: DayOfWeek) => {
    const sourceShifts = shifts.filter((s) => s.day === sourceDay);
    if (sourceShifts.length === 0) {
      setActionFeedback(`No shifts found on ${sourceDay} to duplicate.`);
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    sourceShifts.forEach((shift) => {
      createShift({
        day: targetDay,
        dateStr: '2026-09-07',
        shiftType: shift.shiftType,
        startTime: shift.startTime,
        endTime: shift.endTime,
        assignedStaffId: shift.assignedStaffId,
        roleRequired: shift.roleRequired || 'Wait Staff',
        status: 'published',
        notes: shift.notes,
      });
    });
    setShowCopyDayModal(false);
    setActionFeedback(`Successfully copied ${sourceShifts.length} shifts from ${sourceDay} to ${targetDay}!`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const openEditModal = (shift: ShiftSlot) => {
    setEditingShift(shift);
    setEditStartTime(shift.startTime || (shift.shiftType === 'lunch' ? '11:15' : '16:45'));
    setEditEndTime(shift.endTime || (shift.shiftType === 'lunch' ? '14:30' : '22:00'));
    setEditStaffId(shift.assignedStaffId || '');
    setEditDay(shift.day);
    setEditShiftType(shift.shiftType);
    setEditRoleRequired(shift.roleRequired || 'Wait Staff');
    setEditNotes(shift.notes || '');
    setCopyToDays([]);
  };

  const handleQuickAddShift = (staffId: string, day: DayOfWeek, shiftType: ShiftType) => {
    const start = shiftType === 'lunch' ? '11:15' : '16:45';
    const end = shiftType === 'lunch' ? '14:30' : '22:00';
    createShift({
      day,
      dateStr: '2026-09-07',
      shiftType,
      startTime: start,
      endTime: end,
      assignedStaffId: staffId,
      roleRequired: 'Wait Staff',
      status: 'published',
    });
    setActionFeedback(`Shift scheduled for ${day} ${shiftType.toUpperCase()}. Click to edit hours anytime.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleOpenAddForCell = (staffId: string, day: DayOfWeek, shiftType: ShiftType) => {
    setNewShiftStaffId(staffId);
    setNewShiftDay(day);
    setNewShiftType(shiftType);
    setNewShiftStart(shiftType === 'lunch' ? '11:15' : '16:45');
    setNewShiftEndTime(shiftType === 'lunch' ? '14:30' : '22:00');
    setNewShiftMultipleDays([]);
    setShowAddModal(true);
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStart = formatTimeTo24h(newShiftStart) || newShiftStart || '11:15';
    const cleanEnd = newShiftEndTime.trim() ? (formatTimeTo24h(newShiftEndTime) || newShiftEndTime.trim()) : undefined;

    createShift({
      day: newShiftDay,
      dateStr: '2026-09-07',
      shiftType: newShiftType,
      startTime: cleanStart,
      endTime: cleanEnd,
      assignedStaffId: newShiftStaffId || undefined,
      roleRequired: newShiftRoleRequired,
      status: 'published',
      notes: newShiftNotes || undefined,
    });

    if (newShiftMultipleDays.length > 0) {
      newShiftMultipleDays.forEach((d) => {
        if (d !== newShiftDay) {
          createShift({
            day: d,
            dateStr: '2026-09-07',
            shiftType: newShiftType,
            startTime: cleanStart,
            endTime: cleanEnd,
            assignedStaffId: newShiftStaffId || undefined,
            roleRequired: newShiftRoleRequired,
            status: 'published',
            notes: newShiftNotes || undefined,
          });
        }
      });
    }

    setShowAddModal(false);
    setActionFeedback('Shift(s) added successfully with no timing restrictions.');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    const cleanStart = formatTimeTo24h(editStartTime) || editStartTime || '11:15';
    const cleanEnd = editEndTime.trim() ? (formatTimeTo24h(editEndTime) || editEndTime.trim()) : undefined;

    updateShift(editingShift.id, {
      day: editDay,
      shiftType: editShiftType,
      startTime: cleanStart,
      endTime: cleanEnd,
      assignedStaffId: editStaffId || undefined,
      roleRequired: editRoleRequired,
      notes: editNotes || undefined,
    });

    if (copyToDays.length > 0) {
      copyToDays.forEach((d) => {
        if (d !== editDay) {
          createShift({
            day: d,
            dateStr: '2026-09-07',
            shiftType: editShiftType,
            startTime: cleanStart,
            endTime: cleanEnd,
            assignedStaffId: editStaffId || undefined,
            roleRequired: editRoleRequired,
            status: 'published',
            notes: editNotes || undefined,
          });
        }
      });
    }

    setEditingShift(null);
    setActionFeedback('Shift updated successfully with zero restrictions.');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Auto-fill from available staff helper
  const handleAutoFillAvailable = () => {
    let assignedCount = 0;
    DAYS.forEach((day) => {
      (['lunch', 'dinner'] as ShiftType[]).forEach((shiftType) => {
        staffUsers.forEach((staff) => {
          const isAvail = checkStaffAvailable(staff.id, day, shiftType);
          const alreadyAssigned = shifts.some((s) => s.assignedStaffId === staff.id && s.day === day && s.shiftType === shiftType);
          if (isAvail && !alreadyAssigned) {
            createShift({
              day,
              dateStr: '2026-09-07',
              shiftType,
              startTime: shiftType === 'lunch' ? '11:15' : '16:45',
              endTime: shiftType === 'lunch' ? '14:30' : '22:00',
              assignedStaffId: staff.id,
              roleRequired: staff.position || 'Wait Staff',
              status: 'published',
            });
            assignedCount++;
          }
        });
      });
    });
    setActionFeedback(`Auto-fill complete: ${assignedCount} shifts drafted from submitted staff availabilities.`);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Workforce Shift & Staff stats for schedule sending
  const totalShiftsCount = shifts.length;
  const assignedShiftsCount = shifts.filter((s) => Boolean(s.assignedStaffId)).length;
  const unassignedShiftsCount = totalShiftsCount - assignedShiftsCount;
  const rosteredStaffCount = new Set(
    shifts.filter((s) => s.assignedStaffId).map((s) => s.assignedStaffId)
  ).size;

  const handleConfirmSendSchedule = () => {
    sendOutScheduleToStaff();
    setShowSendConfirm(false);
    setActionFeedback('Official schedule has been sent out to all staff! Availability timetable has been reset for the next cycle.');
    setTimeout(() => setActionFeedback(null), 6000);
  };

  const handleConfirmSundayClose = async () => {
    await executeSundayCloseAndTimesheetExport();
    setShowCloseConfirm(false);
    setActionFeedback('Sunday 22:00 Close executed: Weekly timesheet has been exported (.xlsx) and the timetable has been reset.');
    setTimeout(() => setActionFeedback(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-white hover:text-emerald-200 text-xs px-2 py-1 rounded-lg bg-emerald-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            Workforce Scheduling & Roster Planning
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manager Weekly Schedule
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Plan shifts, manage availability timetable lock, send out weekly schedule, and close Sunday 22:00 trade
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* View switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setActiveView('csv_grid')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'csv_grid'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>File 1 Grid</span>
            </button>
            <button
              onClick={() => setActiveView('calendar_board')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'calendar_board'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Day Columns</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAutoFillAvailable}
              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              title="Auto-fill open shifts from staff availability submissions"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Fill Available</span>
            </button>

            <button
              onClick={() => setShowWeeklyExportModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                setNewShiftStaffId('');
                setNewShiftDay('MON');
                setNewShiftType('lunch');
                setNewShiftStart('11:15');
                setNewShiftEndTime('14:30');
                setNewShiftMultipleDays([]);
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shift</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roster & Availability Lifecycle Control Center */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Step-by-step lifecycle banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Weekly Roster & Timetable Lifecycle Protocol</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <h2 className="text-base sm:text-lg font-bold text-white shrink-0">
                  Current Phase:
                </h2>
                {cyclePhase === 'OPEN' && (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    1. Submissions Open (till Sunday 14:30)
                  </span>
                )}
                {cyclePhase === 'LOCKED' && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    2. Timetable Locked (Sun 14:30 - Manager Scheduling)
                  </span>
                )}
                {cyclePhase === 'SCHEDULE_SENT' && (
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5" />
                    3. Schedule Sent Out & Timetable Reset
                  </span>
                )}
                {cyclePhase === 'CLOSED_EXPORTED' && (
                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5" />
                    4. Sunday 22:00 Close: Exported & Reset
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                {cyclePhase === 'OPEN' &&
                  'All staff can submit their availabilities for next week until Sunday 14:30. At 14:30, the timetable automatically locks.'}
                {cyclePhase === 'LOCKED' &&
                  'Between Sunday 14:30 and the time you send out the schedule, the timetable is locked. No staff can submit or change availability. Schedule shifts below, then send out to staff.'}
                {cyclePhase === 'SCHEDULE_SENT' &&
                  'Next week’s schedule has been sent out to all staff. Staff can now view their own schedule in "My Weekly Schedule". The availability table has been reset for the next cycle.'}
                {cyclePhase === 'CLOSED_EXPORTED' &&
                  'Sunday 22:00 trade close reached. The current week timesheet (.xlsx) has been exported and the timetable has been reset.'}
              </p>
            </div>

            {/* Lifecycle Quick Actions (Responsive 2-col on mobile, flex on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setShowSendConfirm(true)}
                className="w-full md:w-auto justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Send Out Schedule to Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                className="w-full md:w-auto justify-center px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sunday 22:00 Close & Export</span>
              </button>
            </div>
          </div>

          {/* 4-Step Visual Progress Bar (Horizontal Swipe on Mobile, Grid on Desktop) */}
          <div className="flex lg:grid lg:grid-cols-4 gap-2 mt-4 pt-3.5 border-t border-white/10 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
            <div
              className={`min-w-[210px] sm:min-w-[240px] lg:min-w-0 flex-1 shrink-0 snap-start p-3 rounded-xl border transition-all ${
                cyclePhase === 'OPEN'
                  ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold">Stage 1</span>
                {cyclePhase === 'OPEN' ? (
                  <span className="text-emerald-400 font-bold">Active Now</span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div className="text-white font-semibold">Staff Submit Availabilities</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Open till Sunday 14:30</div>
            </div>

            <div
              className={`min-w-[210px] sm:min-w-[240px] lg:min-w-0 flex-1 shrink-0 snap-start p-3 rounded-xl border transition-all ${
                cyclePhase === 'LOCKED'
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold">Stage 2</span>
                {cyclePhase === 'LOCKED' ? (
                  <span className="text-amber-400 font-bold">Active Now</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div className="text-white font-semibold">Timetable Locked</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Sun 14:30 – Manager Schedules</div>
            </div>

            <div
              className={`min-w-[210px] sm:min-w-[240px] lg:min-w-0 flex-1 shrink-0 snap-start p-3 rounded-xl border transition-all ${
                cyclePhase === 'SCHEDULE_SENT'
                  ? 'bg-indigo-500/20 border-indigo-400 text-white font-bold ring-1 ring-indigo-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold">Stage 3</span>
                {cyclePhase === 'SCHEDULE_SENT' ? (
                  <span className="text-indigo-300 font-bold">Active Now</span>
                ) : (
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div className="text-white font-semibold">Schedule Sent & Reset</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Staff view shifts • Table resets</div>
            </div>

            <div
              className={`min-w-[210px] sm:min-w-[240px] lg:min-w-0 flex-1 shrink-0 snap-start p-3 rounded-xl border transition-all ${
                cyclePhase === 'CLOSED_EXPORTED'
                  ? 'bg-purple-500/20 border-purple-400 text-white font-bold ring-1 ring-purple-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold">Stage 4</span>
                {cyclePhase === 'CLOSED_EXPORTED' ? (
                  <span className="text-purple-300 font-bold">Active Now</span>
                ) : (
                  <Archive className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div className="text-white font-semibold">Sunday 22:00 Export</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Timesheet exported (.xlsx) & reset</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 lg:hidden flex items-center justify-end gap-1 mt-1.5 font-medium">
            <span>Swipe for all 4 stages</span>
            <span className="text-indigo-300">→</span>
          </div>
        </div>
      </div>

      {/* Staff Availability Submissions Tracker Banner */}
      <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-indigo-950">
              Live Staff Availability Submissions Reflected:
            </div>
            <div className="text-indigo-900/80 font-medium">
              {Object.keys(availabilities).length} staff members have submitted weekly preferences. Staff showing with a green dot indicate they opted-in to work that shift.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(availabilities).map((staffId) => {
            const staff = staffUsers.find((s) => s.id === staffId);
            return (
              <span
                key={staffId}
                className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-indigo-950 font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {staff?.firstName || 'Staff'} (Submitted)
              </span>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: Full Employee Matrix matching File 1 attached CSV */}
      {activeView === 'csv_grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900">
                Staff Weekly Roster & Availability Grid (File 1 Architecture)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                Editable with No Limits
              </span>
            </div>

            {/* Search & Role Filter Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Filter employee..."
                  className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden w-36 sm:w-44"
                />
                {staffSearchQuery && (
                  <button
                    onClick={() => setStaffSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Positions</option>
                <option value="Wait Staff">Wait Staff</option>
                <option value="Bar Staff">Bar Staff</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Cashier">Cashier</option>
                <option value="Floor Manager">Floor Manager</option>
              </select>

              <button
                type="button"
                onClick={() => setInlineEditMode(!inlineEditMode)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                  inlineEditMode
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle inline time inputs in every table cell"
              >
                <Edit2 className="w-3 h-3" />
                <span>{inlineEditMode ? 'Inline Inputs Active' : 'Compact View'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-40 sticky left-0 bg-slate-100 z-20">
                    Employee
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      colSpan={2}
                      className="p-3 text-center border-r border-slate-200 min-w-[200px]"
                    >
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-black">{day}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCopySourceDay(day);
                            setShowCopyDayModal(true);
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline"
                          title={`Copy all ${day} shifts to another day`}
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy Day</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal uppercase flex justify-around mt-1">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Sun className="w-2.5 h-2.5 text-amber-600" /> Lunch (Flexible)
                        </span>
                        <span className="text-indigo-800 font-semibold flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5 text-indigo-600" /> Dinner (Flexible)
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* ROW: Open / Unassigned Shifts (Full Manager Visibility & Direct Assignment) */}
                <tr className="bg-amber-50/50 border-b-2 border-amber-200">
                  <td className="p-3 font-bold text-amber-950 border-r border-slate-200 sticky left-0 bg-amber-50/95 backdrop-blur-xs z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px]">
                        !
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <span>Open Slots</span>
                          <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[9px] font-black">
                            {shifts.filter((s) => !s.assignedStaffId).length}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-700 font-normal">
                          Unassigned Shifts
                        </div>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const openLunch = shifts.filter((s) => !s.assignedStaffId && s.day === day && s.shiftType === 'lunch');
                    const openDinner = shifts.filter((s) => !s.assignedStaffId && s.day === day && s.shiftType === 'dinner');

                    return (
                      <React.Fragment key={`open-${day}`}>
                        {/* Open Lunch cell */}
                        <td className="p-1.5 border-r border-slate-200 align-top bg-amber-50/30">
                          <div className="space-y-1">
                            {openLunch.map((shift) => (
                              <div key={shift.id} className="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-950 text-[10px] space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between font-mono font-bold">
                                  <span>{shift.startTime}{shift.endTime ? ` - ${shift.endTime}` : ''}</span>
                                  <button
                                    onClick={() => deleteShift(shift.id)}
                                    className="text-slate-400 hover:text-red-600 text-xs px-1 cursor-pointer"
                                    title="Delete open slot"
                                  >
                                    ×
                                  </button>
                                </div>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) assignStaffToShift(shift.id, e.target.value);
                                  }}
                                  className="w-full text-[10px] p-1 rounded border border-amber-200 bg-amber-50 font-medium"
                                >
                                  <option value="">Assign staff (by role)...</option>
                                  {getStaffByRoles(staffUsers).map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                      {group.items.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.firstName} ({u.position})
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleDirectAddShift(undefined, day, 'lunch', '11:15', '14:30')}
                              className="w-full text-[9px] font-bold text-amber-800/80 hover:text-amber-900 hover:bg-amber-100/60 py-0.5 rounded border border-dashed border-amber-300 text-center cursor-pointer transition-colors"
                              title="Add an open unassigned lunch slot"
                            >
                              + Open Lunch
                            </button>
                          </div>
                        </td>

                        {/* Open Dinner cell */}
                        <td className="p-1.5 border-r border-slate-200 align-top bg-indigo-50/20">
                          <div className="space-y-1">
                            {openDinner.map((shift) => (
                              <div key={shift.id} className="p-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-950 text-[10px] space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between font-mono font-bold">
                                  <span>{shift.startTime}{shift.endTime ? ` - ${shift.endTime}` : ''}</span>
                                  <button
                                    onClick={() => deleteShift(shift.id)}
                                    className="text-slate-400 hover:text-red-600 text-xs px-1 cursor-pointer"
                                    title="Delete open slot"
                                  >
                                    ×
                                  </button>
                                </div>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) assignStaffToShift(shift.id, e.target.value);
                                  }}
                                  className="w-full text-[10px] p-1 rounded border border-indigo-200 bg-indigo-50 font-medium"
                                >
                                  <option value="">Assign staff (by role)...</option>
                                  {getStaffByRoles(staffUsers).map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                      {group.items.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.firstName} ({u.position})
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleDirectAddShift(undefined, day, 'dinner', '16:45', '22:00')}
                              className="w-full text-[9px] font-bold text-indigo-800/80 hover:text-indigo-900 hover:bg-indigo-100/60 py-0.5 rounded border border-dashed border-indigo-300 text-center cursor-pointer transition-colors"
                              title="Add an open unassigned dinner slot"
                            >
                              + Open Dinner
                            </button>
                          </div>
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>

                {/* Staff Rows */}
                {staffUsers
                  .filter((staff) => {
                    const query = staffSearchQuery.trim().toLowerCase();
                    const matchesSearch =
                      !query ||
                      staff.firstName.toLowerCase().includes(query) ||
                      staff.lastName.toLowerCase().includes(query) ||
                      (staff.position && staff.position.toLowerCase().includes(query));
                    const matchesRole = roleFilter === 'ALL' || staff.position === roleFilter;
                    return matchesSearch && matchesRole;
                  })
                  .map((staff) => {
                    const staffShifts = shifts.filter((s) => s.assignedStaffId === staff.id);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Employee name column */}
                        <td className="p-3 font-bold text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                              {staff.firstName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate">{staff.firstName} {staff.lastName[0]}.</div>
                              <div className="text-[10px] text-slate-400 font-normal truncate">
                                {staff.position}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 7 Days: Lunch & Dinner for this employee */}
                        {DAYS.map((day) => {
                          const employeeLunchShifts = staffShifts.filter((s) => s.day === day && s.shiftType === 'lunch');
                          const employeeDinnerShifts = staffShifts.filter((s) => s.day === day && s.shiftType === 'dinner');

                          const isLunchAvail = checkStaffAvailable(staff.id, day, 'lunch');
                          const isDinnerAvail = checkStaffAvailable(staff.id, day, 'dinner');

                          return (
                            <React.Fragment key={day}>
                              {/* Lunch cell */}
                              <td className="p-1.5 border-r border-slate-100 align-top hover:bg-amber-50/20 transition-colors">
                                {employeeLunchShifts.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {employeeLunchShifts.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] space-y-1 group hover:border-amber-300 transition-all shadow-2xs"
                                      >
                                        {/* Direct In-Cell Time Editor (Active when inlineEditMode is enabled) */}
                                        {inlineEditMode ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <div className="flex items-center gap-0.5 font-mono text-[10px]">
                                                <input
                                                  type="text"
                                                  defaultValue={shift.startTime}
                                                  onBlur={(e) => {
                                                    if (e.target.value.trim() && e.target.value !== shift.startTime) {
                                                      handleInlineTimeChange(shift.id, e.target.value, shift.endTime);
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      (e.target as HTMLInputElement).blur();
                                                    }
                                                  }}
                                                  className="w-11 px-1 py-0.5 bg-white border border-amber-300 rounded text-center font-bold text-amber-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                                                  title="Edit start time (press Enter or blur to save)"
                                                />
                                                <span className="text-slate-400">-</span>
                                                <input
                                                  type="text"
                                                  defaultValue={shift.endTime || ''}
                                                  placeholder="End"
                                                  onBlur={(e) => {
                                                    if (e.target.value !== (shift.endTime || '')) {
                                                      handleInlineTimeChange(shift.id, shift.startTime, e.target.value);
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      (e.target as HTMLInputElement).blur();
                                                    }
                                                  }}
                                                  className="w-11 px-1 py-0.5 bg-white border border-amber-300 rounded text-center text-amber-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500 placeholder:text-slate-300"
                                                  title="Edit finish time (optional)"
                                                />
                                              </div>

                                              <div className="flex items-center gap-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => openEditModal(shift)}
                                                  className="text-amber-700 hover:text-amber-900 p-0.5 rounded cursor-pointer"
                                                  title="More settings & multi-day copy"
                                                >
                                                  <Edit2 className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => deleteShift(shift.id)}
                                                  className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                                  title="Delete shift"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Quick 1-click Preset Pills (Zero limits) */}
                                            <div className="flex flex-wrap gap-0.5">
                                              {['11:00', '11:15', '11:30', '12:00'].map((preset) => (
                                                <button
                                                  key={preset}
                                                  type="button"
                                                  onClick={() => handleInlineTimeChange(shift.id, preset, shift.endTime)}
                                                  className={`px-1 py-0.2 rounded text-[9px] font-mono cursor-pointer transition-colors ${
                                                    shift.startTime === preset
                                                      ? 'bg-amber-600 text-white font-bold'
                                                      : 'bg-white/80 hover:bg-amber-200/60 text-amber-900 border border-amber-200'
                                                  }`}
                                                  title={`Quick set start to ${preset}`}
                                                >
                                                  {preset}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="font-bold flex items-center justify-between gap-1">
                                            <button
                                              type="button"
                                              onClick={() => openEditModal(shift)}
                                              className="font-mono hover:text-amber-800 underline decoration-dotted flex items-center gap-1 cursor-pointer text-left flex-1"
                                              title="Click to edit shift timing, staff, or copy to other days"
                                            >
                                              <span>{shift.startTime}</span>
                                              {shift.endTime && (
                                                <span className="text-[10px] text-slate-500 font-normal"> - {shift.endTime}</span>
                                              )}
                                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-amber-700 shrink-0" />
                                            </button>
                                            <button
                                              onClick={() => unassignStaffFromShift(shift.id)}
                                              className="text-slate-400 hover:text-red-600 text-[11px] font-bold px-1 hover:bg-red-50 rounded"
                                              title="Unassign shift"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddForCell(staff.id, day, 'lunch')}
                                      className="w-full text-[9px] font-bold text-amber-700/70 hover:text-amber-900 hover:bg-amber-100/50 py-0.5 rounded transition-all text-center cursor-pointer"
                                      title="Add another split shift for this employee (no limits)"
                                    >
                                      + Add Split
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group relative min-h-[34px] flex flex-col items-center justify-center gap-1 py-1">
                                    {quickInputCell?.staffId === staff.id && quickInputCell.day === day && quickInputCell.shiftType === 'lunch' ? (
                                      <div className="w-full p-1 bg-white border border-amber-300 rounded-lg shadow-sm space-y-1">
                                        <div className="flex items-center gap-0.5">
                                          <input
                                            type="text"
                                            value={quickInputStart}
                                            onChange={(e) => setQuickInputStart(e.target.value)}
                                            placeholder="11:15"
                                            className="w-11 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded"
                                            autoFocus
                                          />
                                          <span className="text-[10px] text-slate-400">-</span>
                                          <input
                                            type="text"
                                            value={quickInputEnd}
                                            onChange={(e) => setQuickInputEnd(e.target.value)}
                                            placeholder="14:30"
                                            className="w-11 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded"
                                          />
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setQuickInputCell(null)}
                                            className="px-1 py-0.5 text-[9px] text-slate-500 hover:bg-slate-100 rounded"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDirectAddShift(staff.id, day, 'lunch', quickInputStart, quickInputEnd);
                                              setQuickInputCell(null);
                                            }}
                                            className="px-1.5 py-0.5 text-[9px] bg-amber-600 text-white font-bold rounded"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : isLunchAvail ? (
                                      <div className="flex items-center gap-1 w-full justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleQuickAddShift(staff.id, day, 'lunch')}
                                          className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                          title="Staff submitted availability. Click to schedule Lunch shift immediately"
                                        >
                                          <span>+ Avail</span>
                                        </button>
                                      </div>
                                    ) : (
                                      /* When the staff has not yet submitted their availability for this slot, the slot is completely empty */
                                      <div className="group relative min-h-[30px] flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickInputStart('11:15');
                                            setQuickInputEnd('14:30');
                                            setQuickInputCell({ staffId: staff.id, day, shiftType: 'lunch' });
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-300 hover:text-amber-800 hover:bg-amber-100/60 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                                          title="Staff has not submitted availability. Click to manually schedule override."
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Dinner cell */}
                              <td className="p-1.5 border-r border-slate-200 align-top bg-slate-50/30 hover:bg-indigo-50/20 transition-colors">
                                {employeeDinnerShifts.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {employeeDinnerShifts.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] space-y-1 group hover:border-indigo-300 transition-all shadow-2xs"
                                      >
                                        {/* Direct In-Cell Time Editor */}
                                        {inlineEditMode ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <div className="flex items-center gap-0.5 font-mono text-[10px]">
                                                <input
                                                  type="text"
                                                  defaultValue={shift.startTime}
                                                  onBlur={(e) => {
                                                    if (e.target.value.trim() && e.target.value !== shift.startTime) {
                                                      handleInlineTimeChange(shift.id, e.target.value, shift.endTime);
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      (e.target as HTMLInputElement).blur();
                                                    }
                                                  }}
                                                  className="w-11 px-1 py-0.5 bg-white border border-indigo-300 rounded text-center font-bold text-indigo-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                                  title="Edit start time (press Enter or blur to save)"
                                                />
                                                <span className="text-slate-400">-</span>
                                                <input
                                                  type="text"
                                                  defaultValue={shift.endTime || ''}
                                                  placeholder="End"
                                                  onBlur={(e) => {
                                                    if (e.target.value !== (shift.endTime || '')) {
                                                      handleInlineTimeChange(shift.id, shift.startTime, e.target.value);
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      (e.target as HTMLInputElement).blur();
                                                    }
                                                  }}
                                                  className="w-11 px-1 py-0.5 bg-white border border-indigo-300 rounded text-center text-indigo-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300"
                                                  title="Edit finish time (optional)"
                                                />
                                              </div>

                                              <div className="flex items-center gap-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => openEditModal(shift)}
                                                  className="text-indigo-700 hover:text-indigo-900 p-0.5 rounded cursor-pointer"
                                                  title="More settings & multi-day copy"
                                                >
                                                  <Edit2 className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => deleteShift(shift.id)}
                                                  className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                                  title="Delete shift"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Quick 1-click Preset Pills (Zero limits) */}
                                            <div className="flex flex-wrap gap-0.5">
                                              {['16:30', '16:45', '17:00', '17:30', '18:00'].map((preset) => (
                                                <button
                                                  key={preset}
                                                  type="button"
                                                  onClick={() => handleInlineTimeChange(shift.id, preset, shift.endTime)}
                                                  className={`px-1 py-0.2 rounded text-[9px] font-mono cursor-pointer transition-colors ${
                                                    shift.startTime === preset
                                                      ? 'bg-indigo-600 text-white font-bold'
                                                      : 'bg-white/80 hover:bg-indigo-200/60 text-indigo-900 border border-indigo-200'
                                                  }`}
                                                  title={`Quick set start to ${preset}`}
                                                >
                                                  {preset}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="font-bold flex items-center justify-between gap-1">
                                            <button
                                              type="button"
                                              onClick={() => openEditModal(shift)}
                                              className="font-mono hover:text-indigo-800 underline decoration-dotted flex items-center gap-1 cursor-pointer text-left flex-1"
                                              title="Click to edit shift timing, staff, or copy to other days"
                                            >
                                              <span>{shift.startTime}</span>
                                              {shift.endTime && (
                                                <span className="text-[10px] text-slate-500 font-normal"> - {shift.endTime}</span>
                                              )}
                                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-indigo-700 shrink-0" />
                                            </button>
                                            <button
                                              onClick={() => unassignStaffFromShift(shift.id)}
                                              className="text-slate-400 hover:text-red-600 text-[11px] font-bold px-1 hover:bg-red-50 rounded"
                                              title="Unassign shift"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddForCell(staff.id, day, 'dinner')}
                                      className="w-full text-[9px] font-bold text-indigo-700/70 hover:text-indigo-900 hover:bg-indigo-100/50 py-0.5 rounded transition-all text-center cursor-pointer"
                                      title="Add another split shift for this employee (no limits)"
                                    >
                                      + Add Split
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group relative min-h-[34px] flex flex-col items-center justify-center gap-1 py-1">
                                    {quickInputCell?.staffId === staff.id && quickInputCell.day === day && quickInputCell.shiftType === 'dinner' ? (
                                      <div className="w-full p-1 bg-white border border-indigo-300 rounded-lg shadow-sm space-y-1">
                                        <div className="flex items-center gap-0.5">
                                          <input
                                            type="text"
                                            value={quickInputStart}
                                            onChange={(e) => setQuickInputStart(e.target.value)}
                                            placeholder="16:45"
                                            className="w-11 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded"
                                            autoFocus
                                          />
                                          <span className="text-[10px] text-slate-400">-</span>
                                          <input
                                            type="text"
                                            value={quickInputEnd}
                                            onChange={(e) => setQuickInputEnd(e.target.value)}
                                            placeholder="22:00"
                                            className="w-11 px-1 py-0.5 text-[10px] font-mono border border-slate-300 rounded"
                                          />
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setQuickInputCell(null)}
                                            className="px-1 py-0.5 text-[9px] text-slate-500 hover:bg-slate-100 rounded"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDirectAddShift(staff.id, day, 'dinner', quickInputStart, quickInputEnd);
                                              setQuickInputCell(null);
                                            }}
                                            className="px-1.5 py-0.5 text-[9px] bg-indigo-600 text-white font-bold rounded"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : isDinnerAvail ? (
                                      <div className="flex items-center gap-1 w-full justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleQuickAddShift(staff.id, day, 'dinner')}
                                          className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                          title="Staff submitted availability. Click to schedule Dinner shift immediately"
                                        >
                                          <span>+ Avail</span>
                                        </button>
                                      </div>
                                    ) : (
                                      /* When the staff has not yet submitted their availability for this slot, the slot is completely empty */
                                      <div className="group relative min-h-[30px] flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickInputStart('16:45');
                                            setQuickInputEnd('22:00');
                                            setQuickInputCell({ staffId: staff.id, day, shiftType: 'dinner' });
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-300 hover:text-indigo-800 hover:bg-indigo-100/60 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                                          title="Staff has not submitted availability. Click to manually schedule override."
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Weekly Day Columns (Interactive Assignment Board) */}
      {activeView === 'calendar_board' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Interactive Shift Assigner: Assign Staff Based on Availability
              </span>
              <span className="text-xs text-slate-500">
                Lunch: 11:00am – 2:30pm • Dinner: 4:30pm – 10:00pm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                Total {shifts.length} slots scheduled
              </span>
            </div>
          </div>

          {/* Mobile Horizontal Day Quick Switcher (< md) */}
          <div className="md:hidden p-2.5 bg-slate-100/70 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setMobileDayFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                mobileDayFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All 7 Days ({shifts.length})
            </button>
            {DAYS.map((d) => {
              const count = shifts.filter((s) => s.day === d).length;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMobileDayFilter(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    mobileDayFilter === d
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{d}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    mobileDayFilter === d ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {DAYS.filter((day) => mobileDayFilter === 'ALL' || mobileDayFilter === day).map((day) => {
              const dayShifts = shifts.filter((s) => s.day === day);
              const lunchShifts = dayShifts.filter((s) => s.shiftType === 'lunch');
              const dinnerShifts = dayShifts.filter((s) => s.shiftType === 'dinner');

              return (
                <div key={day} className="flex flex-col bg-white min-h-[350px]">
                  {/* Day Header */}
                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between md:justify-center text-center">
                    <div>
                      <span className="font-bold text-sm text-slate-800">{day}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5 md:hidden">
                        ({dayShifts.length} shifts)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewShiftDay(day);
                        setShowAddModal(true);
                      }}
                      className="md:hidden text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-indigo-200 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      Add Shift
                    </button>
                  </div>

                  <div className="p-2.5 space-y-4 flex-1">
                    {/* Lunch shifts */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-600" /> Lunch
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono">Custom Hours</span>
                      </div>

                      {lunchShifts.map((shift) => (
                        <div key={shift.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 group hover:border-amber-300 transition-all">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 font-semibold">
                            <button
                              type="button"
                              onClick={() => openEditModal(shift)}
                              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer text-left"
                              title="Edit shift times & details"
                            >
                              <span>{shift.startTime}</span>
                              {shift.endTime && <span className="text-slate-400 font-normal"> - {shift.endTime}</span>}
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-sans">{shift.roleRequired}</span>
                              <button
                                type="button"
                                onClick={() => deleteShift(shift.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Remove shift slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Assign dropdown */}
                          <select
                            value={shift.assignedStaffId || ''}
                            onChange={(e) => handleAssignChange(shift.id, e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Unassigned --</option>
                            {getStaffByRoles(staffUsers).map((group) => (
                              <optgroup key={group.label} label={group.label}>
                                {group.items.map((u) => {
                                  const isAvail = checkStaffAvailable(u.id, day, 'lunch');
                                  return (
                                    <option key={u.id} value={u.id}>
                                      {isAvail ? <Check className="inline h-3 w-3 mr-0.5" /> : ''}{u.firstName} {u.lastName} ({u.position}) {isAvail ? '— Available' : ''}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setNewShiftStaffId('');
                          setNewShiftDay(day);
                          setNewShiftType('lunch');
                          setNewShiftStart('11:15');
                          setNewShiftEndTime('14:30');
                          setNewShiftMultipleDays([]);
                          setShowAddModal(true);
                        }}
                        className="w-full py-1 text-[11px] font-bold text-amber-800/80 hover:text-amber-900 bg-amber-50/50 hover:bg-amber-100/60 border border-dashed border-amber-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Lunch Shift</span>
                      </button>
                    </div>

                    {/* Dinner shifts */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-600" /> Dinner
                        </span>
                        <span className="text-[10px] text-indigo-700 font-mono">Custom Hours</span>
                      </div>

                      {dinnerShifts.map((shift) => (
                        <div key={shift.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 group hover:border-indigo-300 transition-all">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 font-semibold">
                            <button
                              type="button"
                              onClick={() => openEditModal(shift)}
                              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer text-left"
                              title="Edit shift times & details"
                            >
                              <span>{shift.startTime}</span>
                              {shift.endTime && <span className="text-slate-400 font-normal"> - {shift.endTime}</span>}
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-sans">{shift.roleRequired}</span>
                              <button
                                type="button"
                                onClick={() => deleteShift(shift.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Remove shift slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Assign dropdown */}
                          <select
                            value={shift.assignedStaffId || ''}
                            onChange={(e) => handleAssignChange(shift.id, e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Unassigned --</option>
                            {getStaffByRoles(staffUsers).map((group) => (
                              <optgroup key={group.label} label={group.label}>
                                {group.items.map((u) => {
                                  const isAvail = checkStaffAvailable(u.id, day, 'dinner');
                                  return (
                                    <option key={u.id} value={u.id}>
                                      {isAvail ? <Check className="inline h-3 w-3 mr-0.5" /> : ''}{u.firstName} {u.lastName} ({u.position}) {isAvail ? '— Available' : ''}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setNewShiftStaffId('');
                          setNewShiftDay(day);
                          setNewShiftType('dinner');
                          setNewShiftStart('16:45');
                          setNewShiftEndTime('22:00');
                          setNewShiftMultipleDays([]);
                          setShowAddModal(true);
                        }}
                        className="w-full py-1 text-[11px] font-bold text-indigo-900/80 hover:text-indigo-950 bg-indigo-50/50 hover:bg-indigo-100/60 border border-dashed border-indigo-200 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Dinner Shift</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Shift Modal (No Limits) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 text-left my-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  <span>Add Shift Slot (No Timing Limits)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set any custom hours, assign staff, and optionally duplicate across multiple days.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Primary Day:</label>
                  <select
                    value={newShiftDay}
                    onChange={(e) => setNewShiftDay(e.target.value as DayOfWeek)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Service Type:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewShiftType('lunch');
                        if (!newShiftStart) setNewShiftStart('11:15');
                        if (!newShiftEndTime) setNewShiftEndTime('14:30');
                      }}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        newShiftType === 'lunch'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Lunch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewShiftType('dinner');
                        if (newShiftStart === '11:15') setNewShiftStart('16:45');
                        if (newShiftEndTime === '14:30') setNewShiftEndTime('22:00');
                      }}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        newShiftType === 'dinner'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Dinner
                    </button>
                  </div>
                </div>
              </div>

              {/* Start & Finish Times (No Limits!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Start Time:</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Any hour / minute</span>
                  </label>
                  <input
                    type="text"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    placeholder="e.g. 11:15, 9:00, 16:45"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(newShiftType === 'lunch'
                      ? ['11:00', '11:15', '11:30', '11:45', '12:00', '12:30']
                      : ['16:30', '16:45', '17:00', '17:15', '17:30', '18:00']
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewShiftStart(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          newShiftStart === t
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Finish / End Time:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={newShiftEndTime}
                    onChange={(e) => setNewShiftEndTime(e.target.value)}
                    placeholder="e.g. 14:30, 15:00, 22:00"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(newShiftType === 'lunch'
                      ? ['14:30', '14:45', '15:00', '15:30']
                      : ['21:30', '22:00', '22:15', '22:30', '23:00']
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewShiftEndTime(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          newShiftEndTime === t
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assign Staff (Grouped & Viewable by Role) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-700">Assign Staff Member (View by Role):</label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 font-medium">Role:</span>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Roles
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('wait_staff')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'wait_staff'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Utensils className="inline h-3 w-3 mr-1" />Wait
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('bar_staff')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'bar_staff'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Wine className="inline h-3 w-3 mr-1" />Bar
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('kitchen')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'kitchen'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ChefHat className="inline h-3 w-3 mr-1" />Kitchen
                    </button>
                  </div>
                </div>

                <select
                  value={newShiftStaffId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setNewShiftStaffId(selectedId);
                    const staff = staffUsers.find((s) => s.id === selectedId);
                    if (staff && staff.position) {
                      setNewShiftRoleRequired(staff.position);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Leave Open / Unassigned Slot --</option>
                  {getStaffByRoles(staffUsers, modalRoleFilter).map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.items.map((u) => {
                        const isAvail = checkStaffAvailable(u.id, newShiftDay, newShiftType);
                        return (
                          <option key={u.id} value={u.id}>
                            {isAvail ? <Check className="inline h-3 w-3 mr-0.5" /> : ''}{u.firstName} {u.lastName} ({u.position}){isAvail ? ' — Available' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Role & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role / Position Required:</label>
                  <input
                    type="text"
                    value={newShiftRoleRequired}
                    onChange={(e) => setNewShiftRoleRequired(e.target.value)}
                    placeholder="e.g. Wait Staff, Bar Staff, Kitchen"
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Shift Notes (Optional):</label>
                  <input
                    type="text"
                    value={newShiftNotes}
                    onChange={(e) => setNewShiftNotes(e.target.value)}
                    placeholder="e.g. Section 1, Floor lead"
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Multi-Day Repeat */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Repeat Across Other Days (Optional):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = newShiftMultipleDays.includes(d);
                    const isPrimary = d === newShiftDay;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={isPrimary}
                        onClick={() => {
                          if (isSelected) {
                            setNewShiftMultipleDays((prev) => prev.filter((day) => day !== d));
                          } else {
                            setNewShiftMultipleDays((prev) => [...prev, d]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isPrimary
                            ? 'bg-slate-300 text-slate-600 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d} {isPrimary && '(Primary)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 transition-all cursor-pointer"
                >
                  Create Shift Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Modal (Full Unrestricted Editing: Start, End, Staff, Day, Multi-Day Duplicate) */}
      {editingShift && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 text-left my-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  <span>Edit Shift (No Limits)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full unrestricted manager access: customize hours, reassign staff, change day, or duplicate.
                </p>
              </div>
              <button
                onClick={() => setEditingShift(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Day of Week:</label>
                  <select
                    value={editDay}
                    onChange={(e) => setEditDay(e.target.value as DayOfWeek)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Shift Type:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditShiftType('lunch')}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        editShiftType === 'lunch'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Lunch
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditShiftType('dinner')}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        editShiftType === 'dinner'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Dinner
                    </button>
                  </div>
                </div>
              </div>

              {/* Start & Finish Times (No Limits!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Roster Start Time:</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Any hour / minute</span>
                  </label>
                  <input
                    type="text"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    placeholder="e.g. 11:15, 9:00, 16:45"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(editShiftType === 'lunch'
                      ? ['11:00', '11:15', '11:30', '11:45', '12:00', '12:30']
                      : ['16:30', '16:45', '17:00', '17:15', '17:30', '18:00']
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditStartTime(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          editStartTime === t
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Finish / End Time:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    placeholder="e.g. 14:30, 15:00, 22:00"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(editShiftType === 'lunch'
                      ? ['14:30', '14:45', '15:00', '15:30']
                      : ['21:30', '22:00', '22:15', '22:30', '23:00']
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditEndTime(t)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                          editEndTime === t
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reassign Staff (Grouped & Viewable by Role) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-700">Assign Staff Member (View by Role):</label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 font-medium">Role:</span>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Roles
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('wait_staff')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'wait_staff'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Utensils className="inline h-3 w-3 mr-1" />Wait
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('bar_staff')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'bar_staff'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Wine className="inline h-3 w-3 mr-1" />Bar
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRoleFilter('kitchen')}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                        modalRoleFilter === 'kitchen'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ChefHat className="inline h-3 w-3 mr-1" />Kitchen
                    </button>
                  </div>
                </div>

                <select
                  value={editStaffId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setEditStaffId(selectedId);
                    const staff = staffUsers.find((s) => s.id === selectedId);
                    if (staff && staff.position) {
                      setEditRoleRequired(staff.position);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Leave Open / Unassigned --</option>
                  {getStaffByRoles(staffUsers, modalRoleFilter).map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.items.map((u) => {
                        const isAvail = checkStaffAvailable(u.id, editDay, editShiftType);
                        return (
                          <option key={u.id} value={u.id}>
                            {isAvail ? <Check className="inline h-3 w-3 mr-0.5" /> : ''}{u.firstName} {u.lastName} ({u.position}){isAvail ? ' — Available' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Role & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role / Position Required:</label>
                  <input
                    type="text"
                    value={editRoleRequired}
                    onChange={(e) => setEditRoleRequired(e.target.value)}
                    placeholder="e.g. Wait Staff, Bar Staff, Kitchen"
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Shift Notes:</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Section 1, Floor lead"
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Duplicate / Copy to Other Days */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Copy This Shift To Other Days:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = copyToDays.includes(d);
                    const isCurrent = d === editDay;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          if (isSelected) {
                            setCopyToDays((prev) => prev.filter((day) => day !== d));
                          } else {
                            setCopyToDays((prev) => [...prev, d]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-300 text-slate-600 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d} {isCurrent && '(Current)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    deleteShift(editingShift.id);
                    setEditingShift(null);
                  }}
                  className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Shift</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingShift(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 font-bold rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Timesheet Excel Export Modal */}
      <WeeklyTimesheetExportModal
        isOpen={showWeeklyExportModal}
        onClose={() => setShowWeeklyExportModal(false)}
      />

      {/* Confirmation Modal: Send Out Schedule to Staff */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <Send className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Send Out Schedule to All Staff
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  On Sunday, after all shifts for next week have been scheduled by the manager, sending out this schedule will publish it to all staff.
                </p>
              </div>
            </div>

            {/* Shift Breakdown Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Roster Readiness Summary:</span>
                <span className="text-[11px] font-mono text-indigo-600 font-bold">
                  {assignedShiftsCount} / {totalShiftsCount} Shifts Assigned
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Staff Rostered</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{rosteredStaffCount} Team Members</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Unassigned Slots</div>
                  <div className={`text-base font-black mt-0.5 ${unassignedShiftsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {unassignedShiftsCount} {unassignedShiftsCount === 0 ? '(Full Coverage)' : 'Open'}
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Notice */}
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Actions taken when sent:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                <li><strong>Staff view schedule</strong>: All staff will immediately have the ability to view their own assigned shifts in <em>My Weekly Schedule</em>.</li>
                <li><strong>Timetable reset</strong>: The weekly availability timetable will be reset for the upcoming cycle.</li>
                <li><strong>Announcement</strong>: A notification is dispatched to all staff.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSendConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendSchedule}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Send Out Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Copy Day Schedule (No Limits) */}
      {showCopyDayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Copy Day Schedule (No Limits)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duplicate all scheduled shifts from one day to another.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCopyDayModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Source Day (Copy From):</label>
                  <select
                    value={copySourceDay}
                    onChange={(e) => setCopySourceDay(e.target.value as DayOfWeek)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                  >
                    {DAYS.map((d) => {
                      const count = shifts.filter((s) => s.day === d).length;
                      return (
                        <option key={d} value={d}>
                          {d} ({count} shifts)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Day (Paste To):</label>
                  <select
                    value={copyTargetDay}
                    onChange={(e) => setCopyTargetDay(e.target.value as DayOfWeek)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d} disabled={d === copySourceDay}>
                        {d} {d === copySourceDay ? '(Source)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">Summary:</div>
                <p>
                  Will copy all {shifts.filter((s) => s.day === copySourceDay).length} shifts from{' '}
                  <span className="font-bold text-indigo-700">{copySourceDay}</span> to{' '}
                  <span className="font-bold text-indigo-700">{copyTargetDay}</span>, preserving all start times, finish times, and staff assignments.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCopyDayModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyDayRoster(copySourceDay, copyTargetDay)}
                  className="px-5 py-2 font-bold rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Roster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Sunday 22:00 Close & Export Timesheet */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Sunday 22:00 Weekly Close & Export
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  On Sunday at 22:00, the restaurant trade closes, the current week timesheet is exported, and the timetable is reset.
                </p>
              </div>
            </div>

            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-purple-900">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                What happens during Sunday 22:00 close:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                <li><strong>Automatic Excel Export</strong>: Downloads the official timesheet formatted like the attachment (2 rows per employee name, start &amp; finish times, and @ Malaya Corner).</li>
                <li><strong>Timetable Reset</strong>: The weekly availability timetable will be reset for the upcoming week.</li>
                <li><strong>Records Archived</strong>: Completed timesheet punches are locked and approved.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSundayClose}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Timesheet (.xlsx) & Reset Timetable</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
