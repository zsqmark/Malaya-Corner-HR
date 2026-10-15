import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLogEntry, AuditActionType, AuditSeverity } from '../../types';
import { exportAuditLogsToCSV } from '../../utils/auditData';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  LogIn,
  FileSpreadsheet,
  User,
  Terminal,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Trash2,
  KeyRound,
} from 'lucide-react';

export const ManagerAuditLog: React.FC = () => {
  const { auditLogs, resetAuditLogsToDefaults, clearAuditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Pagination state (Max 50 records per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const RECORDS_PER_PAGE = 50;

  // Statistics
  const totalLogs = auditLogs.length;
  const pinOverrideCount = auditLogs.filter(
    (l) => l.actionType === 'pin_override' || l.actionType === 'pin_auth'
  ).length;
  const scheduleEventsCount = auditLogs.filter(
    (l) => l.actionType === 'schedule_update' || l.actionType === 'schedule_send' || l.actionType === 'availability_submit'
  ).length;
  const exportEventsCount = auditLogs.filter(
    (l) => l.actionType === 'timesheet_export' || l.actionType === 'sunday_close'
  ).length;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          log.title.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.actorName.toLowerCase().includes(query) ||
          (log.terminal && log.terminal.toLowerCase().includes(query)) ||
          log.actionType.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // Action type filter
      if (selectedActionType !== 'all') {
        if (selectedActionType === 'pin') {
          if (log.actionType !== 'pin_override' && log.actionType !== 'pin_auth') return false;
        } else if (selectedActionType === 'schedule') {
          if (log.actionType !== 'schedule_update' && log.actionType !== 'schedule_send') return false;
        } else if (selectedActionType === 'availability') {
          if (log.actionType !== 'availability_submit') return false;
        } else if (selectedActionType === 'export') {
          if (log.actionType !== 'timesheet_export' && log.actionType !== 'sunday_close') return false;
        } else if (selectedActionType === 'timesheet_edit') {
          if (log.actionType !== 'timesheet_edit' && log.actionType !== 'timesheet_approval') return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'all') {
        if (selectedSeverity === 'warning_critical') {
          if (log.severity !== 'warning' && log.severity !== 'critical') return false;
        } else if (log.severity !== selectedSeverity) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedActionType, selectedSeverity]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedActionType, selectedSeverity]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / RECORDS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Paginated records (Max 50 records per page)
  const paginatedLogs = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * RECORDS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredLogs, validCurrentPage]);

  const handleExportCSV = () => {
    exportAuditLogsToCSV(filteredLogs);
    setExportFeedback(`Exported ${filteredLogs.length} audit records to CSV.`);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'pin_override':
        return {
          label: 'PIN Override',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: KeyRound,
        };
      case 'pin_auth':
        return {
          label: 'PIN Auth',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: KeyRound,
        };
      case 'availability_submit':
        return {
          label: 'Availability',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: Calendar,
        };
      case 'schedule_update':
        return {
          label: 'Roster Update',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: Calendar,
        };
      case 'schedule_send':
        return {
          label: 'Schedule Sent',
          bg: 'bg-indigo-600 text-white border-indigo-700',
          icon: CheckCircle2,
        };
      case 'timesheet_export':
        return {
          label: 'Timesheet Export',
          bg: 'bg-emerald-600 text-white border-emerald-700',
          icon: FileSpreadsheet,
        };
      case 'sunday_close':
        return {
          label: 'Sunday 22:00 Close',
          bg: 'bg-indigo-600 text-white border-indigo-700',
          icon: Clock,
        };
      case 'timesheet_approval':
        return {
          label: 'Punch Approved',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: CheckCircle2,
        };
      case 'timesheet_edit':
        return {
          label: 'Punch Corrected',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
        };
      case 'terminal_auth':
        return {
          label: 'Terminal Authorized',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: ShieldCheck,
        };
      case 'terminal_deauth':
        return {
          label: 'Terminal Revoked',
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: ShieldAlert,
        };
      default:
        return {
          label: actionType,
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: Info,
        };
    }
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          badge: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-600 animate-pulse',
        };
      case 'warning':
        return {
          label: 'Warning',
          badge: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
          dot: 'bg-amber-500',
        };
      case 'success':
        return {
          label: 'Success',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'info':
      default:
        return {
          label: 'Info',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {exportFeedback && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-white hover:text-emerald-200 text-xs px-2 py-1 rounded-lg bg-emerald-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-7 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Operations &amp; Security Compliance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Manager Audit Trail &amp; Accountability Log</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Immutable chronological logging of restaurant operational events (retained up to 1 month, max 50 records per page): weekly staff availability submissions, roster allocations, payroll timesheet exports, and manual security PIN overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Export Log (.csv)</span>
          </button>

          <button
            type="button"
            onClick={clearAuditLogs}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Clear all recorded audit trail events"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span>Clear Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Events</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {totalLogs}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chronologically logged</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>PIN Overrides</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {pinOverrideCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Manual overrides &amp; authed logins</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Roster &amp; Avail</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-2">
            {scheduleEventsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Submissions &amp; shift changes</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Timesheet Exports</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {exportEventsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Excel .xlsx &amp; Sunday closures</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by employee, event title, details, or terminal..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Severity:
            </span>
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedSeverity('warning_critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'warning_critical'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warnings &amp; Critical</span>
            </button>
            <button
              onClick={() => setSelectedSeverity('success')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSeverity === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setSelectedSeverity('info')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSeverity === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Info
            </button>
          </div>
        </div>

        {/* Action Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 border-t border-slate-100 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Action:
          </span>
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'pin', label: 'PIN & Security Overrides' },
            { id: 'availability', label: 'Availability Submits' },
            { id: 'schedule', label: 'Roster Updates & Sends' },
            { id: 'export', label: 'Timesheet Exports & Close' },
            { id: 'timesheet_edit', label: 'Timesheet Edits & Approvals' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedActionType(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                selectedActionType === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {(selectedActionType !== 'all' || selectedSeverity !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedActionType('all');
                setSelectedSeverity('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:underline font-bold px-2 py-1 ml-auto shrink-0 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">
              Recorded Audit Events
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
              Showing {filteredLogs.length > 0 ? (validCurrentPage - 1) * RECORDS_PER_PAGE + 1 : 0}–{Math.min(validCurrentPage * RECORDS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[10px]">
              Max 50 / page
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]" title="Records older than 1 month are automatically removed">
              1-Month Retention
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Page <strong className="text-slate-800">{validCurrentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <div className="text-sm font-bold text-slate-700">No matching audit logs found</div>
            <div className="text-xs max-w-sm mx-auto text-slate-400">
              Try adjusting your search criteria or resetting filters to view all recorded actions.
            </div>
            <button
              onClick={() => {
                setSelectedActionType('all');
                setSelectedSeverity('all');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedLogs.map((log) => {
              const actionBadge = getActionBadge(log.actionType);
              const severityBadge = getSeverityBadge(log.severity);
              const ActionIcon = actionBadge.icon;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left block: timestamp & title */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                      <ActionIcon className="w-4 h-4 text-slate-700" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${severityBadge.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${severityBadge.dot}`} />
                          <span>{severityBadge.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {log.displayTime}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                        {log.title}
                      </div>

                      <div className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {log.details}
                      </div>
                    </div>
                  </div>

                  {/* Right block: Actor & Device */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-11 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end font-semibold text-slate-900 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.actorName}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400 font-mono mt-0.5">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        <span>{log.terminal || 'Sunnybank Console'}</span>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{(validCurrentPage - 1) * RECORDS_PER_PAGE + 1}</strong> to{' '}
              <strong className="text-slate-900">
                {Math.min(validCurrentPage * RECORDS_PER_PAGE, filteredLogs.length)}
              </strong>{' '}
              of <strong className="text-slate-900">{filteredLogs.length}</strong> records (Max 50 per page)
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - validCurrentPage) <= 2
                    );
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            page === validCurrentPage
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(selectedLog.actionType).bg}`}>
                    {getActionBadge(selectedLog.actionType).label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(selectedLog.severity).badge}`}>
                    {selectedLog.severity.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedLog.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Description
                </div>
                <div className="text-slate-800 leading-relaxed font-medium">
                  {selectedLog.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Actor</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedLog.actorName}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{selectedLog.actorRole}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Time &amp; Terminal</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedLog.displayTime}</div>
                  <div className="text-[10px] text-slate-500">{selectedLog.terminal || 'Sunnybank POS Terminal'}</div>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Metadata Payload
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-100">
                <span>Event ID: <strong className="font-mono text-slate-600">{selectedLog.id}</strong></span>
                <span>ISO: <strong className="font-mono text-slate-600">{selectedLog.timestamp}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
