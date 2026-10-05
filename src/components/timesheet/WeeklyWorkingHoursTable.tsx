import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DAYS_OF_WEEK,
  PICTURE_SHEET_1_DATA,
  PICTURE_SHEET_2_DATA,
  PICTURE_COMBINED_DATA,
  compileStaffTimesheetRows,
  downloadWeeklyTimesheetExcel,
  StaffWeeklyTimesheetRow,
  ShiftTimePair,
} from '../../utils/timesheetExport';
import { DayOfWeek } from '../../types';

interface WeeklyWorkingHoursTableProps {
  onEditPunch?: (staffName: string, day: DayOfWeek, pair?: ShiftTimePair) => void;
}

export const WeeklyWorkingHoursTable: React.FC<WeeklyWorkingHoursTableProps> = ({
  onEditPunch,
}) => {
  const { staffUsers, shifts, clockRecords } = useApp();

  const [dataSource, setDataSource] = useState<
    'sheet_1' | 'sheet_2' | 'combined' | 'live'
  >('sheet_1');
  const [dateRangeStr, setDateRangeStr] = useState<string>('27/07/2026 - 02/08/2026');
  const [isExporting, setIsExporting] = useState(false);

  // Compute table rows based on active data source
  const tableData: StaffWeeklyTimesheetRow[] = useMemo(() => {
    switch (dataSource) {
      case 'sheet_1':
        return PICTURE_SHEET_1_DATA;
      case 'sheet_2':
        return PICTURE_SHEET_2_DATA;
      case 'combined':
        return PICTURE_COMBINED_DATA;
      case 'live':
      default:
        return compileStaffTimesheetRows(staffUsers, shifts, clockRecords, 'hybrid');
    }
  }, [dataSource, staffUsers, shifts, clockRecords]);

  // Handle direct download matching the attachment
  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      const mode =
        dataSource === 'sheet_1'
          ? 'picture_sheet_1'
          : dataSource === 'sheet_2'
          ? 'picture_sheet_2'
          : dataSource === 'combined'
          ? 'picture_combined'
          : 'hybrid';

      await downloadWeeklyTimesheetExcel({
        weekDateRangeStr: dateRangeStr,
        title: 'Weekly Working Hours',
        footer: '@ Malaya Corner',
        staffUsers,
        shifts,
        clockRecords,
        mode,
        includeEmptyRowsCount: 5,
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

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Source Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setDataSource('sheet_1');
              setDateRangeStr('27/07/2026 - 02/08/2026');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dataSource === 'sheet_1'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Attachment Sheet 1 (John, L'Erica...)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDataSource('sheet_2');
              setDateRangeStr('27/07/2026 - 02/08/2026');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dataSource === 'sheet_2'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Attachment Sheet 2 (Mark, France...)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDataSource('combined');
              setDateRangeStr('27/07/2026 - 02/08/2026');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dataSource === 'combined'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-500" />
            <span>Both Combined</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDataSource('live');
              setDateRangeStr('Current Live Week');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              dataSource === 'live'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Live System Data</span>
          </button>
        </div>

        {/* Export & Print Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export Excel spreadsheet matching attachment"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>{isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* The Printable Paper Sheet Container */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-sm p-4 sm:p-6 overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Top Paper Header: Date on Top Left, Title Centered & Underlined */}
        <div className="relative mb-3 pb-1">
          {/* Top Left: Date Range (matching photo) */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight sm:absolute sm:left-0 sm:top-1">
            <span>{dateRangeStr}</span>
          </div>

          {/* Top Center: Weekly Working Hours (matching photo) */}
          <div className="text-center pt-1 sm:pt-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight underline decoration-2 underline-offset-4 inline-block font-sans">
              Weekly Working Hours
            </h2>
          </div>
        </div>

        {/* Scrollable Container for Mobile / Tablet */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-900 text-xs text-slate-900 bg-white min-w-[760px]">
            {/* Table Header: MON to SUN with Start & Finish */}
            <thead>
              {/* Row 1: Day of Week Headers */}
              <tr className="border-b-2 border-slate-900">
                <th
                  rowSpan={2}
                  className="border-r-2 border-slate-900 p-2 w-24 sm:w-28 text-center font-bold text-slate-800 bg-slate-50/40"
                >
                  {/* Left corner matching photo */}
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    colSpan={2}
                    className="border-r-2 border-slate-900 p-1.5 sm:p-2 text-center font-bold text-sm tracking-wide bg-slate-50/50"
                  >
                    {day}
                  </th>
                ))}
              </tr>

              {/* Row 2: Sub-headers (Start / Finish) */}
              <tr className="border-b-2 border-slate-900 text-[11px] font-semibold text-slate-700 bg-slate-50/30">
                {DAYS_OF_WEEK.map((day) => (
                  <React.Fragment key={`${day}-sub`}>
                    <th className="border-r border-slate-400 py-1 px-1.5 text-center font-medium w-12 sm:w-14">
                      Start
                    </th>
                    <th className="border-r-2 border-slate-900 py-1 px-1.5 text-center font-medium w-12 sm:w-14">
                      Finish
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table Body: Staff Rows */}
            <tbody className="divide-y-2 divide-slate-900 font-mono">
              {tableData.map((row, rIdx) => {
                // Determine maximum shifts on any day for this staff to properly size row
                const maxShiftsForStaff = Math.max(
                  1,
                  ...DAYS_OF_WEEK.map((d) => (row.days[d] || []).length)
                );
                const isDoubleHeight = maxShiftsForStaff >= 2;

                return (
                  <tr
                    key={row.staffId || `${row.staffName}-${rIdx}`}
                    className="hover:bg-amber-50/20 transition-colors"
                  >
                    {/* Employee Name Column (Col 1) */}
                    <td className="border-r-2 border-slate-900 px-3 py-2 text-center font-bold text-slate-900 text-sm bg-white whitespace-nowrap align-middle">
                      {row.staffName}
                    </td>

                    {/* 7 Days Columns */}
                    {DAYS_OF_WEEK.map((day) => {
                      const pairs = row.days[day] || [];
                      const hasSplitShift = pairs.length >= 2;

                      // Highlight Sunday for L'Erica as seen in the photo (yellow highlight)
                      const isHighlightedYellow =
                        row.staffName === "L'Erica" && day === 'SUN';

                      return (
                        <React.Fragment key={`${row.staffName}-${day}`}>
                          {/* Start Cell */}
                          <td
                            className={`border-r border-slate-400 p-0 text-center align-middle ${
                              isHighlightedYellow ? 'bg-amber-100/70' : ''
                            }`}
                          >
                            {pairs.length === 0 ? (
                              <div className="h-9 sm:h-10" />
                            ) : hasSplitShift ? (
                              <div className="flex flex-col h-full divide-y divide-slate-300">
                                <div className="py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                  {pairs[0]?.start || ''}
                                </div>
                                <div className="py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                  {pairs[1]?.start || ''}
                                </div>
                              </div>
                            ) : isDoubleHeight ? (
                              <div className="flex flex-col h-full justify-center py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                {pairs[0]?.start || ''}
                              </div>
                            ) : (
                              <div className="py-2 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                {pairs[0]?.start || ''}
                              </div>
                            )}
                          </td>

                          {/* Finish Cell */}
                          <td
                            className={`border-r-2 border-slate-900 p-0 text-center align-middle ${
                              isHighlightedYellow ? 'bg-amber-100/70' : ''
                            }`}
                          >
                            {pairs.length === 0 ? (
                              <div className="h-9 sm:h-10" />
                            ) : hasSplitShift ? (
                              <div className="flex flex-col h-full divide-y divide-slate-300">
                                <div className="py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                  {pairs[0]?.finish || ''}
                                </div>
                                <div className="py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                  {pairs[1]?.finish || ''}
                                </div>
                              </div>
                            ) : isDoubleHeight ? (
                              <div className="flex flex-col h-full justify-center py-1 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                {pairs[0]?.finish || ''}
                              </div>
                            ) : (
                              <div className="py-2 px-1 text-slate-900 font-semibold text-[11px] sm:text-xs">
                                {pairs[0]?.finish || ''}
                              </div>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Empty Template Rows matching the attachment */}
              {Array.from({ length: 5 }).map((_, emptyIdx) => (
                <tr key={`empty-${emptyIdx}`} className="h-9 sm:h-10">
                  <td className="border-r-2 border-slate-900 bg-white" />
                  {DAYS_OF_WEEK.map((day) => (
                    <React.Fragment key={`empty-${emptyIdx}-${day}`}>
                      <td className="border-r border-slate-400 bg-white" />
                      <td className="border-r-2 border-slate-900 bg-white" />
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paper Sheet Footer: "@ Malaya Corner" at Bottom Right */}
        <div className="text-right mt-2.5 text-xs font-serif italic text-slate-700 font-medium pr-1 select-none">
          @ Malaya Corner
        </div>
      </div>
    </div>
  );
};
