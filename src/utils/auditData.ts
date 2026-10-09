import { AuditLogEntry } from '../types';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

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
