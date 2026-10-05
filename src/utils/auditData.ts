import { AuditLogEntry } from '../types';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-10-02T22:45:00.000Z',
    displayTime: '02/10/2026, 10:45 pm',
    actionType: 'pin_override',
    title: 'Master PIN Override Used (1234) for John',
    details: 'Master administrative override PIN 1234 was used to authenticate terminal session for employee John (Wait Staff). Personal PIN was bypassed.',
    actorName: 'Manager Override (Master PIN 1234)',
    actorRole: 'manager',
    severity: 'warning',
    terminal: 'Sunnybank POS Terminal #1',
    metadata: {
      targetUserId: 'staff-1',
      targetUserName: 'John',
      bypassReason: 'Employee forgot shift PIN',
    },
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-02T21:15:00.000Z',
    displayTime: '02/10/2026, 09:15 pm',
    actionType: 'timesheet_edit',
    title: 'Clock Record Adjusted: Manuel (FRI Lunch)',
    details: 'Manager Mark Zhang modified clock-in punch from 11:28 to 11:30 (enforced 15-minute rounding window). Note: "Punched 2 min early prior to briefing".',
    actorName: 'Mark Zhang (Manager)',
    actorRole: 'manager',
    severity: 'warning',
    terminal: 'Manager Console',
    metadata: {
      staffName: 'Manuel',
      originalIn: '11:28',
      adjustedIn: '11:30',
      recordId: 'rec-fri-manuel-1',
    },
  },
  {
    id: 'audit-003',
    timestamp: '2026-10-02T19:30:00.000Z',
    displayTime: '02/10/2026, 07:30 pm',
    actionType: 'availability_submit',
    title: 'Weekly Availability Submitted by Erica',
    details: 'Erica (Wait Staff) submitted availability for next week cycle (05/10/2026 - 11/10/2026). Opted in for 5 services: MON Lunch, WED Lunch, FRI Lunch, SAT Dinner, SUN Dinner.',
    actorName: 'Erica (Wait Staff)',
    actorRole: 'staff',
    actorId: 'staff-3',
    severity: 'info',
    terminal: 'Staff Mobile Portal',
    metadata: {
      staffId: 'staff-3',
      servicesOptedIn: 5,
      weekStartDate: '05/10/2026',
    },
  },
  {
    id: 'audit-004',
    timestamp: '2026-10-02T18:10:00.000Z',
    displayTime: '02/10/2026, 06:10 pm',
    actionType: 'schedule_update',
    title: 'Shift Timing Updated: SAT Dinner (17:15)',
    details: 'Shift start time updated from 17:00 to 17:15 for Saturday dinner service. Validated within evening service window (16:30 – 22:00).',
    actorName: 'Mark Zhang (Manager)',
    actorRole: 'manager',
    severity: 'info',
    terminal: 'Manager Console',
    metadata: {
      day: 'SAT',
      shiftType: 'dinner',
      newStartTime: '17:15',
    },
  },
  {
    id: 'audit-005',
    timestamp: '2026-10-02T16:20:00.000Z',
    displayTime: '02/10/2026, 04:20 pm',
    actionType: 'timesheet_export',
    title: 'Weekly Timesheet Exported (.xlsx)',
    details: 'Manager downloaded official Malaya Corner weekly spreadsheet formatted with 2 rows per employee name, start & finish times, and @ Malaya Corner header.',
    actorName: 'Mark Zhang (Manager)',
    actorRole: 'manager',
    severity: 'info',
    terminal: 'Manager Console',
    metadata: {
      fileFormat: 'Excel .xlsx',
      weekRange: '27/07/2026 - 02/08/2026',
      totalEmployees: 13,
    },
  },
  {
    id: 'audit-006',
    timestamp: '2026-10-02T14:05:00.000Z',
    displayTime: '02/10/2026, 02:05 pm',
    actionType: 'availability_submit',
    title: 'Weekly Availability Submitted by Manuel',
    details: 'Manuel (Wait Staff) submitted availability for next week. Opted in for 4 shifts: MON Dinner, TUE Lunch, WED Dinner, SUN Dinner.',
    actorName: 'Manuel (Wait Staff)',
    actorRole: 'staff',
    actorId: 'staff-2',
    severity: 'info',
    terminal: 'Staff Mobile Portal',
    metadata: {
      staffId: 'staff-2',
      servicesOptedIn: 4,
    },
  },
  {
    id: 'audit-007',
    timestamp: '2026-10-02T11:45:00.000Z',
    displayTime: '02/10/2026, 11:45 am',
    actionType: 'timesheet_approval',
    title: 'Timesheet Punches Approved for Chloe',
    details: 'Manager Mark Zhang approved Chloe\'s THU Lunch shift (11:15 – 15:00). Total hours: 3.75 hrs. Sign-off recorded.',
    actorName: 'Mark Zhang (Manager)',
    actorRole: 'manager',
    severity: 'success',
    terminal: 'Manager Console',
    metadata: {
      recordId: 'rec-thu-chloe',
      hours: 3.75,
    },
  },
  {
    id: 'audit-008',
    timestamp: '2026-09-27T22:00:00.000Z',
    displayTime: '27/09/2026, 10:00 pm',
    actionType: 'sunday_close',
    title: 'Sunday 22:00 Weekly Close & Timesheet Export',
    details: 'Automated weekly trade closure protocol executed. Current week payroll spreadsheet (.xlsx) was exported and weekly availability timetable was reset for all staff.',
    actorName: 'System / Malaya Corner Protocol',
    actorRole: 'system',
    severity: 'critical',
    terminal: 'Automated System Scheduler',
    metadata: {
      action: 'Weekly Trade Close & Export',
      cyclePhase: 'CLOSED_EXPORTED',
    },
  },
  {
    id: 'audit-009',
    timestamp: '2026-09-27T16:30:00.000Z',
    displayTime: '27/09/2026, 04:30 pm',
    actionType: 'schedule_send',
    title: 'Weekly Schedule Published & Sent Out to All Staff',
    details: 'Manager finalized and published the roster for the upcoming trade week. All staff members were granted access to view their own personal schedules. Availability timetable reset.',
    actorName: 'Mark Zhang (Manager)',
    actorRole: 'manager',
    severity: 'success',
    terminal: 'Manager Console',
    metadata: {
      totalShifts: 18,
      assignedStaff: 13,
      cyclePhase: 'SCHEDULE_SENT',
    },
  },
  {
    id: 'audit-010',
    timestamp: '2026-09-27T14:30:00.000Z',
    displayTime: '27/09/2026, 02:30 pm',
    actionType: 'pin_auth',
    title: 'Timetable Locked at Sunday 14:30 Deadline',
    details: 'Availability submissions closed automatically at Sunday 14:30. Timetable transitioned to locked scheduling phase for manager roster compilation.',
    actorName: 'System Protocol',
    actorRole: 'system',
    severity: 'warning',
    terminal: 'System Scheduler',
    metadata: {
      deadline: 'Sunday 14:30',
      submissionsClosed: true,
    },
  },
];

/**
 * Helper to export audit logs to a clean CSV file
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): void {
  const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Role', 'Action Type', 'Severity', 'Event Title', 'Details', 'Terminal'];
  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.displayTime}"`,
    `"${log.actorName.replace(/"/g, '""')}"`,
    `"${log.actorRole}"`,
    `"${log.actionType}"`,
    `"${log.severity}"`,
    `"${log.title.replace(/"/g, '""')}"`,
    `"${log.details.replace(/"/g, '""')}"`,
    `"${(log.terminal || 'Manager Console').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Malaya_Corner_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
