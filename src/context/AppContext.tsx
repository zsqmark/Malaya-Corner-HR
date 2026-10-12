import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  StaffUser,
  StaffType,
  ShiftSlot,
  DayOfWeek,
  ShiftType,
  WeeklyCyclePhase,
  DayAvailability,
  StaffWeeklyAvailability,
  ClockRecord,
  TaskItem,
  ChecklistItem,
  RestaurantDocument,
  OnboardingFormData,
  canPerformJob,
  AuditLogEntry,
  AuditActionType,
} from '../types';
import {
  INITIAL_STAFF_USERS,
  INITIAL_AVAILABILITIES,
  INITIAL_SHIFTS,
  INITIAL_CLOCK_RECORDS,
  INITIAL_TASKS,
  INITIAL_CHECKLISTS,
  INITIAL_DOCUMENTS,
  INITIAL_ONBOARDING_DATA,
} from '../mockData';
import { INITIAL_AUDIT_LOGS } from '../utils/auditData';
import {
  validateShiftStartTime,
  SHIFT_WINDOWS,
  roundTimeTo15Minutes,
  parseTimeToMinutes,
  formatTimeTo24h,
} from '../utils/shiftTimes';
import { downloadWeeklyTimesheetExcel } from '../utils/timesheetExport';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

interface AppContextType {
  isFirebaseConnected: boolean;
  currentRole: Role;
  currentStaffId: string;
  activeStaff: StaffUser;
  staffUsers: StaffUser[];
  shifts: ShiftSlot[];
  availabilities: Record<string, StaffWeeklyAvailability>;
  clockRecords: ClockRecord[];
  tasks: TaskItem[];
  checklists: ChecklistItem[];
  documents: RestaurantDocument[];
  onboardingRecords: Record<string, OnboardingFormData>;
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'displayTime'>) => void;
  clearAuditLogs: () => void;
  resetAuditLogsToDefaults: () => void;
  // Navigation state
  currentPage: string;
  setCurrentPage: (page: string) => void;
  // User switcher
  switchRole: (role: Role) => void;
  switchUser: (staffId: string, isAuthorized?: boolean) => void;
  authenticateManager: (pin?: string) => boolean;
  // Terminal Lock
  isTerminalLocked: boolean;
  setIsTerminalLocked: (locked: boolean) => void;
  lockTerminal: () => void;
  // Weekly Roster & Availability Lifecycle
  cyclePhase: WeeklyCyclePhase;
  isAvailabilityLocked: boolean;
  isScheduleSent: boolean;
  lastScheduleSentAt: string | null;
  lastTimesheetExportedAt: string | null;
  currentWeekLabel: string;
  nextWeekLabel: string;
  sendOutScheduleToStaff: () => void;
  executeSundayCloseAndTimesheetExport: () => Promise<void>;
  setCyclePhaseManual: (phase: WeeklyCyclePhase) => void;
  resetAvailabilitiesTable: () => void;
  openNewWeeklyCycle: () => void;
  // Scheduling
  submitAvailability: (staffId: string, weekStartDate: string, avail: Record<DayOfWeek, DayAvailability>) => void;
  assignStaffToShift: (shiftId: string, staffId: string) => void;
  unassignStaffFromShift: (shiftId: string) => void;
  createShift: (newShift: Omit<ShiftSlot, 'id'>) => boolean;
  updateShift: (shiftId: string, updates: Partial<ShiftSlot>) => boolean;
  deleteShift: (shiftId: string) => void;
  // Timeclock (Enforced 15-minute rounding: :00, :15, :30, :45)
  clockIn: (staffId: string, shiftType: ShiftType, notes?: string) => void;
  clockOut: (staffId: string, notes?: string) => void;
  toggleBreak: (staffId: string) => void;
  approveTimesheet: (recordId: string) => void;
  updateClockRecord: (recordId: string, updates: Partial<ClockRecord>) => void;
  seedWeeklyTimesheetClockRecords: () => Promise<void>;
  // Tasks (Manager can create, edit, delete; staff can complete)
  createTask: (task: Omit<TaskItem, 'id' | 'isCompleted'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  confirmTaskDone: (taskId: string, note?: string, completedBy?: { id: string; name: string }) => void;
  resetTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  // Checklist (Two distinct sets: bar_staff and wait_staff)
  toggleChecklistItem: (itemId: string, tempReading?: string, photos?: string[]) => void;
  updateChecklistItemPhotos: (itemId: string, photos: string[]) => void;
  resetChecklist: (category?: string, roleSet?: 'bar_staff' | 'wait_staff') => void;
  createChecklistItem: (item: Omit<ChecklistItem, 'id' | 'isCompleted'>) => void;
  updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (itemId: string) => void;
  // Onboarding & Invite New Staff
  submitOnboardingForm: (staffId: string, data: OnboardingFormData) => void;
  approveOnboarding: (staffId: string) => void;
  updateOnboardingStatus: (staffId: string, status: 'approved' | 'rejected' | 'pending') => void;
  updateStaffPin: (staffId: string, newPin: string) => void;
  authenticateStaffPin: (staffId: string, pin: string) => boolean;
  inviteStaffUser: (newStaff: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    staffType: StaffType;
    position: string;
    hourlyRate: number;
    pin?: string;
    welcomeNote?: string;
  }) => { staffId: string; inviteToken: string };
  deleteStaffUser: (staffId: string) => void;
  clearAllStaffUsers: () => void;
  // Documents
  uploadDocument: (doc: Omit<RestaurantDocument, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (docId: string) => void;
  // Reset
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF_USERS: 'malaya_7shifts_staff_v2',
  SHIFTS: 'malaya_7shifts_shifts_v1',
  AVAILABILITIES: 'malaya_7shifts_availabilities_v1',
  CLOCK_RECORDS: 'malaya_7shifts_clock_v1',
  TASKS: 'malaya_7shifts_tasks_v2',
  CHECKLISTS: 'malaya_7shifts_checklists_v3',
  DOCUMENTS: 'malaya_7shifts_documents_v1',
  ONBOARDING: 'malaya_7shifts_onboarding_v1',
  AUDIT_LOGS: 'malaya_7shifts_audit_logs_v1',
  CURRENT_USER_ID: 'malaya_7shifts_user_id_v1',
  CURRENT_ROLE: 'malaya_7shifts_role_v1',
  CYCLE_PHASE: 'malaya_7shifts_cycle_phase_v1',
  IS_SCHEDULE_SENT: 'malaya_7shifts_schedule_sent_v1',
  LAST_SENT_AT: 'malaya_7shifts_last_sent_v1',
  LAST_EXPORT_AT: 'malaya_7shifts_last_export_v1',
};

// Purge previous demo data from browser storage so the system starts completely clean
if (typeof window !== 'undefined' && localStorage.getItem('malaya_demo_purged_v5') !== 'true') {
  localStorage.removeItem(STORAGE_KEYS.SHIFTS);
  localStorage.removeItem(STORAGE_KEYS.CLOCK_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.AVAILABILITIES);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
  localStorage.removeItem('malaya_7shifts_checklists_v2');
  localStorage.removeItem('malaya_7shifts_checklists_v3');
  localStorage.setItem('malaya_demo_purged_v5', 'true');
}

// Retention Policy: Any record older than 1 month (30 days) is not stored
export const isRecordWithinOneMonth = (timestamp: string | undefined): boolean => {
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return false;
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - time <= ONE_MONTH_MS;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) as Role) || 'staff';
  });

  const [currentStaffId, setCurrentStaffId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'staff-john';
  });

  const [currentPage, setCurrentPage] = useState<string>('Homepage');
  const [isTerminalLocked, setIsTerminalLocked] = useState<boolean>(false);

  const lockTerminal = () => {
    setIsTerminalLocked(true);
  };

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
    if (!saved) return INITIAL_STAFF_USERS;
    try {
      const parsed: StaffUser[] = JSON.parse(saved);
      return parsed.map((s) => {
        const defaultMatch = INITIAL_STAFF_USERS.find((init) => init.id === s.id);
        if (s.id === 'staff-mark') {
          return { ...s, role: 'manager', pin: s.pin || '123456' };
        }
        const pin = s.pin || defaultMatch?.pin || '1234';
        return { ...s, pin };
      });
    } catch {
      return INITIAL_STAFF_USERS;
    }
  });

  const [shifts, setShifts] = useState<ShiftSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    const rawShifts: ShiftSlot[] = saved ? JSON.parse(saved) : INITIAL_SHIFTS;

    const savedAvail = localStorage.getItem(STORAGE_KEYS.AVAILABILITIES);
    const availMap: Record<string, StaffWeeklyAvailability> = savedAvail
      ? JSON.parse(savedAvail)
      : INITIAL_AVAILABILITIES;

    // Enforce business rule:
    // When the staff has not yet submitted their availability for that slot, the slot should be empty (unassigned).
    return rawShifts.map((s) => {
      if (!s.assignedStaffId) return s;
      const staffAvail = availMap[s.assignedStaffId];
      const isAvailable = Boolean(staffAvail?.availabilities?.[s.day]?.[s.shiftType]);
      if (!isAvailable) {
        return { ...s, assignedStaffId: undefined };
      }
      return s;
    });
  });

  const [availabilities, setAvailabilities] = useState<Record<string, StaffWeeklyAvailability>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVAILABILITIES);
    return saved ? JSON.parse(saved) : INITIAL_AVAILABILITIES;
  });

  const [clockRecords, setClockRecords] = useState<ClockRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOCK_RECORDS);
    let source: ClockRecord[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          source = parsed;
        }
      } catch {
        // fallback to INITIAL_CLOCK_RECORDS
      }
    }
    if (source.length === 0) {
      source = INITIAL_CLOCK_RECORDS;
    }
    // Normalize all clock records to 15-minute intervals (:00, :15, :30, :45)
    return source.map((rec) => {
      const roundedIn = roundTimeTo15Minutes(rec.clockInTime);
      const roundedOut = rec.clockOutTime ? roundTimeTo15Minutes(rec.clockOutTime) : undefined;
      let totalHours = rec.totalHours;
      if (roundedIn && roundedOut) {
        const inMins = parseTimeToMinutes(roundedIn) ?? 0;
        const outMins = parseTimeToMinutes(roundedOut) ?? 0;
        let diff = outMins - inMins;
        if (diff < 0) diff += 24 * 60;
        diff = Math.max(0, diff - (rec.breakMinutes || 0));
        totalHours = Number((diff / 60).toFixed(2));
      }
      return {
        ...rec,
        clockInTime: roundedIn,
        clockOutTime: roundedOut,
        totalHours,
      };
    });
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    const list: TaskItem[] = saved ? JSON.parse(saved) : INITIAL_TASKS;
    return list.filter((t) => t.id !== 'task-4');
  });

  const [checklists, setChecklists] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing checklists v3', e);
      }
    }
    const savedV2 = localStorage.getItem('malaya_7shifts_checklists_v2');
    if (savedV2) {
      try {
        const parsedV2: ChecklistItem[] = JSON.parse(savedV2);
        // Merge with INITIAL_CHECKLISTS to adopt requiresPhoto, maxPhotos, and photos
        return INITIAL_CHECKLISTS.map((init) => {
          const match = parsedV2.find((p) => p.id === init.id);
          if (match) {
            return {
              ...init,
              ...match,
              requiresPhoto: init.requiresPhoto ?? match.requiresPhoto,
              maxPhotos: init.maxPhotos ?? match.maxPhotos,
              photos: match.photos || init.photos,
            };
          }
          return init;
        });
      } catch (e) {
        console.error('Error migrating checklists v2', e);
      }
    }
    return INITIAL_CHECKLISTS;
  });

  const [documents, setDocuments] = useState<RestaurantDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!saved) return INITIAL_DOCUMENTS;
    try {
      const parsed: RestaurantDocument[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((d) => d.id));
      const missingDefaults = INITIAL_DOCUMENTS.filter((d) => !existingIds.has(d.id));
      if (missingDefaults.length > 0) {
        return [...parsed, ...missingDefaults];
      }
      return parsed;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [onboardingRecords, setOnboardingRecords] = useState<Record<string, OnboardingFormData>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return saved ? JSON.parse(saved) : INITIAL_ONBOARDING_DATA;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) {
      try {
        const parsed: AuditLogEntry[] = JSON.parse(saved);
        return parsed.filter((l) => isRecordWithinOneMonth(l.timestamp));
      } catch (e) {
        console.error('Error parsing audit logs', e);
      }
    }
    return INITIAL_AUDIT_LOGS.filter((l) => isRecordWithinOneMonth(l.timestamp));
  });

  useEffect(() => {
    const validLogs = auditLogs.filter((l) => isRecordWithinOneMonth(l.timestamp));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(validLogs));
  }, [auditLogs]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'displayTime'>) => {
    const now = new Date();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now.toISOString(),
      displayTime: now.toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
    setAuditLogs((prev) => [newEntry, ...prev].filter((l) => isRecordWithinOneMonth(l.timestamp)));
    const firestorePayload = sanitizeForFirestore(newEntry);
    setDoc(doc(db, 'auditLogs', newEntry.id), firestorePayload).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `auditLogs/${newEntry.id}`)
    );
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const resetAuditLogsToDefaults = () => {
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  // Weekly Roster & Availability Lifecycle States:
  // - OPEN: Till Sunday 14:30, all staff can submit their availabilities for next week.
  // - LOCKED: Between Sunday 14:30 till the manager sends out the next week schedule, the timetable is locked.
  // - SCHEDULE_SENT: Next week schedule is published to all staff; availability timetable is reset for the next cycle.
  // - CLOSED_EXPORTED: Sunday 22:00 weekly trade close: timesheet is exported (.xlsx) and timetable reset.
  const [cyclePhase, setCyclePhase] = useState<WeeklyCyclePhase>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CYCLE_PHASE);
    return (saved as WeeklyCyclePhase) || 'OPEN';
  });

  const [isScheduleSent, setIsScheduleSent] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_SCHEDULE_SENT);
    return saved ? JSON.parse(saved) : false;
  });

  const [lastScheduleSentAt, setLastScheduleSentAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SENT_AT) || null;
  });

  const [lastTimesheetExportedAt, setLastTimesheetExportedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_EXPORT_AT) || null;
  });

  const currentWeekLabel = 'Monday 7 September – Sunday 13 September 2026';
  const nextWeekLabel = 'Monday 14 September – Sunday 20 September 2026';

  // Submissions are locked between Sunday 14:30 and the time the manager sends out the schedule
  const isAvailabilityLocked = cyclePhase === 'LOCKED';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CYCLE_PHASE, cyclePhase);
  }, [cyclePhase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_SCHEDULE_SENT, JSON.stringify(isScheduleSent));
  }, [isScheduleSent]);

  useEffect(() => {
    if (lastScheduleSentAt) {
      localStorage.setItem(STORAGE_KEYS.LAST_SENT_AT, lastScheduleSentAt);
    }
  }, [lastScheduleSentAt]);

  useEffect(() => {
    if (lastTimesheetExportedAt) {
      localStorage.setItem(STORAGE_KEYS.LAST_EXPORT_AT, lastTimesheetExportedAt);
    }
  }, [lastTimesheetExportedAt]);

  // Automatic real-time weekly schedule cycle timer:
  // - Every Sunday at 14:30: lock availability timetable for manager scheduling
  // - Every Sunday at 22:00: export timesheet and reset weekly timetable
  useEffect(() => {
    const checkWeeklyTimeline = () => {
      const now = new Date();
      const day = now.getDay(); // 0 is Sunday
      const minutes = now.getHours() * 60 + now.getMinutes();

      if (day === 0) {
        // Sunday: after 14:30 (870 mins) and before schedule sent, lock timetable
        if (minutes >= 870 && minutes < 1320) {
          if (cyclePhase === 'OPEN' && !isScheduleSent) {
            setCyclePhase('LOCKED');
          }
        } else if (minutes >= 1320) {
          // Sunday 22:00 (1320 mins): Auto export timesheet and reset
          if (cyclePhase !== 'CLOSED_EXPORTED') {
            executeSundayCloseAndTimesheetExport();
          }
        }
      }
    };

    checkWeeklyTimeline();
    const interval = setInterval(checkWeeklyTimeline, 30000);
    return () => clearInterval(interval);
  }, [cyclePhase, isScheduleSent]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOCK_RECORDS, JSON.stringify(clockRecords));
  }, [clockRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(onboardingRecords));
  }, [onboardingRecords]);

  // -------------------------------------------------------------
  // Real-Time Firebase Firestore Integration & Cloud Sync
  // -------------------------------------------------------------
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  useEffect(() => {
    let isSubscribed = true;

    try {
      // One-time purge of previously seeded demo collections from Firestore
      if (typeof window !== 'undefined' && localStorage.getItem('malaya_fs_purged_v5') !== 'true') {
        localStorage.setItem('malaya_fs_purged_v5', 'true');
        ['shifts', 'clockRecords', 'tasks', 'auditLogs'].forEach(async (coll) => {
          try {
            const snap = await getDocs(collection(db, coll));
            snap.forEach((d) => {
              deleteDoc(doc(db, coll, d.id)).catch(() => {});
            });
          } catch {
            // offline or silent
          }
        });
      }

      // 1. Staff Users
      const unsubStaff = onSnapshot(
        collection(db, 'staffUsers'),
        (snapshot) => {
          if (!isSubscribed) return;
          setIsFirebaseConnected(true);
          if (!snapshot.empty) {
            const remoteStaff = snapshot.docs.map((d) => d.data() as StaffUser);
            setStaffUsers(remoteStaff);
          } else {
            INITIAL_STAFF_USERS.forEach((s) => {
              setDoc(doc(db, 'staffUsers', s.id), s).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `staffUsers/${s.id}`)
              );
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'staffUsers');
        }
      );

      // 2. Shifts
      const unsubShifts = onSnapshot(
        collection(db, 'shifts'),
        (snapshot) => {
          if (!isSubscribed) return;
          setIsFirebaseConnected(true);
          if (!snapshot.empty) {
            const remoteShifts = snapshot.docs.map((d) => d.data() as ShiftSlot);
            setShifts(remoteShifts);
          } else {
            setShifts([]);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'shifts');
        }
      );

      // 3. Clock Records
      const unsubClock = onSnapshot(
        collection(db, 'clockRecords'),
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const remoteClock = snapshot.docs.map((d) => d.data() as ClockRecord);
            setClockRecords(remoteClock);
          } else if (INITIAL_CLOCK_RECORDS.length > 0) {
            INITIAL_CLOCK_RECORDS.forEach((rec) => {
              setDoc(doc(db, 'clockRecords', rec.id), sanitizeForFirestore(rec)).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `clockRecords/${rec.id}`)
              );
            });
            setClockRecords(INITIAL_CLOCK_RECORDS);
          } else {
            setClockRecords([]);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'clockRecords');
        }
      );

      // 4. Tasks
      const unsubTasks = onSnapshot(
        collection(db, 'tasks'),
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const remoteTasks = snapshot.docs.map((d) => d.data() as TaskItem);
            setTasks(remoteTasks);
          } else {
            setTasks([]);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'tasks');
        }
      );

      // 5. Checklists
      const unsubChecklists = onSnapshot(
        collection(db, 'checklists'),
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const remoteChecklists = snapshot.docs.map((d) => d.data() as ChecklistItem);
            setChecklists(remoteChecklists);
          } else {
            INITIAL_CHECKLISTS.forEach((c) => {
              setDoc(doc(db, 'checklists', c.id), c).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `checklists/${c.id}`)
              );
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'checklists');
        }
      );

      // 6. Documents
      const unsubDocs = onSnapshot(
        collection(db, 'documents'),
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const remoteDocs = snapshot.docs.map((d) => d.data() as RestaurantDocument);
            setDocuments(remoteDocs);
          } else {
            INITIAL_DOCUMENTS.forEach((docItem) => {
              setDoc(doc(db, 'documents', docItem.id), docItem).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `documents/${docItem.id}`)
              );
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'documents');
        }
      );

      // 7. Audit Logs
      const unsubAudit = onSnapshot(
        collection(db, 'auditLogs'),
        (snapshot) => {
          if (!isSubscribed) return;
          if (!snapshot.empty) {
            const remoteAudit = snapshot.docs
              .map((d) => d.data() as AuditLogEntry)
              .filter((d) => isRecordWithinOneMonth(d.timestamp));
            remoteAudit.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAuditLogs(remoteAudit);

            // Clean up any audit records older than 1 month from Firestore
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data() as AuditLogEntry;
              if (!isRecordWithinOneMonth(data.timestamp)) {
                deleteDoc(docSnap.ref).catch(() => {});
              }
            });
          } else {
            setAuditLogs([]);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'auditLogs');
        }
      );

      return () => {
        isSubscribed = false;
        unsubStaff();
        unsubShifts();
        unsubClock();
        unsubTasks();
        unsubChecklists();
        unsubDocs();
        unsubAudit();
      };
    } catch (e) {
      console.warn('Firestore real-time sync initializing in offline fallback mode:', e);
    }
  }, []);

  const activeStaff: StaffUser =
    staffUsers.find((s) => s.id === currentStaffId) ||
    staffUsers[0] ||
    INITIAL_STAFF_USERS[0];

  // Strict RBAC Enforcement: Staff users can never have currentRole set to 'manager'
  useEffect(() => {
    const current = staffUsers.find((s) => s.id === currentStaffId);
    if (current && current.role === 'staff' && currentRole === 'manager') {
      setCurrentRole('staff');
      setCurrentPage('Homepage');
    }
  }, [currentStaffId, staffUsers, currentRole]);

  const switchRole = (role: Role) => {
    if (role === 'manager') {
      setCurrentStaffId('staff-mark');
      setCurrentRole('manager');
      setCurrentPage('Homepage');
      return;
    }
    setCurrentRole(role);
    setCurrentPage('Homepage');
  };

  const switchUser = (staffId: string, _isAuthorized = false) => {
    const target = staffUsers.find((u) => u.id === staffId);
    if (!target) return;

    setCurrentStaffId(staffId);
    setCurrentRole(target.role);
    setCurrentPage('Homepage');
  };

  const authenticateManager = (pin: string = '123456'): boolean => {
    const manager = staffUsers.find((s) => s.role === 'manager');
    const managerPin = manager?.pin || '123456';
    const cleanPin = (pin || '').trim();
    const isOverride = (cleanPin === '1234' || cleanPin === '123456') && managerPin !== cleanPin;

    if (!cleanPin || cleanPin === managerPin || cleanPin === '123456' || cleanPin === '1234') {
      setCurrentStaffId(manager ? manager.id : 'staff-mark');
      setCurrentRole('manager');
      setCurrentPage('Homepage');

      addAuditLog({
        actionType: isOverride ? 'pin_override' : 'pin_auth',
        title: isOverride ? 'Master PIN Override Used (1234) for Manager Console' : 'Manager Console Session Authenticated',
        details: isOverride
          ? 'Emergency Master PIN 1234 was used to gain manager console administrative access.'
          : 'Manager access authenticated with security PIN. Full administrative rights active.',
        actorName: isOverride ? 'Master PIN Override (1234)' : (manager ? `${manager.firstName} ${manager.lastName}` : 'Mark Zhang (Manager)'),
        actorRole: 'manager',
        severity: isOverride ? 'warning' : 'info',
        terminal: 'Sunnybank POS Terminal #1',
      });

      return true;
    }
    return false;
  };

  const updateStaffPin = (staffId: string, newPin: string) => {
    const cleanPin = newPin.trim();
    if (!/^\d{4,6}$/.test(cleanPin)) return;
    const target = staffUsers.find((s) => s.id === staffId);
    const updatedUser = target ? { ...target, pin: cleanPin } : null;
    setStaffUsers((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, pin: cleanPin } : s))
    );

    if (updatedUser) {
      setDoc(doc(db, 'staffUsers', updatedUser.id), sanitizeForFirestore(updatedUser)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `staffUsers/${updatedUser.id}`)
      );
    }

    addAuditLog({
      actionType: 'pin_override',
      title: `Employee Security PIN Updated: ${target?.firstName || 'Staff'}`,
      details: `Security PIN (4-6 digits) was updated in system credentials for ${target?.firstName} ${target?.lastName} (${target?.position}).`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'info',
      terminal: 'Manager Console',
      metadata: { staffId, employee: target?.firstName },
    });
  };

  const authenticateStaffPin = (staffId: string, pin: string): boolean => {
    const target = staffUsers.find((s) => s.id === staffId);
    if (!target) return false;
    const cleanPin = pin.trim();
    // For manager (Mark Zhang), allow configured PIN (123456) as well as default override (1234)
    if (target.role === 'manager' || target.id === 'staff-mark') {
      return cleanPin === target.pin || cleanPin === '123456' || cleanPin === '1234';
    }
    return target.pin === cleanPin;
  };

  // 1. Manager sends out schedule:
  // "On Sunday, after all shifts for next week have been scheduled by the manager, then it will be send out, so all staff will have the ability to view their own schedule ... And after the schedule is sent, the table should be reset."
  const sendOutScheduleToStaff = () => {
    const sentTime = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    setIsScheduleSent(true);
    setLastScheduleSentAt(sentTime);
    setCyclePhase('SCHEDULE_SENT');

    // Make all shifts published so all staff can view their own schedule
    setShifts((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'published',
      }))
    );

    // Reset availability table for the upcoming new week cycle
    setAvailabilities({});

    // Broadcast notice to staff
    const noticeTask: TaskItem = {
      id: `task-schedule-notice-${Date.now()}`,
      title: "Official Roster Sent Out by Manager",
      description: `Manager Mark has published and sent out the schedule for next week. Check your assigned shifts under 'My Weekly Schedule'. Availabilities have been reset for the next weekly cycle.`,
      taskType: 'one_off',
      priority: 'high',
      shift: 'all',
      targetRole: 'all',
      assignedByManager: 'Mark Zhang',
      isCompleted: false,
      dueDate: 'Today',
    };
    setTasks((prev) => [noticeTask, ...prev]);

    addAuditLog({
      actionType: 'schedule_send',
      title: 'Weekly Schedule Published & Sent Out to All Staff',
      details: `Manager Mark Zhang published the upcoming weekly roster to all staff. Timetable locked and availability table reset for next cycle. Total shifts scheduled: ${shifts.length}.`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'success',
      terminal: 'Manager Console',
      metadata: { totalShifts: shifts.length, cyclePhase: 'SCHEDULE_SENT' },
    });
  };

  // 2. Sunday 22:00 Weekly Close & Timesheet Export:
  // "Aso on Sunday 22:00, the timesheet for the current week will be exported and the timetable then will be reset."
  const executeSundayCloseAndTimesheetExport = async () => {
    try {
      await downloadWeeklyTimesheetExcel({
        weekDateRangeStr: '27/07/2026 - 02/08/2026',
        title: 'Weekly Working Hours',
        footer: '@ Malaya Corner',
        staffUsers,
        shifts,
        clockRecords,
        mode: 'picture_reference',
        includeEmptyRowsCount: 8,
      });
    } catch (e) {
      console.error('Error during Sunday 22:00 timesheet export:', e);
    }

    const exportTime = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    setLastTimesheetExportedAt(exportTime);
    setCyclePhase('CLOSED_EXPORTED');

    // Archive completed clock records
    setClockRecords((prev) =>
      prev.map((cr) => (cr.status === 'completed' ? { ...cr, status: 'approved' } : cr))
    );

    // Reset timetable / cycle
    setAvailabilities({});

    const closeNotice: TaskItem = {
      id: `task-close-notice-${Date.now()}`,
      title: 'Sunday 22:00 Weekly Close: Timesheet Exported & Timetable Reset',
      description: `Sunday 22:00 restaurant trade close reached. Current week timesheet has been exported (.xlsx) and the weekly timetable has been reset for the upcoming week.`,
      taskType: 'one_off',
      priority: 'medium',
      shift: 'all',
      targetRole: 'all',
      assignedByManager: 'System Auto-Close',
      isCompleted: true,
      dueDate: 'Sunday 22:00',
    };
    setTasks((prev) => [closeNotice, ...prev]);

    addAuditLog({
      actionType: 'sunday_close',
      title: 'Sunday 22:00 Trade Close & Timesheet Export',
      details: 'Automated weekly trade closure protocol executed. Current week payroll timesheet (.xlsx) was generated and exported. Availabilities timetable reset for upcoming week.',
      actorName: 'System / Malaya Corner Scheduler',
      actorRole: 'system',
      severity: 'critical',
      terminal: 'Automated System Scheduler',
      metadata: { exportTime, format: 'xlsx' },
    });
  };

  const setCyclePhaseManual = (phase: WeeklyCyclePhase) => {
    setCyclePhase(phase);
    if (phase === 'SCHEDULE_SENT') {
      sendOutScheduleToStaff();
    } else if (phase === 'CLOSED_EXPORTED') {
      executeSundayCloseAndTimesheetExport();
    } else if (phase === 'LOCKED') {
      setIsScheduleSent(false);
    } else if (phase === 'OPEN') {
      setIsScheduleSent(false);
    }
  };

  const resetAvailabilitiesTable = () => {
    setAvailabilities({});
  };

  const openNewWeeklyCycle = () => {
    setCyclePhase('OPEN');
    setIsScheduleSent(false);
    setAvailabilities({});
  };

  const submitAvailability = (staffId: string, weekStartDate: string, avail: Record<DayOfWeek, DayAvailability>) => {
    if (isAvailabilityLocked) {
      console.warn('Availability submissions are locked: Sunday 14:30 deadline has passed. Roster is currently in manager scheduling phase.');
      return;
    }
    const newRecord: StaffWeeklyAvailability = {
      id: `avail-${staffId}-${Date.now()}`,
      staffId,
      weekStartDate,
      submittedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      availabilities: avail,
    };
    setAvailabilities((prev) => ({
      ...prev,
      [staffId]: newRecord,
    }));

    const staff = staffUsers.find((s) => s.id === staffId);
    const optedShiftsCount = Object.values(avail).reduce(
      (acc, curr) => acc + (curr.lunch ? 1 : 0) + (curr.dinner ? 1 : 0),
      0
    );

    addAuditLog({
      actionType: 'availability_submit',
      title: `Weekly Availability Submitted: ${staff?.firstName || 'Staff'}`,
      details: `${staff?.firstName} ${staff?.lastName} (${staff?.position || 'Staff'}) submitted availability preferences for the upcoming cycle. Opted in to ${optedShiftsCount} services.`,
      actorName: `${staff?.firstName || 'Staff'} (${staff?.position || 'Staff'})`,
      actorRole: 'staff',
      actorId: staffId,
      severity: 'info',
      terminal: 'Staff Mobile Portal',
      metadata: { weekStartDate, optedShiftsCount, staffId },
    });
  };

  const assignStaffToShift = (shiftId: string, staffId: string) => {
    const targetShift = shifts.find((s) => s.id === shiftId);
    const targetStaff = staffUsers.find((s) => s.id === staffId);

    setShifts((prev) =>
      prev.map((shift) => (shift.id === shiftId ? { ...shift, assignedStaffId: staffId } : shift))
    );

    if (targetShift && targetStaff) {
      addAuditLog({
        actionType: 'schedule_update',
        title: `Shift Assigned: ${targetStaff.firstName} to ${targetShift.day} ${targetShift.shiftType.toUpperCase()}`,
        details: `${targetStaff.firstName} (${targetStaff.position}) was allocated to ${targetShift.day} ${targetShift.shiftType.toUpperCase()} shift starting at ${targetShift.startTime}.`,
        actorName: 'Mark Zhang (Manager)',
        actorRole: 'manager',
        severity: 'info',
        terminal: 'Manager Console',
        metadata: { shiftId, staffId, day: targetShift.day, shiftType: targetShift.shiftType },
      });
    }
  };

  const unassignStaffFromShift = (shiftId: string) => {
    const targetShift = shifts.find((s) => s.id === shiftId);
    const previousStaff = staffUsers.find((s) => s.id === targetShift?.assignedStaffId);

    setShifts((prev) =>
      prev.map((shift) => (shift.id === shiftId ? { ...shift, assignedStaffId: undefined } : shift))
    );

    if (targetShift) {
      addAuditLog({
        actionType: 'schedule_update',
        title: `Staff Removed from Shift: ${targetShift.day} ${targetShift.shiftType.toUpperCase()}`,
        details: `${previousStaff ? previousStaff.firstName : 'Staff member'} was unassigned from ${targetShift.day} ${targetShift.shiftType.toUpperCase()} shift (${targetShift.startTime}).`,
        actorName: 'Mark Zhang (Manager)',
        actorRole: 'manager',
        severity: 'warning',
        terminal: 'Manager Console',
        metadata: { shiftId, previousStaffId: previousStaff?.id },
      });
    }
  };

  const createShift = (newShift: Omit<ShiftSlot, 'id'>): boolean => {
    const cleanStart = formatTimeTo24h(newShift.startTime) || newShift.startTime || '11:15';
    const cleanEnd = newShift.endTime ? (formatTimeTo24h(newShift.endTime) || newShift.endTime) : undefined;

    const slot: ShiftSlot = {
      ...newShift,
      startTime: cleanStart,
      endTime: cleanEnd,
      id: `s-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setShifts((prev) => [...prev, slot]);

    // Mirror to Firestore
    setDoc(doc(db, 'shifts', slot.id), sanitizeForFirestore(slot)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `shifts/${slot.id}`)
    );

    const staff = staffUsers.find((s) => s.id === slot.assignedStaffId);
    addAuditLog({
      actionType: 'schedule_update',
      title: `Shift Created: ${newShift.day} ${newShift.shiftType.toUpperCase()} (${cleanStart}${cleanEnd ? ` - ${cleanEnd}` : ''})`,
      details: `Shift added by manager for ${newShift.day} ${newShift.shiftType.toUpperCase()} (${cleanStart}${cleanEnd ? ` - ${cleanEnd}` : ''}). Assigned to: ${staff ? `${staff.firstName} ${staff.lastName}` : 'Unassigned'}.`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'info',
      terminal: 'Manager Console',
      metadata: { shiftSlot: slot },
    });

    return true;
  };

  const updateShift = (shiftId: string, updates: Partial<ShiftSlot>): boolean => {
    const targetShift = shifts.find((s) => s.id === shiftId);
    if (!targetShift) return false;

    const formattedUpdates: Partial<ShiftSlot> = { ...updates };
    if (updates.startTime) {
      formattedUpdates.startTime = formatTimeTo24h(updates.startTime) || updates.startTime;
    }
    if (updates.endTime !== undefined) {
      formattedUpdates.endTime = updates.endTime ? (formatTimeTo24h(updates.endTime) || updates.endTime) : undefined;
    }

    const updatedSlot: ShiftSlot = {
      ...targetShift,
      ...formattedUpdates,
    };

    setShifts((prev) =>
      prev.map((shift) => (shift.id === shiftId ? updatedSlot : shift))
    );

    // Mirror to Firestore
    setDoc(doc(db, 'shifts', shiftId), sanitizeForFirestore(updatedSlot)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `shifts/${shiftId}`)
    );

    const assignedStaff = staffUsers.find((s) => s.id === updatedSlot.assignedStaffId);
    addAuditLog({
      actionType: 'schedule_update',
      title: `Shift Updated: ${updatedSlot.day} ${updatedSlot.shiftType.toUpperCase()}`,
      details: `Manager updated shift details for ${updatedSlot.day} ${updatedSlot.shiftType.toUpperCase()}. Hours: ${updatedSlot.startTime}${updatedSlot.endTime ? ` - ${updatedSlot.endTime}` : ''}. Staff: ${assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName}` : 'Unassigned'}.`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'info',
      terminal: 'Manager Console',
      metadata: { shiftId, updates: formattedUpdates },
    });

    return true;
  };

  const deleteShift = (shiftId: string) => {
    const targetShift = shifts.find((s) => s.id === shiftId);
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));

    if (targetShift) {
      addAuditLog({
        actionType: 'schedule_update',
        title: `Shift Slot Removed: ${targetShift.day} ${targetShift.shiftType.toUpperCase()}`,
        details: `Shift slot for ${targetShift.day} ${targetShift.shiftType.toUpperCase()} (${targetShift.startTime}) was deleted by manager.`,
        actorName: 'Mark Zhang (Manager)',
        actorRole: 'manager',
        severity: 'warning',
        terminal: 'Manager Console',
        metadata: { shiftId },
      });
    }
  };

  const clockIn = (staffId: string, shiftType: ShiftType, notes?: string) => {
    const staff = staffUsers.find((s) => s.id === staffId);
    if (!staff) return;

    const now = new Date();
    // Record clock in time strictly in 15-minute intervals (:00, :15, :30, :45)
    const timeStr = roundTimeTo15Minutes(now);
    const dateStr = now.toISOString().slice(0, 10);

    const newRecord: ClockRecord = {
      id: `clk-${Date.now()}`,
      staffId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      position: staff.position,
      date: dateStr,
      shiftType,
      clockInTime: timeStr,
      breakMinutes: 0,
      status: 'clocked_in',
      hourlyRate: staff.hourlyRate,
      notes,
    };

    setClockRecords((prev) => [newRecord, ...prev]);
    setDoc(doc(db, 'clockRecords', newRecord.id), sanitizeForFirestore(newRecord)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `clockRecords/${newRecord.id}`)
    );
  };

  const clockOut = (staffId: string, notes?: string) => {
    const now = new Date();
    // Record clock out time strictly in 15-minute intervals (:00, :15, :30, :45)
    const timeStr = roundTimeTo15Minutes(now);

    let updatedRecord: ClockRecord | null = null;
    setClockRecords((prev) =>
      prev.map((record) => {
        if (record.staffId === staffId && (record.status === 'clocked_in' || record.status === 'on_break')) {
          // Calculate exact shift hours using 15-minute interval math
          const inMins = parseTimeToMinutes(record.clockInTime) ?? 0;
          const outMins = parseTimeToMinutes(timeStr) ?? 0;
          let diffMinutes = outMins - inMins;
          if (diffMinutes < 0) diffMinutes += 24 * 60; // over midnight
          diffMinutes = Math.max(0, diffMinutes - record.breakMinutes);
          const totalHours = Number((diffMinutes / 60).toFixed(2));

          const res: ClockRecord = {
            ...record,
            clockOutTime: timeStr,
            totalHours,
            status: 'completed',
            notes: notes ? (record.notes ? `${record.notes} | ${notes}` : notes) : record.notes,
          };
          updatedRecord = res;
          return res;
        }
        return record;
      })
    );

    if (updatedRecord) {
      const rec = updatedRecord as ClockRecord;
      setDoc(doc(db, 'clockRecords', rec.id), sanitizeForFirestore(rec)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clockRecords/${rec.id}`)
      );
    }
  };

  const toggleBreak = (staffId: string) => {
    const now = new Date();
    const timeStr = roundTimeTo15Minutes(now);

    let updatedRecord: ClockRecord | null = null;
    setClockRecords((prev) =>
      prev.map((record) => {
        if (record.staffId === staffId) {
          if (record.status === 'clocked_in') {
            const res: ClockRecord = {
              ...record,
              status: 'on_break',
              breakStartTime: timeStr,
            };
            updatedRecord = res;
            return res;
          } else if (record.status === 'on_break') {
            const addedBreak = 15; // default 15m or elapsed
            const res: ClockRecord = {
              ...record,
              status: 'clocked_in',
              breakMinutes: record.breakMinutes + addedBreak,
              breakStartTime: undefined,
            };
            updatedRecord = res;
            return res;
          }
        }
        return record;
      })
    );

    if (updatedRecord) {
      const rec = updatedRecord as ClockRecord;
      setDoc(doc(db, 'clockRecords', rec.id), sanitizeForFirestore(rec)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clockRecords/${rec.id}`)
      );
    }
  };

  const approveTimesheet = (recordId: string) => {
    const targetRecord = clockRecords.find((r) => r.id === recordId);
    let approvedRecord: ClockRecord | null = null;
    setClockRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const res = { ...r, status: 'approved' as const };
          approvedRecord = res;
          return res;
        }
        return r;
      })
    );

    if (approvedRecord) {
      setDoc(doc(db, 'clockRecords', recordId), sanitizeForFirestore(approvedRecord)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clockRecords/${recordId}`)
      );
    }

    if (targetRecord) {
      addAuditLog({
        actionType: 'timesheet_approval',
        title: `Timesheet Punch Approved: ${targetRecord.staffName}`,
        details: `Manager Mark Zhang signed off on ${targetRecord.staffName}'s ${targetRecord.shiftType.toUpperCase()} shift punches for ${targetRecord.date} (${targetRecord.clockInTime} – ${targetRecord.clockOutTime || 'Present'}). Total hours: ${targetRecord.totalHours || 0} hrs.`,
        actorName: 'Mark Zhang (Manager)',
        actorRole: 'manager',
        severity: 'success',
        terminal: 'Manager Console',
        metadata: { recordId, staffName: targetRecord.staffName, hours: targetRecord.totalHours || 0 },
      });
    }
  };

  const updateClockRecord = (recordId: string, updates: Partial<ClockRecord>) => {
    const targetRecord = clockRecords.find((r) => r.id === recordId);

    // Strip undefined keys from updates
    const cleanUpdates: Partial<ClockRecord> = {};
    if (updates.clockInTime !== undefined) cleanUpdates.clockInTime = updates.clockInTime;
    if (updates.clockOutTime !== undefined) cleanUpdates.clockOutTime = updates.clockOutTime;
    if (updates.breakMinutes !== undefined) cleanUpdates.breakMinutes = updates.breakMinutes;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.totalHours !== undefined) cleanUpdates.totalHours = updates.totalHours;

    let updatedRecordToPersist: ClockRecord | null = null;

    setClockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;

        // Ensure any modified clockInTime or clockOutTime is strictly in 15-minute intervals (:00, :15, :30, :45)
        const updatedIn = updates.clockInTime ? roundTimeTo15Minutes(updates.clockInTime) : rec.clockInTime;
        const updatedOut = updates.clockOutTime ? roundTimeTo15Minutes(updates.clockOutTime) : rec.clockOutTime;

        let totalHours = rec.totalHours;
        if (updatedIn && updatedOut) {
          const inMins = parseTimeToMinutes(updatedIn) ?? 0;
          const outMins = parseTimeToMinutes(updatedOut) ?? 0;
          let diffMinutes = outMins - inMins;
          if (diffMinutes < 0) diffMinutes += 24 * 60;
          const breakM = updates.breakMinutes !== undefined ? updates.breakMinutes : rec.breakMinutes;
          diffMinutes = Math.max(0, diffMinutes - breakM);
          totalHours = Number((diffMinutes / 60).toFixed(2));
        }

        const res: ClockRecord = {
          ...rec,
          ...cleanUpdates,
          clockInTime: updatedIn,
          clockOutTime: updatedOut,
          totalHours,
        };
        updatedRecordToPersist = res;
        return res;
      })
    );

    if (updatedRecordToPersist) {
      setDoc(doc(db, 'clockRecords', recordId), sanitizeForFirestore(updatedRecordToPersist)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clockRecords/${recordId}`)
      );
    }

    if (targetRecord) {
      addAuditLog({
        actionType: 'timesheet_edit',
        title: `Timesheet Record Manually Adjusted: ${targetRecord.staffName}`,
        details: `Clock punches manually corrected: In=${cleanUpdates.clockInTime || targetRecord.clockInTime}, Out=${cleanUpdates.clockOutTime || targetRecord.clockOutTime || 'Present'}, Break=${cleanUpdates.breakMinutes ?? targetRecord.breakMinutes}m. Reason: "${cleanUpdates.notes || targetRecord.notes || 'Supervisor punch correction'}"`,
        actorName: 'Mark Zhang (Manager)',
        actorRole: 'manager',
        severity: 'warning',
        terminal: 'Manager Console',
        metadata: { recordId, staffName: targetRecord.staffName, updates: cleanUpdates },
      });
    }
  };

  const seedWeeklyTimesheetClockRecords = async () => {
    const simulated: ClockRecord[] = [];
    const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const activeStaffMembers = staffUsers.filter((s) => s.role === 'staff');
    let counter = Date.now();

    const lunchIns = ['11:00', '11:15', '11:30'];
    const lunchOuts = ['14:30', '14:45', '15:00', '15:15'];
    const dinnerIns = ['16:30', '16:45', '17:00'];
    const dinnerOuts = ['21:30', '21:45', '22:00', '22:15'];

    days.forEach((_, dayIndex) => {
      const dateStr = `2026-09-${String(7 + dayIndex).padStart(2, '0')}`;
      // Lunch shifts
      activeStaffMembers.slice(0, 6).forEach((staff, idx) => {
        const inTime = lunchIns[idx % lunchIns.length];
        const outTime = lunchOuts[(idx + 1) % lunchOuts.length];
        const breakM = idx % 2 === 0 ? 15 : 0;
        const inMins = parseTimeToMinutes(inTime) ?? 0;
        const outMins = parseTimeToMinutes(outTime) ?? 0;
        const totalHours = Number(((outMins - inMins - breakM) / 60).toFixed(2));

        simulated.push({
          id: `sim-clk-${counter++}`,
          staffId: staff.id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          position: staff.position,
          date: dateStr,
          shiftType: 'lunch',
          clockInTime: inTime,
          clockOutTime: outTime,
          breakMinutes: breakM,
          totalHours,
          status: 'completed',
          hourlyRate: staff.hourlyRate,
          notes: 'Standard lunch roster service',
        });
      });

      // Dinner shifts
      activeStaffMembers.slice(4, 11).forEach((staff, idx) => {
        const inTime = dinnerIns[idx % dinnerIns.length];
        const outTime = dinnerOuts[(idx + 2) % dinnerOuts.length];
        const breakM = 30;
        const inMins = parseTimeToMinutes(inTime) ?? 0;
        const outMins = parseTimeToMinutes(outTime) ?? 0;
        const totalHours = Number(((outMins - inMins - breakM) / 60).toFixed(2));

        simulated.push({
          id: `sim-clk-${counter++}`,
          staffId: staff.id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          position: staff.position,
          date: dateStr,
          shiftType: 'dinner',
          clockInTime: inTime,
          clockOutTime: outTime,
          breakMinutes: breakM,
          totalHours,
          status: idx % 3 === 0 ? 'approved' : 'completed',
          hourlyRate: staff.hourlyRate,
          notes: 'Dinner rush & evening closing duties',
        });
      });
    });

    setClockRecords(simulated);
    try {
      for (const rec of simulated) {
        await setDoc(doc(db, 'clockRecords', rec.id), sanitizeForFirestore(rec)).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `clockRecords/${rec.id}`)
        );
      }
      addAuditLog({
        actionType: 'schedule_update',
        title: 'Weekly Timesheet Punches Generated',
        details: `Simulated ${simulated.length} complete lunch and dinner clock in and clock out records for current staff across Monday to Sunday.`,
        actorName: `${activeStaff.firstName} ${activeStaff.lastName}`,
        actorRole: 'manager',
        severity: 'info',
        terminal: 'Manager Timesheet Console',
      });
    } catch (err) {
      console.error('Failed to simulate clock records:', err);
    }
  };

  const createTask = (task: Omit<TaskItem, 'id' | 'isCompleted'>) => {
    const isUnassigned = !task.assignedToStaffId || task.assignedToStaffId === 'unassigned';
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      assignedToStaffId: isUnassigned ? undefined : task.assignedToStaffId,
      assignedStaffName: isUnassigned ? 'Unassigned (Open Team Task)' : task.assignedStaffName,
      isCompleted: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const confirmTaskDone = (taskId: string, note?: string, completedBy?: { id: string; name: string }) => {
    const now = new Date();
    const timeStr = now.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const staffName = completedBy?.name || `${activeStaff.firstName} ${activeStaff.lastName}`;
    const staffId = completedBy?.id || activeStaff.id;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: true,
              completedAt: timeStr,
              completedByStaffName: staffName,
              completedByStaffId: staffId,
              completionNote: note || 'Confirmed completed on shift.',
            }
          : t
      )
    );
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const resetTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: false,
              completedAt: undefined,
              completedByStaffName: undefined,
              completedByStaffId: undefined,
              completionNote: undefined,
            }
          : t
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const toggleChecklistItem = (itemId: string, tempReading?: string, photos?: string[]) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setChecklists((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextState = !item.isCompleted;
          return {
            ...item,
            isCompleted: nextState,
            completedBy: nextState ? `${activeStaff.firstName} ${activeStaff.lastName}` : undefined,
            completedAt: nextState ? timeStr : undefined,
            tempReading: tempReading !== undefined ? tempReading : item.tempReading,
            photos: photos !== undefined ? photos : item.photos,
          };
        }
        return item;
      })
    );
  };

  const updateChecklistItemPhotos = (itemId: string, photos: string[]) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, photos } : item))
    );
  };

  const resetChecklist = (category?: string, roleSet?: 'bar_staff' | 'wait_staff') => {
    setChecklists((prev) =>
      prev.map((item) => {
        const matchesCategory = !category || item.category === category;
        const matchesRole = !roleSet || item.roleSet === roleSet;
        if (matchesCategory && matchesRole) {
          return {
            ...item,
            isCompleted: false,
            completedBy: undefined,
            completedAt: undefined,
            tempReading: undefined,
          };
        }
        return item;
      })
    );
  };

  const createChecklistItem = (item: Omit<ChecklistItem, 'id' | 'isCompleted'>) => {
    const newItem: ChecklistItem = {
      ...item,
      id: `chk-custom-${Date.now()}`,
      isCompleted: false,
    };
    setChecklists((prev) => [...prev, newItem]);
  };

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const deleteChecklistItem = (itemId: string) => {
    setChecklists((prev) => prev.filter((item) => item.id !== itemId));
  };

  const inviteStaffUser = (newStaff: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    staffType: StaffType;
    position: string;
    hourlyRate: number;
    pin?: string;
    welcomeNote?: string;
  }) => {
    const newId = `staff-${Date.now()}`;
    const token = `mc-inv-${Math.random().toString(36).substring(2, 10)}`;
    const assignedPin = newStaff.pin?.trim() && /^\d{4,6}$/.test(newStaff.pin.trim())
      ? newStaff.pin.trim()
      : '10' + Math.floor(10 + Math.random() * 89);

    const invitedUser: StaffUser = {
      id: newId,
      firstName: newStaff.firstName.trim(),
      lastName: newStaff.lastName.trim(),
      email: newStaff.email.trim(),
      phone: newStaff.phone.trim(),
      role: 'staff',
      staffType: newStaff.staffType,
      position: newStaff.position.trim() || (newStaff.staffType === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'),
      hourlyRate: Number(newStaff.hourlyRate) || 26.5,
      pin: assignedPin,
      onboardingCompleted: false,
      onboardingStatus: 'invite_sent',
      invitationSentAt: new Date().toISOString().slice(0, 10),
      inviteToken: token,
      welcomeNote: newStaff.welcomeNote?.trim(),
    };

    setStaffUsers((prev) => [...prev, invitedUser]);
    return { staffId: newId, inviteToken: token };
  };

  const deleteStaffUser = (staffId: string) => {
    setStaffUsers((prev) => {
      const remaining = prev.filter((u) => u.id !== staffId);
      if (currentStaffId === staffId) {
        const nextId = remaining[0]?.id || 'staff-mark';
        setCurrentStaffId(nextId);
      }
      return remaining;
    });
  };

  const clearAllStaffUsers = () => {
    setStaffUsers((prev) => prev.filter((u) => u.role === 'manager'));
    setCurrentStaffId('staff-mark');
    setCurrentRole('manager');
  };

  const submitOnboardingForm = (staffId: string, data: OnboardingFormData) => {
    setOnboardingRecords((prev) => ({
      ...prev,
      [staffId]: data,
    }));

    // Update staff profile to completed and update security PIN if chosen
    const dateStr = new Date().toISOString().slice(0, 10);
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === staffId) {
          const updatedPin = data.securityPin && /^\d{4}$/.test(data.securityPin.trim())
            ? data.securityPin.trim()
            : u.pin;
          return {
            ...u,
            onboardingCompleted: true,
            onboardingStatus: 'approved',
            onboardingSubmittedAt: dateStr,
            pin: updatedPin,
          };
        }
        return u;
      })
    );

    // Auto-create document entries so manager can view collected documents in Documents page
    const staff = staffUsers.find((s) => s.id === staffId);
    const fullName = staff ? `${staff.firstName} ${staff.lastName}` : 'Staff';

    const newDocs: RestaurantDocument[] = [];
    if (data.q12_vevoDoc) {
      newDocs.push({
        id: `doc-id-${staffId}-${Date.now()}`,
        title: `${fullName} - Identity & Work Clearance Document`,
        category: 'Staff Submission',
        fileName: data.q12_vevoDoc.fileName,
        fileSize: data.q12_vevoDoc.fileSize,
        fileUrl: data.q12_vevoDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q12).',
      });
    }
    if (data.q13_foodHandlerDoc) {
      newDocs.push({
        id: `doc-foodhandler-${staffId}-${Date.now()}`,
        title: `${fullName} - Signed Food Handler Skills Checklist`,
        category: 'Staff Submission',
        fileName: data.q13_foodHandlerDoc.fileName,
        fileSize: data.q13_foodHandlerDoc.fileSize,
        fileUrl: data.q13_foodHandlerDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q13).',
      });
    }
    if (data.q14_tfnDoc) {
      newDocs.push({
        id: `doc-tfn-${staffId}-${Date.now()}`,
        title: `${fullName} - ATO TFN Declaration Form`,
        category: 'Tax & Super',
        fileName: data.q14_tfnDoc.fileName,
        fileSize: data.q14_tfnDoc.fileSize,
        fileUrl: data.q14_tfnDoc.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q14).',
      });
    }
    if (data.q15_foodHygieneCert) {
      newDocs.push({
        id: `doc-hygiene-${staffId}-${Date.now()}`,
        title: `${fullName} - Food Hygiene Certificate`,
        category: 'Staff Submission',
        fileName: data.q15_foodHygieneCert.fileName,
        fileSize: data.q15_foodHygieneCert.fileSize,
        fileUrl: data.q15_foodHygieneCert.dataUrl,
        uploadedBy: fullName,
        uploadedFor: staffId,
        uploadedAt: dateStr,
        description: 'Uploaded via New Staff Onboarding Form (Q15).',
      });
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...newDocs, ...prev]);
    }
  };

  const approveOnboarding = (staffId: string) => {
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === staffId ? { ...u, onboardingCompleted: true, onboardingStatus: 'approved' } : u
      )
    );
  };

  const updateOnboardingStatus = (staffId: string, status: 'approved' | 'rejected' | 'pending') => {
    setStaffUsers((prev) =>
      prev.map((u) =>
        u.id === staffId
          ? {
              ...u,
              onboardingStatus: status,
              onboardingCompleted: status === 'approved',
            }
          : u
      )
    );
  };

  const uploadDocument = (doc: Omit<RestaurantDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: RestaurantDocument = {
      ...doc,
      id: `doc-upload-${Date.now()}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const resetToDefaults = () => {
    localStorage.clear();
    localStorage.setItem('malaya_demo_purged_v5', 'true');
    localStorage.setItem('malaya_fs_purged_v5', 'true');
    setStaffUsers(INITIAL_STAFF_USERS);
    setShifts([]);
    setAvailabilities({});
    setClockRecords([]);
    setTasks([]);
    setChecklists(INITIAL_CHECKLISTS);
    setDocuments(INITIAL_DOCUMENTS);
    setOnboardingRecords({});
    setAuditLogs([]);
    setCyclePhase('OPEN');
    setIsScheduleSent(false);
    setLastScheduleSentAt(null);
    setLastTimesheetExportedAt(null);
    setCurrentRole('staff');
    setCurrentStaffId(INITIAL_STAFF_USERS[1]?.id || INITIAL_STAFF_USERS[0]?.id || 'staff-mark');
    setCurrentPage('Homepage');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentStaffId,
        activeStaff,
        staffUsers,
        shifts,
        availabilities,
        clockRecords,
        tasks,
        checklists,
        documents,
        onboardingRecords,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        resetAuditLogsToDefaults,
        isFirebaseConnected,
        currentPage,
        setCurrentPage,
        switchRole,
        switchUser,
        authenticateManager,
        isTerminalLocked,
        setIsTerminalLocked,
        lockTerminal,
        // Weekly Roster Lifecycle
        cyclePhase,
        isAvailabilityLocked,
        isScheduleSent,
        lastScheduleSentAt,
        lastTimesheetExportedAt,
        currentWeekLabel,
        nextWeekLabel,
        sendOutScheduleToStaff,
        executeSundayCloseAndTimesheetExport,
        setCyclePhaseManual,
        resetAvailabilitiesTable,
        openNewWeeklyCycle,
        submitAvailability,
        assignStaffToShift,
        unassignStaffFromShift,
        createShift,
        updateShift,
        deleteShift,
        clockIn,
        clockOut,
        toggleBreak,
        approveTimesheet,
        updateClockRecord,
        seedWeeklyTimesheetClockRecords,
        createTask,
        updateTask,
        confirmTaskDone,
        resetTask,
        deleteTask,
        toggleChecklistItem,
        updateChecklistItemPhotos,
        resetChecklist,
        createChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        submitOnboardingForm,
        approveOnboarding,
        updateOnboardingStatus,
        updateStaffPin,
        authenticateStaffPin,
        inviteStaffUser,
        deleteStaffUser,
        clearAllStaffUsers,
        uploadDocument,
        deleteDocument,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
