import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DayOfWeek, DayAvailability } from '../../types';
import {
  Calendar as CalendarIcon,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  HelpCircle,
  Clock,
  RotateCcw,
  Lock,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const StaffAvailability: React.FC = () => {
  const {
    activeStaff,
    availabilities,
    submitAvailability,
    setCurrentPage,
    cyclePhase,
    isAvailabilityLocked,
    isScheduleSent,
    lastScheduleSentAt,
  } = useApp();

  // Get current saved availability for this staff
  const existingRecord = availabilities[activeStaff.id];

  const defaultState: Record<DayOfWeek, DayAvailability> = {
    MON: { lunch: false, dinner: false },
    TUE: { lunch: false, dinner: false },
    WED: { lunch: false, dinner: false },
    THU: { lunch: false, dinner: false },
    FRI: { lunch: false, dinner: false },
    SAT: { lunch: false, dinner: false },
    SUN: { lunch: false, dinner: false },
  };

  const [formAvail, setFormAvail] = useState<Record<DayOfWeek, DayAvailability>>(() => {
    return existingRecord?.availabilities || defaultState;
  });

  const [submittedAlert, setSubmittedAlert] = useState(false);

  useEffect(() => {
    if (existingRecord?.availabilities) {
      setFormAvail(existingRecord.availabilities);
    } else {
      setFormAvail(defaultState);
    }
  }, [existingRecord, activeStaff.id]);

  const toggleShift = (day: DayOfWeek, shift: 'lunch' | 'dinner') => {
    if (isAvailabilityLocked) return;
    setFormAvail((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: !prev[day][shift],
      },
    }));
    setSubmittedAlert(false);
  };

  const selectAll = (shiftType?: 'lunch' | 'dinner') => {
    if (isAvailabilityLocked) return;
    setFormAvail((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d] = {
          lunch: shiftType ? (shiftType === 'lunch' ? true : prev[d].lunch) : true,
          dinner: shiftType ? (shiftType === 'dinner' ? true : prev[d].dinner) : true,
        };
      });
      return next;
    });
    setSubmittedAlert(false);
  };

  const clearAll = () => {
    if (isAvailabilityLocked) return;
    setFormAvail(defaultState);
    setSubmittedAlert(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAvailabilityLocked) return;
    submitAvailability(activeStaff.id, '2026-09-07', formAvail);
    setSubmittedAlert(true);
    setTimeout(() => {
      setSubmittedAlert(false);
    }, 6000);
  };

  // Count total selected shifts
  const totalSelectedShifts = DAYS.reduce((acc, day) => {
    let count = 0;
    if (formAvail[day].lunch) count++;
    if (formAvail[day].dinner) count++;
    return acc + count;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            Weekly Shift Availability
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Availability Calendar
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Submit your available lunch and dinner shifts for the upcoming week. Shifts indicate start times; finish times are flexible suggestions based on trade volume and closing duties.
          </p>
        </div>

        {existingRecord && (
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block">Last Submitted:</span>
            <span>{existingRecord.submittedAt}</span>
          </div>
        )}
      </div>

      {/* Roster Lifecycle Status Banners */}
      {isAvailabilityLocked ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Timetable Submissions Locked</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-400">
                  Closed at Sunday 14:30
                </span>
              </div>
              <div className="text-amber-800 mt-0.5 leading-relaxed">
                Availability submissions for next week closed on <strong>Sunday at 14:30</strong>. Manager Mark is currently scheduling the roster. The timetable is locked and no one can submit or change availability. Once the schedule is sent out, the table will reset for the new cycle.
              </div>
            </div>
          </div>
        </div>
      ) : isScheduleSent ? (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>Next Week's Schedule Has Been Sent Out!</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-400">
                  Published
                </span>
              </div>
              <div className="text-emerald-800 mt-0.5 leading-relaxed">
                Manager Mark has published and sent out next week's schedule. Check your confirmed shifts under <strong>My Weekly Schedule</strong>. Availabilities have been reset for the next weekly cycle!
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage('My Schedule')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors shadow-xs"
          >
            View My Schedule
          </button>
        </div>
      ) : cyclePhase === 'CLOSED_EXPORTED' ? (
        <div className="p-4 bg-purple-50 border border-purple-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-purple-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-purple-950 flex items-center gap-2">
                <span>Sunday 22:00 Trade Close & Timetable Reset</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full border border-purple-400">
                  Exported & Reset
                </span>
              </div>
              <div className="text-purple-800 mt-0.5 leading-relaxed">
                Sunday 22:00 trade close reached. Current week timesheet has been exported (.xlsx) and the weekly availability timetable has been reset.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold text-indigo-900">Weekly Submissions Open: </span>
              <span className="text-indigo-800">
                All staff can submit availabilities for next week every week until <strong>Sunday 14:30</strong>.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
            Open Until Sun 14:30
          </span>
        </div>
      )}

      {/* Success Notification */}
      {submittedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Availability Submitted Successfully!</span> Your selected {totalSelectedShifts} shifts have been updated in the database and are now live on Manager Mark’s Weekly Schedule planner.
          </div>
        </div>
      )}

      {/* Quick Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Quick Select:</span>
          <button
            type="button"
            disabled={isAvailabilityLocked}
            onClick={() => selectAll()}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              isAvailabilityLocked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
            }`}
          >
            All Shifts (14)
          </button>
          <button
            type="button"
            disabled={isAvailabilityLocked}
            onClick={() => selectAll('lunch')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors border ${
              isAvailabilityLocked
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 cursor-pointer'
            }`}
          >
            All Lunches (7)
          </button>
          <button
            type="button"
            disabled={isAvailabilityLocked}
            onClick={() => selectAll('dinner')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors border ${
              isAvailabilityLocked
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 cursor-pointer'
            }`}
          >
            All Dinners (7)
          </button>
          <button
            type="button"
            disabled={isAvailabilityLocked}
            onClick={clearAll}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${
              isAvailabilityLocked
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-500 hover:text-red-600 cursor-pointer'
            }`}
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
            <span>Unavailable</span>
          </div>
          <span className="font-bold text-slate-900 bg-indigo-50 px-2.5 py-1 rounded-lg text-indigo-800 border border-indigo-200">
            {totalSelectedShifts} Shifts Selected
          </span>
        </div>
      </div>

      {/* Weekly Calendar Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-800">
              Weekly Shift Selection: Everyday has 2 shifts (Lunch & Dinner)
            </span>
            <span className="text-xs text-slate-500 hidden sm:block">
              Click any shift slot to toggle your availability
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {DAYS.map((day) => {
              const dayData = formAvail[day];
              const isWeekend = day === 'SAT' || day === 'SUN';

              return (
                <div key={day} className="flex flex-col bg-white">
                  {/* Day Header */}
                  <div
                    className={`p-2.5 sm:p-3 border-b border-slate-200 text-center flex md:flex-col items-center justify-between md:justify-center ${
                      isWeekend ? 'bg-orange-50/60' : 'bg-slate-100/70'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-slate-800">{day}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {isWeekend ? 'Peak Trading' : 'Standard'}
                    </div>
                  </div>

                  {/* Shifts Toggles: 2 columns on mobile, vertical stack on desktop */}
                  <div className="p-3 grid grid-cols-2 gap-2.5 md:flex md:flex-col md:space-y-3 flex-1">
                    {/* Shift 1: Lunch */}
                    <button
                      type="button"
                      disabled={isAvailabilityLocked}
                      onClick={() => toggleShift(day, 'lunch')}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        isAvailabilityLocked
                          ? dayData.lunch
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 opacity-90 cursor-not-allowed'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          : dayData.lunch
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-2 ring-emerald-400/30 cursor-pointer'
                          : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Sun className={`w-3.5 h-3.5 ${dayData.lunch ? 'text-amber-600' : 'text-slate-400'}`} />
                          Lunch
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            dayData.lunch ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {dayData.lunch ? 'CAN WORK' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-medium">
                        11:15 start
                      </div>
                    </button>

                    {/* Shift 2: Dinner */}
                    <button
                      type="button"
                      disabled={isAvailabilityLocked}
                      onClick={() => toggleShift(day, 'dinner')}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        isAvailabilityLocked
                          ? dayData.dinner
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 opacity-90 cursor-not-allowed'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          : dayData.dinner
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-2 ring-emerald-400/30 cursor-pointer'
                          : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Moon className={`w-3.5 h-3.5 ${dayData.dinner ? 'text-indigo-600' : 'text-slate-400'}`} />
                          Dinner
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            dayData.dinner ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {dayData.dinner ? 'CAN WORK' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-medium">
                        16:45 start
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Weekly Submission Timeline</span>
              Availabilities for next week are open until <strong>Sunday 14:30</strong>. From Sunday 14:30 until the manager sends out the schedule, the timetable is locked. Once sent out, the table resets for the next cycle.
            </div>
          </div>

          {isAvailabilityLocked ? (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm shadow-none cursor-not-allowed flex items-center justify-center gap-2 shrink-0 border border-slate-200"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              Timetable Locked (Sunday 14:30 Closed)
            </button>
          ) : (
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Weekly Availability
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
