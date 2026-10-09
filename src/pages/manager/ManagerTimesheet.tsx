import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClockRecord } from '../../types';
import { roundTimeTo15Minutes } from '../../utils/shiftTimes';
import { WeeklyTimesheetExportModal } from '../../components/timesheet/WeeklyTimesheetExportModal';
import { downloadWeeklyTimesheetExcel } from '../../utils/timesheetExport';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCheck,
  Coffee,
  DollarSign,
  Edit2,
  X,
  Save,
  Sparkles,
  Zap,
  RefreshCw,
  Sun,
  Moon,
  FileText,
  Calendar,
} from 'lucide-react';

export const ManagerTimesheet: React.FC = () => {
  const {
    clockRecords,
    approveTimesheet,
    updateClockRecord,
    seedWeeklyTimesheetClockRecords,
    staffUsers,
    shifts,
    executeSundayCloseAndTimesheetExport,
    lastTimesheetExportedAt,
    cyclePhase,
    addAuditLog,
  } = useApp();

  const [showWeeklyExportModal, setShowWeeklyExportModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<ClockRecord | null>(null);
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');
  const [editBreakMinutes, setEditBreakMinutes] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isGeneratingPunches, setIsGeneratingPunches] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleSimulateWeeklyPunches = async () => {
    setIsGeneratingPunches(true);
    try {
      await seedWeeklyTimesheetClockRecords();
      setFeedbackMsg('Successfully generated 60 complete weekly clock in & clock out punches across Mon–Sun! You can now simulate or export the weekly timesheet.');
      setTimeout(() => setFeedbackMsg(null), 6000);
    } finally {
      setIsGeneratingPunches(false);
    }
  };

  const openEditModal = (rec: ClockRecord) => {
    setEditingRecord(rec);
    setEditInTime(rec.clockInTime);
    setEditOutTime(rec.clockOutTime || '');
    setEditBreakMinutes(rec.breakMinutes || 0);
    setEditNotes(rec.notes || '');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    if (!editInTime) {
      setEditError('Clock-in time is required.');
      return;
    }

    // Auto-round both times to nearest 15 minutes (:00, :15, :30, :45)
    const roundedIn = roundTimeTo15Minutes(editInTime);
    const roundedOut = editOutTime && editOutTime.trim() ? roundTimeTo15Minutes(editOutTime.trim()) : undefined;

    const updatesObj: Partial<ClockRecord> = {
      clockInTime: roundedIn,
      breakMinutes: Number(editBreakMinutes) || 0,
      notes: editNotes,
    };
    if (roundedOut) {
      updatesObj.clockOutTime = roundedOut;
    }

    updateClockRecord(editingRecord.id, updatesObj);

    setEditingRecord(null);
  };

  const filteredRecords = clockRecords.filter((rec) => {
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
    if (
      searchQuery &&
      !rec.staffName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !rec.position.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Calculate totals
  const totalHours = clockRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  const pendingApprovals = clockRecords.filter((r) => r.status === 'completed').length;

  const handleApproveAll = () => {
    clockRecords.forEach((r) => {
      if (r.status === 'completed') {
        approveTimesheet(r.id);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Employee Name', 'Position', 'Date', 'Shift', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
    const rows = clockRecords.map((r) => [
      r.id,
      r.staffName,
      r.position,
      r.date,
      r.shiftType,
      r.clockInTime,
      r.clockOutTime || 'Active',
      r.totalHours || 0,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Malaya_Corner_Timesheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog({
      actionType: 'timesheet_export',
      title: 'Clock Audit Records Exported (.csv)',
      details: `Manager exported raw timeclock audit CSV containing ${clockRecords.length} records.`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'info',
      terminal: 'Manager Console',
      metadata: { count: clockRecords.length, format: 'csv' },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            Time & Attendance Tracking
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Timesheet & Punch Auditing
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time synchronization with staff time clock punches, continuous shift hours, and manager approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isGeneratingPunches}
            onClick={handleSimulateWeeklyPunches}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Generate a full week of clock in & clock out punches across all staff"
          >
            {isGeneratingPunches ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Zap className="w-4 h-4 text-indigo-600" />
            )}
            <span>{isGeneratingPunches ? 'Generating...' : 'Simulate Weekly Punches'}</span>
          </button>

          {pendingApprovals > 0 && (
            <button
              onClick={handleApproveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Approve All Pending ({pendingApprovals})
            </button>
          )}

          <button
            onClick={() => setShowWeeklyExportModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Weekly Timesheet (Excel)
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Download raw audit clock logs as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Audit CSV
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-white hover:text-emerald-200 text-xs px-2 py-1 rounded-lg bg-emerald-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Weekly Working Hours Feature Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-emerald-800/40 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0 mt-0.5 sm:mt-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Weekly Working Hours Spreadsheet Export
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
                Excel .xlsx
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          {/* On mobile: Primary Preview button on top, two quick action buttons side-by-side below */}
          <button
            onClick={() => setShowWeeklyExportModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer order-first sm:order-last"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Preview &amp; Customize</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              onClick={() => executeSundayCloseAndTimesheetExport()}
              className="px-3 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Export timesheet and reset weekly timetable (Sunday 22:00 Protocol)"
            >
              <Clock className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span className="truncate">Sunday 22:00 Close</span>
            </button>

            <button
              onClick={() => {
                downloadWeeklyTimesheetExcel({
                  weekDateRangeStr: '27/07/2026 - 02/08/2026',
                  mode: 'picture_reference',
                  staffUsers,
                  shifts,
                  clockRecords,
                });
                addAuditLog({
                  actionType: 'timesheet_export',
                  title: 'Weekly Working Hours Spreadsheet Exported (.xlsx)',
                  details: 'Manager downloaded official Malaya Corner weekly timesheet spreadsheet (.xlsx) with 7-day columns and start/finish punches.',
                  actorName: 'Mark Zhang (Manager)',
                  actorRole: 'manager',
                  severity: 'info',
                  terminal: 'Manager Console',
                  metadata: { fileFormat: 'xlsx', weekRange: '27/07/2026 - 02/08/2026' },
                });
              }}
              className="px-3 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Quick download timesheet (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">Quick Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Logged Hours</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalHours.toFixed(2)} hrs</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Across all completed shifts</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Sign-Off</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{pendingApprovals} Records</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Verification required</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Punches ({clockRecords.length})
          </button>
          <button
            onClick={() => setFilterStatus('clocked_in')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'clocked_in'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active Now ({clockRecords.filter((r) => r.status === 'clocked_in').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Approval ({pendingApprovals})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'approved'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Timesheet Records Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile View: High-density Punch Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/40">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((rec) => {
              const initials = rec.staffName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const isLunch = rec.shiftType === 'lunch';
              const borderAccent = isLunch ? 'border-l-amber-400' : 'border-l-indigo-500';

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 sm:p-4 space-y-3 bg-white border-l-4 ${borderAccent} transition-all hover:bg-slate-50/60 shadow-2xs`}
                >
                  {/* Top Bar: Avatar + Staff Info + Badges */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                          isLunch
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <span>{rec.staffName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-medium text-slate-600">{rec.position}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {rec.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isLunch
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {isLunch ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-indigo-600" />}
                        {rec.shiftType}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          rec.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : rec.status === 'completed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : rec.status === 'on_break'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {rec.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {rec.status === 'clocked_in' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                        {rec.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Clock In / Out Times Dashboard */}
                  <div className="grid grid-cols-3 gap-2 bg-gradient-to-b from-slate-50 to-slate-100/60 p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="flex flex-col items-center justify-center p-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Clock In
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                        {rec.clockInTime}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1 border-x border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Clock Out
                      </span>
                      <span className="font-mono font-semibold text-sm mt-0.5">
                        {rec.clockOutTime ? (
                          <span className="text-slate-800">{rec.clockOutTime}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        Total
                      </span>
                      <span className="font-mono font-extrabold text-sm text-indigo-600 mt-0.5">
                        {rec.totalHours ? `${rec.totalHours} hrs` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Notes & Break Pills */}
                  {(rec.notes || (rec.breakMinutes !== undefined && rec.breakMinutes > 0)) && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {rec.breakMinutes !== undefined && rec.breakMinutes > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          <Coffee className="w-3 h-3 text-slate-400" />
                          Break: {rec.breakMinutes}m
                        </span>
                      )}
                      {rec.notes && (
                        <div className="flex items-center gap-1 text-slate-600 bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/80 text-[11px] truncate flex-1 min-w-0">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons & Pay Info */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">
                      {rec.hourlyRate && rec.totalHours ? (
                        <span className="font-semibold text-slate-700">
                          ${(rec.hourlyRate * rec.totalHours).toFixed(2)}
                          <span className="text-slate-400 font-normal text-[10px] ml-1">
                            (${rec.hourlyRate}/hr)
                          </span>
                        </span>
                      ) : (
                        rec.hourlyRate ? <span className="text-slate-400">${rec.hourlyRate}/hr</span> : null
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(rec)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {rec.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => approveTimesheet(rec.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-emerald-200 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rec.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No timesheet records match filter.
            </div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Shift</th>
                <th className="p-3.5">Clock In</th>
                <th className="p-3.5">Clock Out</th>
                <th className="p-3.5">Hours</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{rec.staffName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{rec.position}</div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono">{rec.date}</td>
                      <td className="p-3.5">
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {rec.shiftType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">{rec.clockInTime}</td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {rec.clockOutTime ? (
                          rec.clockOutTime
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">
                        {rec.totalHours ? `${rec.totalHours}h` : '--'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            rec.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'completed'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'on_break'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {rec.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Punch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {rec.status === 'completed' && (
                            <button
                              onClick={() => approveTimesheet(rec.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {rec.status === 'approved' && (
                            <span className="text-[11px] text-slate-400 font-medium">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                    No timesheet records matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Punch Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Clock Punch</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingRecord.staffName} • {editingRecord.date} ({editingRecord.shiftType.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Clock In Time</label>
                  <input
                    type="time"
                    step="900"
                    value={editInTime}
                    onChange={(e) => setEditInTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Clock Out Time</label>
                  <input
                    type="time"
                    step="900"
                    value={editOutTime}
                    onChange={(e) => setEditOutTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Break Minutes</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={editBreakMinutes}
                  onChange={(e) => setEditBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Manager Audit Note</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for adjustment (e.g. forgot to punch, system correction)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
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
    </div>
  );
};
