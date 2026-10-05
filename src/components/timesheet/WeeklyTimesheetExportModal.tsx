import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  Layers,
  Printer,
  Info,
  Check,
  Zap,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek } from '../../types';
import {
  DAYS_OF_WEEK,
  compileStaffTimesheetRows,
  downloadWeeklyTimesheetExcel,
  PICTURE_REFERENCE_DATA,
  StaffWeeklyTimesheetRow,
} from '../../utils/timesheetExport';

interface WeeklyTimesheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateRange?: string;
}

export const WeeklyTimesheetExportModal: React.FC<WeeklyTimesheetExportModalProps> = ({
  isOpen,
  onClose,
  defaultDateRange = '07/09/2026 - 13/09/2026',
}) => {
  const { staffUsers, shifts, clockRecords, seedWeeklyTimesheetClockRecords } = useApp();

  const [dateRangeStr, setDateRangeStr] = useState(defaultDateRange);
  const [exportMode, setExportMode] = useState<
    'picture_reference' | 'hybrid' | 'clock_records' | 'shifts' | 'blank_template'
  >('hybrid');
  const [includeEmptyRows, setIncludeEmptyRows] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleSimulatePunches = async () => {
    setIsSeeding(true);
    try {
      await seedWeeklyTimesheetClockRecords();
      setDateRangeStr('07/09/2026 - 13/09/2026');
      setExportMode('hybrid');
      setSeedSuccessMsg('Simulated weekly punches loaded successfully across all staff!');
      setTimeout(() => setSeedSuccessMsg(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  // Compute preview rows based on active exportMode
  const previewRows: StaffWeeklyTimesheetRow[] = useMemo(() => {
    if (exportMode === 'blank_template') {
      return [];
    }
    if (exportMode === 'picture_reference') {
      return PICTURE_REFERENCE_DATA;
    }
    return compileStaffTimesheetRows(staffUsers, shifts, clockRecords, exportMode);
  }, [exportMode, staffUsers, shifts, clockRecords]);

  if (!isOpen) return null;

  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      await downloadWeeklyTimesheetExcel({
        weekDateRangeStr: dateRangeStr,
        title: 'Weekly Working Hours',
        footer: '@ Malaya Corner',
        staffUsers,
        shifts,
        clockRecords,
        mode: exportMode === 'blank_template' ? 'hybrid' : exportMode,
        includeEmptyRowsCount: exportMode === 'blank_template' ? 16 : includeEmptyRows ? 8 : 0,
      });
    } catch (err) {
      console.error('Failed to export Excel file:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // Generate CSV in the exact same format
    const headerRow1 = [
      '',
      'MON', '',
      'TUE', '',
      'WED', '',
      'THU', '',
      'FRI', '',
      'SAT', '',
      'SUN', '',
    ];
    const headerRow2 = [
      '',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
    ];

    const dataRows: string[][] = [];
    previewRows.forEach((r) => {
      // Row 1: Shift 1
      const row1 = [r.staffName];
      DAYS_OF_WEEK.forEach((day) => {
        const p1 = r.days[day]?.[0];
        row1.push(p1?.start || '', p1?.finish || '');
      });
      dataRows.push(row1);

      // Row 2: Shift 2 (name column blank as name spans both rows)
      const row2 = [''];
      DAYS_OF_WEEK.forEach((day) => {
        const p2 = r.days[day]?.[1];
        row2.push(p2?.start || '', p2?.finish || '');
      });
      dataRows.push(row2);
    });

    const csvLines = [
      `"${dateRangeStr}",,,,,"Weekly Working Hours",,,,,,,,`,
      '',
      headerRow1.map((c) => `"${c}"`).join(','),
      headerRow2.map((c) => `"${c}"`).join(','),
      ...dataRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      '',
      ',,,,,,,,,,,,,,"@ Malaya Corner"',
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Malaya_Corner_Weekly_Working_Hours_${dateRangeStr.replace(/[\/\s]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-timesheet, #printable-timesheet * {
            visibility: visible;
          }
          #printable-timesheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Weekly Timesheet Export</h2>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Layout as in Attachment
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Exact physical layout modeled after Malaya Corner's handwritten weekly roster &amp; timesheet sheet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Punch Simulation & Status Bar */}
        <div className="bg-indigo-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-indigo-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-indigo-800 text-indigo-200 border border-indigo-700">
              <Zap className="w-3 h-3 text-amber-400" />
              {clockRecords.length} Clock Records in System
            </span>
            <span className="text-slate-300 hidden sm:inline text-[11px]">
              Full week simulation covers Mon–Sun (07/09 - 13/09) with lunch &amp; dinner punches for all staff.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {seedSuccessMsg && (
              <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px] animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {seedSuccessMsg}
              </span>
            )}
            <button
              type="button"
              disabled={isSeeding}
              onClick={handleSimulatePunches}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all text-xs cursor-pointer disabled:opacity-50"
              title="Populate complete week of clock in and clock out punches"
            >
              {isSeeding ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSeeding ? 'Populating...' : 'Generate / Sync Simulated Records'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Preset / Mode */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Sheet Content Source:
            </label>
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="picture_reference">
                Attached Reference Sheets (27/07 - 02/08 • 13 Staff)
              </option>
              <option value="hybrid">
                Live App Sync (Actual Clock Punches + Published Roster)
              </option>
              <option value="shifts">Published Roster Schedule Only</option>
              <option value="clock_records">Clock Punches (Actual Time Logged) Only</option>
              <option value="blank_template">Blank Printable Template Grid</option>
            </select>
          </div>

          {/* Date Range String */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Week Date Range:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dateRangeStr}
                onChange={(e) => setDateRangeStr(e.target.value)}
                placeholder="27/07/2026 - 02/08/2026"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setDateRangeStr('27/07/2026 - 02/08/2026')}
                title="Reset to 27/07/2026 - 02/08/2026 (from attached pictures)"
                className="px-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer"
              >
                27/07
              </button>
              <button
                type="button"
                onClick={() => setDateRangeStr('07/09/2026 - 13/09/2026')}
                title="Use Current Week"
                className="px-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer"
              >
                07/09
              </button>
            </div>
          </div>

          {/* Extra Options */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={includeEmptyRows}
                onChange={(e) => setIncludeEmptyRows(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span>Include Blank Template Grid Rows (matches printed sheet)</span>
            </label>
            <div className="text-[11px] text-slate-500">
              Preserves 8 empty rows at bottom for manual additions and notes.
            </div>
          </div>
        </div>

        {/* Live Visual Preview Section */}
        <div className="p-4 sm:p-6 flex-1 overflow-auto bg-slate-100 flex justify-center">
          {/* Printable Container matching physical paper */}
          <div
            id="printable-timesheet"
            ref={printAreaRef}
            className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm w-full max-w-[960px] text-slate-900"
          >
            {/* Top Line: Date Range on Left, Title Centered */}
            <div className="relative mb-3 flex items-center justify-between">
              <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {dateRangeStr}
              </div>
              <div className="absolute inset-x-0 text-center pointer-events-none">
                <h1 className="inline-block text-lg sm:text-xl font-bold text-slate-900 tracking-wide underline underline-offset-4 decoration-1">
                  Weekly Working Hours
                </h1>
              </div>
              <div className="text-xs text-transparent select-none">
                {dateRangeStr}
              </div>
            </div>

            {/* The Grid Table with authentic crisp black borders */}
            <div className="border border-slate-950 rounded-none overflow-hidden text-[11px] sm:text-xs">
              <table className="w-full border-collapse">
                <thead>
                  {/* Header Row 1: Days of Week */}
                  <tr className="bg-white text-slate-950 font-bold text-center border-b border-slate-950">
                    <th className="p-1.5 border-r border-slate-950 w-24 sm:w-28 bg-white">
                      {/* Blank box for employee name */}
                    </th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th
                        key={day}
                        colSpan={2}
                        className="py-1 px-1 border-r border-slate-950 last:border-r-0 uppercase tracking-wider font-extrabold text-[11px] sm:text-xs bg-white"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                  {/* Header Row 2: Start / Finish */}
                  <tr className="bg-white text-slate-800 font-semibold text-center text-[10px] sm:text-[11px] border-b border-slate-950">
                    <th className="p-1 border-r border-slate-950 bg-white"></th>
                    {DAYS_OF_WEEK.map((day) => (
                      <React.Fragment key={day}>
                        <th className="py-1 px-0.5 border-r border-slate-400 w-12 sm:w-14 bg-white font-medium">
                          Start
                        </th>
                        <th className="py-1 px-0.5 border-r border-slate-950 last:border-r-0 w-12 sm:w-14 bg-white font-medium">
                          Finish
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {previewRows.map((row, rIdx) => {
                    const shift1 = (day: DayOfWeek) => row.days[day]?.[0];
                    const shift2 = (day: DayOfWeek) => row.days[day]?.[1];

                    return (
                      <React.Fragment key={rIdx}>
                        {/* Sub-row 1: Shift 1 (e.g. Lunch) */}
                        <tr className="border-b border-slate-300 h-6 sm:h-7">
                          {/* Name occupies 2 rows */}
                          <td
                            rowSpan={2}
                            className="p-1 font-bold text-slate-900 text-center border-r border-slate-950 border-b border-b-slate-950 bg-white align-middle truncate"
                          >
                            {row.staffName}
                          </td>
                          {DAYS_OF_WEEK.map((day) => {
                            const p1 = shift1(day);
                            return (
                              <React.Fragment key={day}>
                                <td className="p-0.5 text-center font-sans font-medium text-slate-900 border-r border-slate-400 text-[10px] sm:text-[11px] align-middle">
                                  {p1?.start || ''}
                                </td>
                                <td className="p-0.5 text-center font-sans font-medium text-slate-900 border-r border-slate-950 last:border-r-0 text-[10px] sm:text-[11px] align-middle">
                                  {p1?.finish || ''}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        {/* Sub-row 2: Shift 2 (e.g. Dinner) */}
                        <tr className="border-b border-slate-950 h-6 sm:h-7">
                          {DAYS_OF_WEEK.map((day) => {
                            const p2 = shift2(day);
                            return (
                              <React.Fragment key={day}>
                                <td className="p-0.5 text-center font-sans font-medium text-slate-900 border-r border-slate-400 text-[10px] sm:text-[11px] align-middle">
                                  {p2?.start || ''}
                                </td>
                                <td className="p-0.5 text-center font-sans font-medium text-slate-900 border-r border-slate-950 last:border-r-0 text-[10px] sm:text-[11px] align-middle">
                                  {p2?.finish || ''}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Empty template slots (each slot occupies 2 rows) */}
                  {(exportMode === 'blank_template' ? Array.from({ length: 10 }) : includeEmptyRows ? Array.from({ length: 6 }) : []).map((_, emptyIdx) => (
                    <React.Fragment key={`empty-slot-${emptyIdx}`}>
                      <tr className="border-b border-slate-300 h-6 sm:h-7 bg-white">
                        <td rowSpan={2} className="p-1 border-r border-slate-950 border-b border-b-slate-950 bg-white"></td>
                        {DAYS_OF_WEEK.map((day) => (
                          <React.Fragment key={day}>
                            <td className="p-0.5 border-r border-slate-400 bg-white"></td>
                            <td className="p-0.5 border-r border-slate-950 last:border-r-0 bg-white"></td>
                          </React.Fragment>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-950 h-6 sm:h-7 bg-white">
                        {DAYS_OF_WEEK.map((day) => (
                          <React.Fragment key={day}>
                            <td className="p-0.5 border-r border-slate-400 bg-white"></td>
                            <td className="p-0.5 border-r border-slate-950 last:border-r-0 bg-white"></td>
                          </React.Fragment>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Right Footer: @ Malaya Corner */}
            <div className="mt-2.5 flex justify-end">
              <span className="text-[10px] sm:text-xs text-slate-500 font-sans tracking-wide">
                @ Malaya Corner
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Exports in exact Malaya Corner format with dual Start/Finish columns, split shift rows, and landscape orientation.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print directly or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? 'Generating Excel...' : 'Download Excel (.xlsx)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
