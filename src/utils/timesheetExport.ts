import ExcelJS from 'exceljs';
import { StaffUser, ShiftSlot, ClockRecord, DayOfWeek } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export interface ShiftTimePair {
  start: string;
  finish: string;
}

export interface StaffWeeklyTimesheetRow {
  staffId?: string;
  staffName: string;
  position?: string;
  days: Record<DayOfWeek, ShiftTimePair[]>;
}

export interface ExportWeeklyTimesheetOptions {
  weekDateRangeStr?: string; // e.g., '03/08/2026 - 09/08/2026'
  title?: string; // e.g., 'Weekly Working Hours'
  footer?: string; // e.g., '@ Malaya Corner'
  staffUsers?: StaffUser[];
  shifts?: ShiftSlot[];
  clockRecords?: ClockRecord[];
  mode?: 'picture_reference' | 'clock_records' | 'shifts' | 'hybrid' | 'picture_sheet_1' | 'picture_sheet_2' | 'picture_combined';
  includeEmptyRowsCount?: number;
}

// Exact weekly roster & punches matching the attached pictures (27/07/2026 - 02/08/2026)
export const PICTURE_REFERENCE_DATA: StaffWeeklyTimesheetRow[] = [
  // Page 1 (Image 2)
  {
    staffName: 'John',
    position: 'Wait Staff',
    days: {
      MON: [
        { start: '11:30', finish: '14:30' },
        { start: '16:45', finish: '20:45' },
      ],
      TUE: [],
      WED: [{ start: '11:30', finish: '14:45' }],
      THU: [{ start: '11:15', finish: '15:00' }],
      FRI: [{ start: '11:15', finish: '15:00' }],
      SAT: [{ start: '17:15', finish: '21:30' }],
      SUN: [{ start: '16:45', finish: '22:00' }],
    },
  },
  {
    staffName: "L'Erica",
    position: 'Wait Staff',
    days: {
      MON: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      TUE: [
        { start: '11:15', finish: '14:30' },
        { start: '16:45', finish: '21:45' },
      ],
      WED: [],
      THU: [],
      FRI: [{ start: '11:30', finish: '14:30' }],
      SAT: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '21:00' },
      ],
      SUN: [{ start: '11:15', finish: '14:45' }],
    },
  },
  {
    staffName: 'Mark.M',
    position: 'Manager',
    days: {
      MON: [{ start: '18:00', finish: '22:00' }],
      TUE: [{ start: '11:30', finish: '14:45' }],
      WED: [],
      THU: [],
      FRI: [
        { start: '11:15', finish: '15:00' },
        { start: '16:45', finish: '22:30' },
      ],
      SAT: [
        { start: '11:15', finish: '15:30' },
        { start: '18:00', finish: '22:30' },
      ],
      SUN: [],
    },
  },
  {
    staffName: 'Manuel',
    position: 'Kitchen Hand / Runner',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [
        { start: '11:30', finish: '15:00' },
        { start: '18:00', finish: '22:30' },
      ],
      SUN: [
        { start: '11:15', finish: '14:30' },
        { start: '18:00', finish: '21:30' },
      ],
    },
  },
  {
    staffName: 'Erica',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [{ start: '18:00', finish: '22:30' }],
      SAT: [
        { start: '12:00', finish: '15:00' },
        { start: '16:45', finish: '22:30' },
      ],
      SUN: [{ start: '16:45', finish: '21:30' }],
    },
  },
  {
    staffName: 'IU',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [{ start: '16:45', finish: '21:00' }],
      WED: [],
      THU: [],
      FRI: [{ start: '16:45', finish: '21:00' }],
      SAT: [],
      SUN: [],
    },
  },
  {
    staffName: 'Kai',
    position: 'Bar Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '21:00' },
      ],
      THU: [
        { start: '11:15', finish: '15:00' },
        { start: '16:45', finish: '21:00' },
      ],
      FRI: [],
      SAT: [],
      SUN: [
        { start: '11:30', finish: '15:15' },
        { start: '16:45', finish: '20:15' },
      ],
    },
  },
  {
    staffName: 'Veronica',
    position: 'Wait Staff',
    days: {
      MON: [{ start: '11:15', finish: '14:45' }],
      TUE: [
        { start: '11:15', finish: '14:30' },
        { start: '17:15', finish: '21:45' },
      ],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [
        { start: '12:00', finish: '15:15' },
        { start: '18:00', finish: '21:30' },
      ],
    },
  },
  {
    staffName: 'Zoe',
    position: 'Wait Staff',
    days: {
      MON: [{ start: '17:15', finish: '22:00' }],
      TUE: [],
      WED: [{ start: '18:00', finish: '22:00' }],
      THU: [{ start: '17:15', finish: '22:15' }],
      FRI: [],
      SAT: [],
      SUN: [{ start: '17:15', finish: '21:00' }],
    },
  },
  {
    staffName: 'Yen',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [{ start: '18:00', finish: '21:45' }],
      WED: [{ start: '17:15', finish: '22:00' }],
      THU: [{ start: '18:00', finish: '22:15' }],
      FRI: [{ start: '17:15', finish: '22:30' }],
      SAT: [],
      SUN: [],
    },
  },
  // Page 2 (Image 1)
  {
    staffName: 'Mark',
    position: 'General Manager',
    days: {
      MON: [],
      TUE: [],
      WED: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      THU: [
        { start: '11:15', finish: '15:00' },
        { start: '16:45', finish: '22:15' },
      ],
      FRI: [{ start: '17:15', finish: '21:30' }],
      SAT: [],
      SUN: [],
    },
  },
  {
    staffName: 'France',
    position: 'Wait Staff',
    days: {
      MON: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      TUE: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      WED: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      THU: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      FRI: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:30' },
      ],
      SAT: [
        { start: '11:00', finish: '15:00' },
        { start: '16:45', finish: '22:45' },
      ],
      SUN: [],
    },
  },
  {
    staffName: 'Bowie',
    position: 'Kitchen Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [{ start: '11:15', finish: '14:45' }],
    },
  },
];

export const PICTURE_SHEET_1_DATA: StaffWeeklyTimesheetRow[] = PICTURE_REFERENCE_DATA.slice(0, 12);
export const PICTURE_SHEET_2_DATA: StaffWeeklyTimesheetRow[] = PICTURE_REFERENCE_DATA.slice(12);
export const PICTURE_COMBINED_DATA: StaffWeeklyTimesheetRow[] = PICTURE_REFERENCE_DATA;

/**
 * Safely resolves any shift pairs array into guaranteed [Lunch, Dinner] slots.
 * Ensures a dinner shift NEVER renders in the lunch sub-row, and a staff member
 * can NEVER have two dinner shifts on the same day.
 */
export function resolveDayShifts(pairs: ShiftTimePair[] = []): { lunch: ShiftTimePair; dinner: ShiftTimePair } {
  const empty: ShiftTimePair = { start: '', finish: '' };
  if (!pairs || pairs.length === 0) {
    return { lunch: empty, dinner: empty };
  }

  let lunch: ShiftTimePair = empty;
  let dinner: ShiftTimePair = empty;

  for (const p of pairs) {
    if (!p || !p.start) continue;
    const hour = parseInt(p.start.split(':')[0], 10);
    // Lunch service window starts before 16:00 (e.g. 11:00, 11:15, 11:30)
    if (!isNaN(hour) && hour < 16) {
      if (!lunch.start) lunch = p;
    } else {
      // Dinner service window starts at or after 16:00 (e.g. 16:30, 16:45, 17:00, 18:00)
      // Only the first valid dinner shift is kept - a staff member cannot take 2 dinner shifts on the same day!
      if (!dinner.start) dinner = p;
    }
  }

  return { lunch, dinner };
}

/**
 * Compiles live app state into the row-by-row structure matching the weekly working hours grid.
 */
export function compileStaffTimesheetRows(
  staffUsers: StaffUser[],
  shifts: ShiftSlot[],
  clockRecords: ClockRecord[],
  mode: 'picture_reference' | 'clock_records' | 'shifts' | 'hybrid' | 'picture_sheet_1' | 'picture_sheet_2' | 'picture_combined' = 'hybrid'
): StaffWeeklyTimesheetRow[] {
  if (mode === 'picture_reference' || mode === 'picture_combined') {
    return PICTURE_REFERENCE_DATA;
  }
  if (mode === 'picture_sheet_1') {
    return PICTURE_SHEET_1_DATA;
  }
  if (mode === 'picture_sheet_2') {
    return PICTURE_SHEET_2_DATA;
  }

  // Sort staff in familiar priority: Mark, John, L'Erica, Kai, Maria, Manuel, Erica, IU, Yannie, etc.
  const namePriority = [
    'John',
    "L'Erica",
    'Mark.M',
    'Mark',
    'Manuel',
    'Erica',
    'IU',
    'Kai',
    'Veronica',
    'Maria',
    'Yen',
    'France',
    'Yannie',
    'Bowie',
    'Marcus',
    'Chloe',
  ];

  const sortedStaff = [...staffUsers].sort((a, b) => {
    const idxA = namePriority.indexOf(a.firstName);
    const idxB = namePriority.indexOf(b.firstName);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.firstName.localeCompare(b.firstName);
  });

  return sortedStaff.map((staff) => {
    const daysData: Record<DayOfWeek, ShiftTimePair[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    };

    DAYS_OF_WEEK.forEach((day) => {
      let lunchPair: ShiftTimePair = { start: '', finish: '' };
      let dinnerPair: ShiftTimePair = { start: '', finish: '' };

      const isLunchTime = (t?: string) => {
        if (!t) return false;
        const hour = parseInt(t.split(':')[0], 10);
        return !isNaN(hour) && hour < 16;
      };

      // 1. Clock records for this staff & day
      if (mode === 'clock_records' || mode === 'hybrid') {
        const staffClockRecs = clockRecords.filter((rec) => {
          if (rec.staffId !== staff.id && rec.staffName !== `${staff.firstName} ${staff.lastName}` && rec.staffName !== staff.firstName) {
            return false;
          }
          if (rec.date) {
            try {
              const parts = rec.date.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const dayOfMonth = parseInt(parts[2], 10);
                const localDate = new Date(year, month, dayOfMonth);
                const dayMap: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                return dayMap[localDate.getDay()] === day;
              }
              const d = new Date(rec.date);
              const dayIndex = d.getDay();
              const dayMap: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
              return dayMap[dayIndex] === day;
            } catch {
              return false;
            }
          }
          return false;
        });

        // Place into strictly one lunch slot and one dinner slot - NEVER allow 2 dinners on the same day!
        staffClockRecs.forEach((cr) => {
          if (!cr.clockInTime) return;
          const isLunch = cr.shiftType === 'lunch' || isLunchTime(cr.clockInTime);
          if (isLunch) {
            if (!lunchPair.start) {
              lunchPair = {
                start: cr.clockInTime,
                finish: cr.clockOutTime || '',
              };
            }
          } else {
            // Dinner shift: only ONE dinner shift per day!
            if (!dinnerPair.start) {
              dinnerPair = {
                start: cr.clockInTime,
                finish: cr.clockOutTime || '',
              };
            }
          }
        });
      }

      // 2. Scheduled shifts fallback for this staff & day
      if (mode === 'shifts' || (mode === 'hybrid' && (!lunchPair.start || !dinnerPair.start))) {
        const staffShifts = shifts.filter(
          (s) => s.assignedStaffId === staff.id && s.day === day && s.status === 'published'
        );

        staffShifts.forEach((s) => {
          const isLunch = s.shiftType === 'lunch' || isLunchTime(s.startTime);
          if (isLunch && !lunchPair.start) {
            lunchPair = {
              start: s.startTime || '',
              finish: s.endTime || '15:00',
            };
          } else if (!isLunch && !dinnerPair.start) {
            dinnerPair = {
              start: s.startTime || '',
              finish: s.endTime || '21:30',
            };
          }
        });
      }

      // Slot 0 is ALWAYS Lunch, Slot 1 is ALWAYS Dinner
      daysData[day] = [lunchPair, dinnerPair];
    });

    return {
      staffId: staff.id,
      staffName: staff.firstName === 'Mark' && staff.role === 'manager' ? 'Mark.M' : staff.firstName,
      position: staff.position,
      days: daysData,
    };
  });
}

/**
 * Builds a styled ExcelJS workbook matching the exact look & feel of the attached pictures:
 * - Title: "Weekly Working Hours"
 * - Date Range: e.g. "03/08/2026 - 09/08/2026"
 * - Columns: Employee | MON (Start, Finish) | TUE (Start, Finish) | ... | SUN (Start, Finish)
 * - Footer: "@ Malaya Corner"
 */
export async function createWeeklyTimesheetWorkbook(options: ExportWeeklyTimesheetOptions = {}): Promise<ExcelJS.Workbook> {
  const {
    weekDateRangeStr = '27/07/2026 - 02/08/2026',
    title = 'Weekly Working Hours',
    footer = '@ Malaya Corner',
    staffUsers = [],
    shifts = [],
    clockRecords = [],
    mode = 'hybrid',
    includeEmptyRowsCount = 8,
  } = options;

  const rowsData = options.mode === 'picture_reference'
    ? PICTURE_REFERENCE_DATA
    : compileStaffTimesheetRows(staffUsers, shifts, clockRecords, mode);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Malaya Corner Management';
  workbook.lastModifiedBy = 'Malaya Corner';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Weekly Working Hours', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [{ showGridLines: true }],
  });

  // Set column widths
  // Col 1: Employee name
  // Col 2-15: 7 days x 2 cols (Start, Finish)
  worksheet.columns = [
    { key: 'employee', width: 16 }, // Col A
    { key: 'mon_start', width: 9.5 }, // Col B
    { key: 'mon_finish', width: 9.5 }, // Col C
    { key: 'tue_start', width: 9.5 }, // Col D
    { key: 'tue_finish', width: 9.5 }, // Col E
    { key: 'wed_start', width: 9.5 }, // Col F
    { key: 'wed_finish', width: 9.5 }, // Col G
    { key: 'thu_start', width: 9.5 }, // Col H
    { key: 'thu_finish', width: 9.5 }, // Col I
    { key: 'fri_start', width: 9.5 }, // Col J
    { key: 'fri_finish', width: 9.5 }, // Col K
    { key: 'sat_start', width: 9.5 }, // Col L
    { key: 'sat_finish', width: 9.5 }, // Col M
    { key: 'sun_start', width: 9.5 }, // Col N
    { key: 'sun_finish', width: 9.5 }, // Col O
  ];

  // Border styles
  const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
  const mediumBorder: ExcelJS.Border = { style: 'medium', color: { argb: 'FF000000' } };

  // Helper to apply borders to a cell
  const applyCellBorder = (
    cell: ExcelJS.Cell,
    top: ExcelJS.Border = thinBorder,
    left: ExcelJS.Border = thinBorder,
    bottom: ExcelJS.Border = thinBorder,
    right: ExcelJS.Border = thinBorder
  ) => {
    cell.border = { top, left, bottom, right };
  };

  // Row 1: Spacing
  worksheet.addRow([]);
  worksheet.getRow(1).height = 10;

  // Row 2: Top Title & Date Range (matching physical paper sheet)
  const titleRow = worksheet.getRow(2);
  titleRow.height = 28;

  // Date Range at top-left (Col A to D)
  worksheet.mergeCells('A2:D2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = weekDateRangeStr;
  dateCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
  dateCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Centered Title "Weekly Working Hours" (Col E to K)
  worksheet.mergeCells('E2:K2');
  const titleCell = worksheet.getCell('E2');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 15, bold: true, underline: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 3: Spacing before table
  worksheet.addRow([]);
  worksheet.getRow(3).height = 8;

  // Row 4: Table Header 1 (Days of week)
  const header1Row = worksheet.getRow(4);
  header1Row.height = 24;

  // Employee header cell (A4:A5 merged)
  worksheet.mergeCells('A4:A5');
  const employeeHeaderCell = worksheet.getCell('A4');
  employeeHeaderCell.value = '';
  employeeHeaderCell.font = { name: 'Arial', size: 11, bold: true };
  employeeHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Day columns (Col B to O)
  DAYS_OF_WEEK.forEach((day, index) => {
    const startColIndex = 2 + index * 2; // B=2, D=4, F=6, H=8, J=10, L=12, N=14
    const finishColIndex = startColIndex + 1;

    worksheet.mergeCells(4, startColIndex, 4, finishColIndex);
    const dayCell = worksheet.getCell(4, startColIndex);
    dayCell.value = day;
    dayCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    dayCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Row 5: Table Header 2 (Start / Finish)
  const header2Row = worksheet.getRow(5);
  header2Row.height = 20;

  DAYS_OF_WEEK.forEach((_, index) => {
    const startColIndex = 2 + index * 2;
    const finishColIndex = startColIndex + 1;

    const startCell = worksheet.getCell(5, startColIndex);
    startCell.value = 'Start';
    startCell.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF000000' } };
    startCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const finishCell = worksheet.getCell(5, finishColIndex);
    finishCell.value = 'Finish';
    finishCell.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF000000' } };
    finishCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Apply borders to Header Rows 4 and 5
  for (let c = 1; c <= 15; c++) {
    // Row 4
    const c4 = worksheet.getCell(4, c);
    const isDayStart = c >= 2 && c % 2 === 0;
    const isColA = c === 1;
    const isColO = c === 15;

    applyCellBorder(
      c4,
      mediumBorder, // top
      isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder, // left
      thinBorder, // bottom
      isColA ? mediumBorder : isColO ? mediumBorder : thinBorder // right
    );

    // Row 5
    const c5 = worksheet.getCell(5, c);
    applyCellBorder(
      c5,
      thinBorder, // top
      isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder, // left
      mediumBorder, // bottom (thick line separating header from data)
      isColA ? mediumBorder : isColO ? mediumBorder : thinBorder // right
    );
  }

  // Row 6 onwards: Employee Data Rows (each staff occupies 2 rows)
  let currentRowIndex = 6;

  rowsData.forEach((row) => {
    const r1 = currentRowIndex;
    const r2 = currentRowIndex + 1;

    worksheet.getRow(r1).height = 19;
    worksheet.getRow(r2).height = 19;

    // Merge Col A across row r1 and r2 for Employee Name
    worksheet.mergeCells(r1, 1, r2, 1);
    const nameCell = worksheet.getCell(r1, 1);
    nameCell.value = row.staffName;
    nameCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Fill days data for Shift 1 (r1) and Shift 2 (r2)
    DAYS_OF_WEEK.forEach((day, dIdx) => {
      const startColIndex = 2 + dIdx * 2;
      const finishColIndex = startColIndex + 1;

      const pairs = row.days[day] || [];
      const { lunch: p1, dinner: p2 } = resolveDayShifts(pairs);

      // Sub-row 1: Shift 1 (Lunch)
      const startCell1 = worksheet.getCell(r1, startColIndex);
      const finishCell1 = worksheet.getCell(r1, finishColIndex);
      startCell1.value = p1?.start || '';
      startCell1.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      startCell1.alignment = { vertical: 'middle', horizontal: 'center' };

      finishCell1.value = p1?.finish || '';
      finishCell1.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      finishCell1.alignment = { vertical: 'middle', horizontal: 'center' };

      // Sub-row 2: Shift 2
      const startCell2 = worksheet.getCell(r2, startColIndex);
      const finishCell2 = worksheet.getCell(r2, finishColIndex);
      startCell2.value = p2?.start || '';
      startCell2.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      startCell2.alignment = { vertical: 'middle', horizontal: 'center' };

      finishCell2.value = p2?.finish || '';
      finishCell2.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      finishCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Apply borders for Sub-row 1 (r1)
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(r1, c);
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      if (isColA) {
        applyCellBorder(cell, thinBorder, mediumBorder, thinBorder, mediumBorder);
      } else {
        // Day cells in row 1: thin border at bottom separating shift 1 and 2
        applyCellBorder(
          cell,
          thinBorder,
          isDayStart ? mediumBorder : thinBorder,
          thinBorder,
          isColO ? mediumBorder : thinBorder
        );
      }
    }

    // Apply borders for Sub-row 2 (r2)
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(r2, c);
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      if (isColA) {
        applyCellBorder(cell, thinBorder, mediumBorder, mediumBorder, mediumBorder);
      } else {
        // Day cells in row 2: medium border at bottom separating this staff from next
        applyCellBorder(
          cell,
          thinBorder,
          isDayStart ? mediumBorder : thinBorder,
          mediumBorder,
          isColO ? mediumBorder : thinBorder
        );
      }
    }

    currentRowIndex += 2;
  });

  // Add empty template rows at the bottom (each empty staff slot occupies 2 rows)
  for (let emptyIdx = 0; emptyIdx < includeEmptyRowsCount; emptyIdx++) {
    const r1 = currentRowIndex;
    const r2 = currentRowIndex + 1;

    worksheet.getRow(r1).height = 18;
    worksheet.getRow(r2).height = 18;

    // Merge Col A across row r1 and r2
    worksheet.mergeCells(r1, 1, r2, 1);
    const emptyNameCell = worksheet.getCell(r1, 1);
    emptyNameCell.value = '';

    const isLastSlot = emptyIdx === includeEmptyRowsCount - 1;

    // Row 1 of empty slot
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(r1, c);
      cell.value = '';
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      if (isColA) {
        applyCellBorder(cell, thinBorder, mediumBorder, thinBorder, mediumBorder);
      } else {
        applyCellBorder(
          cell,
          thinBorder,
          isDayStart ? mediumBorder : thinBorder,
          thinBorder,
          isColO ? mediumBorder : thinBorder
        );
      }
    }

    // Row 2 of empty slot
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(r2, c);
      cell.value = '';
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      if (isColA) {
        applyCellBorder(cell, thinBorder, mediumBorder, isLastSlot ? mediumBorder : mediumBorder, mediumBorder);
      } else {
        applyCellBorder(
          cell,
          thinBorder,
          isDayStart ? mediumBorder : thinBorder,
          isLastSlot ? mediumBorder : mediumBorder,
          isColO ? mediumBorder : thinBorder
        );
      }
    }

    currentRowIndex += 2;
  }

  // Footer: "@ Malaya Corner" at bottom right (under Sunday column)
  currentRowIndex += 1; // 1 spacer row
  const footerRow = worksheet.getRow(currentRowIndex);
  footerRow.height = 20;

  worksheet.mergeCells(`N${currentRowIndex}:O${currentRowIndex}`);
  const footerCell = worksheet.getCell(`N${currentRowIndex}`);
  footerCell.value = footer;
  footerCell.font = { name: 'Arial', size: 9, italic: true, bold: true, color: { argb: 'FF334155' } };
  footerCell.alignment = { vertical: 'middle', horizontal: 'right' };

  return workbook;
}

/**
 * Triggers the client-side download of the Excel file.
 */
export async function downloadWeeklyTimesheetExcel(options: ExportWeeklyTimesheetOptions = {}): Promise<void> {
  const workbook = await createWeeklyTimesheetWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;

  // Clean filename: e.g. Malaya_Corner_Weekly_Working_Hours_27-07-2026.xlsx
  const rangePart = (options.weekDateRangeStr || '27/07/2026')
    .split('-')[0]
    .trim()
    .replace(/\//g, '-');
  anchor.download = `Malaya_Corner_Weekly_Working_Hours_${rangePart}.xlsx`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
