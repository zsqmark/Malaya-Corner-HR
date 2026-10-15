import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffUser, StaffType, OnboardingFormData } from '../../types';
import {
  FolderLock,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  FileText,
  Building,
  CreditCard,
  ShieldCheck,
  UserPlus,
  Send,
  Wine,
  Utensils,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  LogIn,
  Lock,
  RefreshCw,
  KeyRound,
  EyeOff,
  Edit3,
  X,
} from 'lucide-react';

export const ManagerOnboarding: React.FC = () => {
  const {
    staffUsers,
    onboardingRecords,
    approveOnboarding,
    updateOnboardingStatus,
    inviteStaffUser,
    deleteStaffUser,
    clearAllStaffUsers,
    switchUser,
    switchRole,
    setCurrentPage,
    updateStaffPin,
  } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{
    staff: StaffUser;
    inviteToken: string;
    inviteUrl: string;
  } | null>(null);

  // PIN viewing and editing state
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [showAllPins, setShowAllPins] = useState(false);
  const [editingPinStaff, setEditingPinStaff] = useState<StaffUser | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinEditError, setPinEditError] = useState('');
  const [pinSuccessToast, setPinSuccessToast] = useState<string | null>(null);

  const toggleRevealPin = (staffId: string) => {
    setRevealedPins((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const toggleShowAllPins = () => {
    if (showAllPins) {
      setRevealedPins({});
      setShowAllPins(false);
    } else {
      const all: Record<string, boolean> = {};
      staffUsers.forEach((s) => {
        all[s.id] = true;
      });
      setRevealedPins(all);
      setShowAllPins(true);
    }
  };

  const handleOpenEditPin = (staff: StaffUser) => {
    setEditingPinStaff(staff);
    setNewPinInput(staff.pin || '');
    setShowNewPin(false);
    setPinEditError('');
  };

  const handleGenerateRandomPin = () => {
    const randomPin = '10' + Math.floor(10 + Math.random() * 89);
    setNewPinInput(randomPin);
    setPinEditError('');
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPinStaff) return;

    const cleanPin = newPinInput.trim();
    if (!cleanPin) {
      setPinEditError('Security PIN cannot be empty.');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanPin)) {
      setPinEditError('Security PIN must be between 4 and 6 digits (numbers only).');
      return;
    }

    updateStaffPin(editingPinStaff.id, cleanPin);
    setPinSuccessToast(`Security PIN for ${editingPinStaff.firstName} ${editingPinStaff.lastName} was updated to ${cleanPin}.`);
    setTimeout(() => setPinSuccessToast(null), 6000);
    setEditingPinStaff(null);
  };

  // Filter and search
  const [filterType, setFilterType] = useState<'all' | 'bar_staff' | 'wait_staff'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'invite_sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite Form State
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteStaffType, setInviteStaffType] = useState<StaffType>('wait_staff');
  const [invitePosition, setInvitePosition] = useState('Floor Waiter');
  const [inviteHourlyRate, setInviteHourlyRate] = useState('26.50');
  const [inviteWelcomeNote, setInviteWelcomeNote] = useState(
    'Welcome to the Malaya Corner team! Please fill out your digital onboarding form before your first shift.'
  );

  const selectedStaff = staffUsers.find((s) => s.id === selectedStaffId);
  const selectedDossier: OnboardingFormData | undefined = selectedStaffId
    ? onboardingRecords[selectedStaffId]
    : undefined;

  const handleApprove = (staffId: string) => {
    updateOnboardingStatus(staffId, 'approved');
  };

  const handleReject = (staffId: string) => {
    updateOnboardingStatus(staffId, 'rejected');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      return;
    }

    const { staffId, inviteToken } = inviteStaffUser({
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim() || '0400 000 000',
      staffType: inviteStaffType,
      position: invitePosition.trim() || (inviteStaffType === 'bar_staff' ? 'Bar Staff' : 'Wait Staff'),
      hourlyRate: parseFloat(inviteHourlyRate) || 26.5,
      welcomeNote: inviteWelcomeNote.trim(),
    });

    const newStaff = staffUsers.find((s) => s.id === staffId) || {
      id: staffId,
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim() || '0400 000 000',
      role: 'staff',
      staffType: inviteStaffType,
      position: invitePosition.trim(),
      hourlyRate: parseFloat(inviteHourlyRate) || 26.5,
      onboardingCompleted: false,
      onboardingStatus: 'invite_sent',
    } as StaffUser;

    const dummyUrl = `${window.location.origin}?invite=${inviteToken}&staff=${staffId}`;

    setCreatedInvite({
      staff: newStaff,
      inviteToken,
      inviteUrl: dummyUrl,
    });

    // Clear form
    setInviteFirstName('');
    setInviteLastName('');
    setInviteEmail('');
    setInvitePhone('');
    setInviteStaffType('wait_staff');
    setInvitePosition('Floor Waiter');
    setInviteHourlyRate('26.50');
    setShowInviteModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const simulateStaffLogin = (staffId: string) => {
    switchUser(staffId);
    switchRole('staff');
    setCurrentPage('Onboarding');
  };

  // Filter staff users
  const filteredStaff = staffUsers.filter((staff) => {
    // Exclude manager from onboarding roster table
    if (staff.role === 'manager' && staff.id === 'mgr-mark') return false;

    const staffType = staff.staffType || (staff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');
    if (filterType !== 'all' && staffType !== filterType) return false;

    if (filterStatus !== 'all') {
      const status = staff.onboardingStatus || (staff.onboardingCompleted ? 'approved' : 'pending');
      if (status !== filterStatus) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(q);
      const matchEmail = (staff.email || '').toLowerCase().includes(q);
      const matchPos = (staff.position || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPos) return false;
    }

    return true;
  });

  const barStaffCount = staffUsers.filter((s) => s.role === 'staff' && (s.staffType === 'bar_staff' || s.position?.toLowerCase().includes('bar'))).length;
  const waitStaffCount = staffUsers.filter((s) => s.role === 'staff' && (s.staffType !== 'bar_staff' && !s.position?.toLowerCase().includes('bar'))).length;
  const completedCount = staffUsers.filter((s) => s.role === 'staff' && s.onboardingCompleted).length;
  const pendingCount = staffUsers.filter((s) => s.role === 'staff' && !s.onboardingCompleted).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PIN Update Success Toast */}
      {pinSuccessToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{pinSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPinSuccessToast(null)}
            className="p-1 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 cursor-pointer text-xs font-bold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            Staff & Team Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Directory & Recruitment
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Bar Staff and Wait Staff at Malaya Corner. Track employee details, security PINs, hourly rates, and onboarding verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {staffUsers.some((s) => s.role === 'staff') && (
            <button
              onClick={() => {
                if (window.confirm('Delete all staff members? This will remove all staff accounts and leave only the Manager account.')) {
                  clearAllStaffUsers();
                }
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="Remove all staff members and keep only the manager"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Staff</span>
            </button>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs shadow-indigo-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Invite New Staff
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Bar Staff</span>
            <Wine className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{barStaffCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Certified for Bar & Cross-Duty Floor
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Wait Staff</span>
            <Utensils className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{waitStaffCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Floor service & table operations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Fully Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cleared for shift scheduling</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Pending Onboarding</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Form / VEVO verification pending</div>
        </div>
      </div>

      {/* Staff Invitation Created Success Banner */}
      {createdInvite && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Invitation Successfully Dispatched for {createdInvite.staff.firstName} {createdInvite.staff.lastName}!
            </div>
            <p className="text-xs text-emerald-800">
              Role: <strong className="uppercase inline-flex items-center gap-1">{createdInvite.staff.staffType === 'bar_staff' ? <><Wine className="w-3.5 h-3.5 inline text-amber-600" />Bar Staff</> : <><Utensils className="w-3.5 h-3.5 inline text-sky-600" />Wait Staff</>}</strong> • Position: {createdInvite.staff.position} • Invite Token: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{createdInvite.inviteToken}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(createdInvite.inviteUrl)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copied!' : 'Copy Onboarding Link'}
            </button>
            <button
              onClick={() => simulateStaffLogin(createdInvite.staff.id)}
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" />
              Simulate Staff Sign-in
            </button>
            <button
              onClick={() => setCreatedInvite(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Employee Type:
            </span>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Employees ({staffUsers.filter((s) => s.role === 'staff').length})
              </button>
              <button
                onClick={() => setFilterType('bar_staff')}
                className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterType === 'bar_staff'
                    ? 'bg-white text-amber-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wine className="w-3 h-3 text-amber-600" />
                Bar Staff ({barStaffCount})
              </button>
              <button
                onClick={() => setFilterType('wait_staff')}
                className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1 cursor-pointer ${
                  filterType === 'wait_staff'
                    ? 'bg-white text-sky-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Utensils className="w-3 h-3 text-sky-600" />
                Wait Staff ({waitStaffCount})
              </button>
            </div>

            <span className="font-bold text-slate-700 ml-2">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved & Complete</option>
              <option value="pending">Pending Review</option>
              <option value="invite_sent">Invite Sent / Not Submitted</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleShowAllPins}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer bg-white transition-colors"
              title={showAllPins ? 'Mask all PINs' : 'Reveal all staff PINs'}
            >
              {showAllPins ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showAllPins ? 'Hide All PINs' : 'View All PINs'}</span>
            </button>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Onboarding Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">
            Restaurant Staff Roster & Induction Records
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredStaff.length} team members
          </span>
        </div>

        {/* Mobile View: High-density Card List (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredStaff.map((staff) => {
            const staffType = staff.staffType || (staff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');
            const dossier = onboardingRecords[staff.id];
            const hasDossier = Boolean(dossier);

            return (
              <div key={staff.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm uppercase shrink-0 border border-slate-200">
                      {staff.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {staff.firstName} {staff.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {staff.position}
                      </div>
                    </div>
                  </div>

                  {staffType === 'bar_staff' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      <Wine className="w-3 h-3 text-amber-700" />
                      Bar Staff
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200 shrink-0">
                      <Utensils className="w-3 h-3 text-sky-700" />
                      Wait Staff
                    </span>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                  <a href={`tel:${staff.phone}`} className="font-mono text-[11px] text-slate-700 hover:text-indigo-600 block mt-0.5 truncate">
                    {staff.phone}
                  </a>
                </div>

                {/* Security PIN */}
                <div className="flex items-center justify-between text-xs bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[10px] text-indigo-700 uppercase font-bold">Security PIN:</span>
                    <span className="font-mono font-bold tracking-wider text-xs">
                      {revealedPins[staff.id] ? staff.pin : '••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRevealPin(staff.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={revealedPins[staff.id] ? "Hide PIN" : "Reveal PIN"}
                    >
                      {revealedPins[staff.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPin(staff)}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit PIN
                  </button>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div>
                    {staff.onboardingCompleted ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Induction Complete
                      </span>
                    ) : hasDossier ? (
                      <span className="text-blue-700 font-semibold flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Awaiting Review
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Invite Sent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {staff.role !== 'manager' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete staff member ${staff.firstName} ${staff.lastName}?`)) {
                            deleteStaffUser(staff.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs cursor-pointer"
                        title="Delete staff account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedStaffId(staff.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs shadow-indigo-200 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Employee Type</th>
                <th className="p-3.5">Position</th>
                <th className="p-3.5">Security PIN</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Induction Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => {
                const staffType = staff.staffType || (staff.position?.toLowerCase().includes('bar') ? 'bar_staff' : 'wait_staff');
                const dossier = onboardingRecords[staff.id];
                const hasDossier = Boolean(dossier);

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                          {staff.firstName[0]}
                        </div>
                        <div>
                          <div>{staff.firstName} {staff.lastName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{staff.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee Type Badge */}
                    <td className="p-3.5">
                      {staffType === 'bar_staff' ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                            <Wine className="w-3 h-3 text-amber-700" />
                            Bar Staff
                          </span>
                          <span className="text-[10px] text-amber-700/80 font-medium mt-0.5">
                            Cross-Duty Qualified
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200 w-fit">
                            <Utensils className="w-3 h-3 text-sky-700" />
                            Wait Staff
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Floor Operations Only
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-700">
                      <div>{staff.position}</div>
                    </td>

                    {/* Security PIN */}
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-lg px-2.5 py-1">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-mono font-bold text-xs text-slate-800 tracking-wider">
                          {revealedPins[staff.id] ? staff.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRevealPin(staff.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title={revealedPins[staff.id] ? 'Hide PIN' : 'View PIN'}
                        >
                          {revealedPins[staff.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPin(staff)}
                          className="p-0.5 text-indigo-600 hover:text-indigo-800 rounded transition-colors ml-0.5 cursor-pointer"
                          title="Edit Security PIN"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">
                      {staff.phone}
                    </td>

                    <td className="p-3.5">
                      {staff.onboardingCompleted ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          15 of 15 Complete • Approved
                        </span>
                      ) : hasDossier ? (
                        <span className="text-blue-700 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted • Awaiting Review
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Invite Sent • Not Submitted
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditPin(staff)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 border border-slate-200/90 cursor-pointer"
                          title="Edit Security PIN"
                        >
                          <KeyRound className="w-3 h-3 text-indigo-600" />
                          PIN
                        </button>
                        <button
                          onClick={() => setSelectedStaffId(staff.id)}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs shadow-indigo-200 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                        {!staff.onboardingCompleted && (
                          <button
                            onClick={() => simulateStaffLogin(staff.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Simulate this staff member filling out onboarding"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {staff.role !== 'manager' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete staff member ${staff.firstName} ${staff.lastName}?`)) {
                                deleteStaffUser(staff.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete staff account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite New Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Invite New Employee
                </h3>
                <p className="text-xs text-slate-500">
                  Select employee station and send digital onboarding invitation link
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              {/* Employee Role / Type Selection (Crucial requirement!) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Employee Classification & Station:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteStaffType('bar_staff');
                      setInvitePosition('Barista & Bartender');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteStaffType === 'bar_staff'
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Wine className="w-4 h-4 text-amber-600" />
                      Bar Staff
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Certified for bar equipment & cocktail station. Can also perform wait staff floor jobs (cross-duty).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInviteStaffType('wait_staff');
                      setInvitePosition('Floor Waiter');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      inviteStaffType === 'wait_staff'
                        ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Utensils className="w-4 h-4 text-sky-600" />
                      Wait Staff
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Dining room service, customer greeting, food delivery. Cannot perform bar station operations.
                    </p>
                  </button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">First Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wei"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Last Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chen"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. wei.chen@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number (Australia):</label>
                  <input
                    type="tel"
                    required
                    placeholder="0400 123 456"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Position Title & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Position Title:</label>
                  <input
                    type="text"
                    required
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                    placeholder={inviteStaffType === 'bar_staff' ? 'Barista & Bartender' : 'Floor Waiter'}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Award Hourly Rate (AUD):</label>
                  <input
                    type="text"
                    required
                    value={inviteHourlyRate}
                    onChange={(e) => setInviteHourlyRate(e.target.value)}
                    placeholder="26.50"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono bg-white"
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Welcome Note (Sent with invitation link):</label>
                <textarea
                  rows={2}
                  value={inviteWelcomeNote}
                  onChange={(e) => setInviteWelcomeNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Dispatch Onboarding Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Dossier Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Employee HR Dossier
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{selectedStaff.firstName} {selectedStaff.lastName}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    (selectedStaff.staffType || 'wait_staff') === 'bar_staff'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-sky-100 text-sky-900 border border-sky-200'
                  }`}>
                    {(selectedStaff.staffType || 'wait_staff') === 'bar_staff' ? <><Wine className="w-3 h-3 inline mr-1 text-amber-700" />Bar Staff</> : <><Utensils className="w-3 h-3 inline mr-1 text-sky-700" />Wait Staff</>}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStaff.position} • {selectedStaff.email} • {selectedStaff.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedStaffId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Security PIN & Terminal Access Card */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-200/90 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Workforce Terminal Security PIN</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-900 font-bold tracking-wider">
                      {revealedPins[selectedStaff.id] ? selectedStaff.pin : '••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRevealPin(selectedStaff.id)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      title={revealedPins[selectedStaff.id] ? 'Hide PIN' : 'View PIN'}
                    >
                      {revealedPins[selectedStaff.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mandatory 4–6 digit passcode for clocking in/out at the restaurant POS terminal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEditPin(selectedStaff)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit PIN</span>
              </button>
            </div>

            {selectedDossier ? (
              <div className="space-y-6 text-xs">
                {/* Section 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Section 1: Personal Details & Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">1. Email:</span>
                      <span className="font-semibold">{selectedDossier.q1_email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">2. First & Middle Name:</span>
                      <span className="font-semibold">{selectedDossier.q2_firstNameMiddle}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">3. Last Name:</span>
                      <span className="font-semibold">{selectedDossier.q3_lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">4. Date of Birth:</span>
                      <span className="font-semibold">{selectedDossier.q4_dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">5. Mobile Number:</span>
                      <span className="font-semibold">{selectedDossier.q5_mobile}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Section 2: Superannuation & Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">6. Payroll Email:</span>
                      <span className="font-semibold">{selectedDossier.q6_emailAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">7. Super Provider:</span>
                      <span className="font-semibold">{selectedDossier.q7_superProvider}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">8. Super Member #:</span>
                      <span className="font-semibold">{selectedDossier.q8_superMemberNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">9. Bank Name:</span>
                      <span className="font-semibold">{selectedDossier.q9_bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">10. Bank BSB:</span>
                      <span className="font-mono font-bold">{selectedDossier.q10_bankBsb}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">11. Bank Account #:</span>
                      <span className="font-mono font-bold">{selectedDossier.q11_bankAccountNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Uploaded Documents */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderLock className="w-4 h-4 text-indigo-600" />
                    Section 3: Uploaded Employee Documents
                  </h3>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">12. Proof of Identity / Work Clearance (VEVO)</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q12_vevoDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>13.</span>
                          <a
                            href="/Food handler skills and knowledge checklist.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Food handler skills and knowledge checklist.pdf"
                            className="text-indigo-600 hover:text-indigo-800 underline font-bold inline-flex items-center gap-1"
                            title="Download Food handler skills and knowledge checklist"
                          >
                            Food handler skills and knowledge checklist
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q13_foodHandlerDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="/Food handler skills and knowledge checklist.pdf"
                          download="Food handler skills and knowledge checklist.pdf"
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold p-1 hover:bg-indigo-50 rounded"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">14. TFN Declaration Form</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q14_tfnDoc?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>15.</span>
                          <a
                            href="http://www.brisbane.imalert.com.au"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline font-bold inline-flex items-center gap-1"
                            title="Visit Brisbane I'M ALERT Food Hygiene Training"
                          >
                            Food Hygiene Online Training Course
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {selectedDossier.q15_foodHygieneCert?.fileName || 'Pending upload'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manager Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleReject(selectedStaff.id);
                      setSelectedStaffId(null);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Request Corrections
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedStaff.id);
                      setSelectedStaffId(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Onboarding
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="font-bold text-slate-800">Form Not Yet Submitted</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {selectedStaff.firstName} has not yet submitted their 15-question onboarding form. You can simulate signing in as them to complete the induction form.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStaffId(null);
                      simulateStaffLogin(selectedStaff.id);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Open Form as {selectedStaff.firstName}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Staff Security PIN Modal */}
      {editingPinStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Edit Security PIN
                  </h3>
                  <p className="text-xs text-slate-500">
                    Workforce Terminal Passcode Management
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPinStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Staff Summary */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                  {editingPinStaff.firstName[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {editingPinStaff.firstName} {editingPinStaff.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500">{editingPinStaff.position}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Current PIN</span>
                <span className="font-mono font-bold text-indigo-700 text-xs">{editingPinStaff.pin}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePin} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>New Security PIN (4–6 Digits)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      newPinInput.length >= 4 && newPinInput.length <= 6
                        ? 'text-emerald-600'
                        : newPinInput.length > 0
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {newPinInput.length}/6 digits (min 4)
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setPinEditError('');
                    }}
                    placeholder="Enter 4 to 6 digits..."
                    autoFocus
                    className="w-full pl-3.5 pr-20 py-2.5 text-base font-mono font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      title={showNewPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="px-2 py-1 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      title="Generate random 4-digit PIN"
                    >
                      Random
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  This PIN is required by the employee to log in at the Workforce Terminal and clock in/out for shifts.
                </p>
              </div>

              {pinEditError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinEditError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPinStaff(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPinInput.length < 4 || newPinInput.length > 6}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Security PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
