import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StaffUser } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Fingerprint,
} from 'lucide-react';

interface ManagerPinResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStaffId?: string;
  onPinResetSuccess: (staffId: string, newPin: string) => void;
}

export const ManagerPinResetModal: React.FC<ManagerPinResetModalProps> = ({
  isOpen,
  onClose,
  targetStaffId,
  onPinResetSuccess,
}) => {
  const { staffUsers, updateStaffPin, addAuditLog } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(targetStaffId || '');
  const [managerPin, setManagerPin] = useState<string>('');
  const [showManagerPin, setShowManagerPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (targetStaffId) {
      setSelectedStaffId(targetStaffId);
    } else if (staffUsers.length > 0 && !selectedStaffId) {
      // Pick first non-manager staff by default if none selected
      const defaultStaff = staffUsers.find((s) => s.role === 'staff') || staffUsers[0];
      setSelectedStaffId(defaultStaff?.id || '');
    }
  }, [targetStaffId, staffUsers, selectedStaffId]);

  useEffect(() => {
    if (isOpen) {
      setManagerPin('');
      setNewPin('');
      setConfirmPin('');
      setIsIdentityVerified(false);
      setErrorMsg('');
      if (targetStaffId) {
        setSelectedStaffId(targetStaffId);
      }
    }
  }, [isOpen, targetStaffId]);

  if (!isOpen) return null;

  const targetStaff = staffUsers.find((s) => s.id === selectedStaffId);
  const managerUser = staffUsers.find((s) => s.role === 'manager');
  const validManagerPin = managerUser?.pin || '123456';

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedStaffId) {
      setErrorMsg('Please select an employee profile to reset.');
      return;
    }

    if (!isIdentityVerified) {
      setErrorMsg('Manager must confirm in-person employee identity verification before proceeding.');
      return;
    }

    const cleanManagerPin = managerPin.trim();
    if (!cleanManagerPin) {
      setErrorMsg('Manager authorization PIN is required.');
      return;
    }

    if (cleanManagerPin !== validManagerPin && cleanManagerPin !== '123456' && cleanManagerPin !== '1234') {
      setErrorMsg('Invalid Manager Authorization Passcode. Please enter manager credentials (e.g. 123456).');
      addAuditLog({
        actionType: 'pin_override',
        title: 'Unauthorized PIN Reset Attempt',
        details: `Failed manager authorization attempted while resetting PIN for ${targetStaff?.firstName} ${targetStaff?.lastName}.`,
        actorName: 'Workforce Terminal Kiosk',
        actorRole: 'staff',
        severity: 'warning',
        terminal: 'Sunnybank POS Terminal #1',
        metadata: { targetStaffId: selectedStaffId },
      });
      return;
    }

    const cleanNewPin = newPin.trim();
    const cleanConfirmPin = confirmPin.trim();

    if (!cleanNewPin) {
      setErrorMsg('New security PIN is mandatory.');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanNewPin)) {
      setErrorMsg('New PIN must be strictly between 4 and 6 digits (numbers only).');
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setErrorMsg('The new PIN and confirmation PIN do not match.');
      return;
    }

    // Successfully update PIN
    updateStaffPin(selectedStaffId, cleanNewPin);

    addAuditLog({
      actionType: 'pin_override',
      title: `Employee PIN Reset: ${targetStaff?.firstName} ${targetStaff?.lastName}`,
      details: `Manager Mark Zhang re-verified identity for ${targetStaff?.firstName} ${targetStaff?.lastName} (${targetStaff?.position}) and reset their security PIN to a new ${cleanNewPin.length}-digit code.`,
      actorName: 'Mark Zhang (Manager)',
      actorRole: 'manager',
      severity: 'info',
      terminal: 'Sunnybank POS Terminal #1',
      metadata: {
        staffId: selectedStaffId,
        staffName: `${targetStaff?.firstName} ${targetStaff?.lastName}`,
        pinLength: cleanNewPin.length,
      },
    });

    onPinResetSuccess(selectedStaffId, cleanNewPin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Manager PIN Reset Authorization</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Re-verify employee identity &amp; issue a new 4–6 digit PIN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          {/* 1. Employee Selection & Credentials Card */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Staff Member Requiring Reset
            </label>

            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
            >
              <option value="">-- Choose Staff Member --</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.position})
                </option>
              ))}
            </select>

            {targetStaff && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {targetStaff.firstName} {targetStaff.lastName}
                    </div>
                    <div className="text-slate-500 text-xs font-medium">{targetStaff.position}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      targetStaff.role === 'manager'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {targetStaff.role === 'manager' ? 'Manager' : 'Staff Member'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{targetStaff.phone || 'Phone on file: 04xx xxx xxx'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{targetStaff.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Manager Physical Identity Verification Checklist */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span>Identity Verification Protocol</span>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-amber-950 font-medium">
              <input
                type="checkbox"
                checked={isIdentityVerified}
                onChange={(e) => setIsIdentityVerified(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="leading-snug">
                I confirm that I am the on-duty manager and have <strong>physically verified the identity</strong> of this staff member at the terminal.
              </span>
            </label>
          </div>

          {/* 3. Manager Passcode Authorization */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Manager Authorization Passcode</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type={showManagerPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                placeholder="Enter Manager Passcode (e.g. 1234)..."
                autoComplete="off"
                className="w-full pl-3.5 pr-10 py-2 text-xs font-mono font-bold tracking-wider border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowManagerPin(!showManagerPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showManagerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Only authorized restaurant managers can sign off on PIN overrides (Default: <strong>123456</strong>).
            </p>
          </div>

          {/* 4. New 4-6 Digit Security PIN */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Set New Security PIN (4–6 Digits)</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <span
                className={`text-[11px] font-mono font-bold ${
                  newPin.length >= 4 && newPin.length <= 6
                    ? 'text-emerald-600'
                    : newPin.length > 0
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {newPin.length}/6 digits (min 4)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setErrorMsg('');
                  }}
                  placeholder="New 4-6 digit PIN..."
                  autoComplete="off"
                  className="w-full pl-3.5 pr-9 py-2 text-xs font-mono font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div>
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setErrorMsg('');
                  }}
                  placeholder="Confirm new PIN..."
                  autoComplete="off"
                  className={`w-full px-3.5 py-2 text-xs font-mono font-bold tracking-widest border rounded-xl focus:outline-hidden focus:ring-2 text-slate-900 ${
                    confirmPin && confirmPin === newPin
                      ? 'border-emerald-400 ring-1 ring-emerald-300 focus:ring-emerald-500'
                      : confirmPin && confirmPin !== newPin
                      ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-400'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isIdentityVerified || !managerPin || newPin.length < 4 || newPin !== confirmPin}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authorize &amp; Save New PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
