import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantDocument } from '../../types';
import {
  FolderLock,
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Search,
  Filter,
  Plus,
  Users,
  ShieldCheck,
  Building,
  User,
  X,
} from 'lucide-react';

export const ManagerDocuments: React.FC = () => {
  const { documents, staffUsers, uploadDocument, deleteDocument } = useApp();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RestaurantDocument['category']>('Company Policy & Handbook');
  const [uploadedFor, setUploadedFor] = useState<string>('all');
  const [simulatedFileName, setSimulatedFileName] = useState('');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    uploadDocument({
      title,
      description,
      category,
      uploadedFor,
      uploadedBy: 'Manager Mark Zhang',
      fileName: simulatedFileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      fileType: 'application/pdf',
    });

    setTitle('');
    setDescription('');
    setSimulatedFileName('');
    setShowUploadModal(false);
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterTarget !== 'all') {
      if (filterTarget === 'company_wide' && doc.uploadedFor !== 'all') return false;
      if (filterTarget === 'role_docs' && !doc.uploadedFor.startsWith('role:')) return false;
      if (filterTarget === 'onboarding' && (doc.uploadedFor === 'all' || doc.uploadedFor.startsWith('role:'))) return false;
      if (filterTarget.startsWith('role:') && doc.uploadedFor !== filterTarget) return false;
      if (filterTarget.startsWith('staff-') && doc.uploadedFor !== filterTarget) return false;
    }

    if (
      searchQuery &&
      !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const onboardingCollectedCount = documents.filter(
    (d) => !d.uploadedFor.startsWith('role:') && d.uploadedFor !== 'all'
  ).length;
  const companyWideCount = documents.filter((d) => d.uploadedFor === 'all').length;
  const roleRestrictedCount = documents.filter((d) => d.uploadedFor.startsWith('role:')).length;

  const getAudienceBadge = (target: string) => {
    if (target === 'all') {
      return {
        label: 'Company-Wide',
        className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      };
    }
    if (target === 'role:manager') {
      return {
        label: 'Managers Only',
        className: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      };
    }
    if (target === 'role:bar_staff') {
      return {
        label: 'Role: Bar Staff',
        className: 'bg-amber-100 text-amber-800 border border-amber-200',
      };
    }
    if (target === 'role:wait_staff') {
      return {
        label: 'Role: Wait Staff',
        className: 'bg-sky-100 text-sky-800 border border-sky-200',
      };
    }
    if (target === 'role:staff') {
      return {
        label: 'Role: Frontline Staff',
        className: 'bg-blue-100 text-blue-800 border border-blue-200',
      };
    }
    const targetStaff = staffUsers.find((s) => s.id === target);
    return {
      label: targetStaff ? `Staff: ${targetStaff.firstName} ${targetStaff.lastName}` : 'Private',
      className: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <FolderLock className="w-4 h-4" />
            Central HR & Operations Repository
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Document Center (Manager Access)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage restaurant documents with role-based visibility, review onboarding files, and distribute role-specific standard procedures.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200 shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Upload Document for Staff
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Filed Documents</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{documents.length} Files</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stored securely in system</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Role-Specific Access</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{roleRestrictedCount} Files</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Manager, Bar & Wait staff roles</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Company-Wide Published</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{companyWideCount} Files</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Visible to all rostered employees</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Collected via Onboarding</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{onboardingCollectedCount} Files</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ID verification, TFN, Food Handler certs</div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents or staff submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterTarget('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterTarget === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Files ({documents.length})
          </button>
          <button
            onClick={() => setFilterTarget('company_wide')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterTarget === 'company_wide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Company-Wide ({companyWideCount})
          </button>
          <button
            onClick={() => setFilterTarget('role_docs')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterTarget === 'role_docs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            By Role ({roleRestrictedCount})
          </button>

          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="all">Filter Audience / Role...</option>
            <optgroup label="Filter by Role">
              <option value="role:manager">Managers Only</option>
              <option value="role:bar_staff">Bar Staff Only</option>
              <option value="role:wait_staff">Wait Staff Only</option>
              <option value="role:staff">All Frontline Staff</option>
            </optgroup>
            <optgroup label="Filter by Individual Staff Submissions">
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}'s Submissions
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const audienceBadge = getAudienceBadge(doc.uploadedFor);

          return (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${audienceBadge.className}`}
                  >
                    {audienceBadge.label}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{doc.fileSize}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {doc.title}
                </h3>

                {doc.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 space-y-0.5">
                  <div>
                    File: <span className="font-mono text-slate-600 font-medium">{doc.fileName}</span>
                  </div>
                  <div>
                    Uploaded by: <strong className="text-slate-600">{doc.uploadedBy}</strong>
                  </div>
                  <div className="text-[10px]">{doc.uploadedAt}</div>
                </div>
              </div>

              <div className="pt-4 mt-3 flex items-center gap-2 border-t border-slate-100">
                <a
                  href={doc.fileUrl || '/Food handler skills and knowledge checklist.pdf'}
                  download={doc.fileName}
                  className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title={`Download ${doc.fileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>

                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Upload Document for Staff</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document Title:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Malaya Corner Safe Work Method Statement (SWMS)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Company Policy & Handbook">Company Policy & Handbook</option>
                  <option value="Training & Food Safety">Training & Food Safety</option>
                  <option value="Standard Operating Procedure">Standard Operating Procedure</option>
                  <option value="General Announcement">General Announcement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Audience / Visibility:</label>
                <select
                  value={uploadedFor}
                  onChange={(e) => setUploadedFor(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <optgroup label="Visibility By Role & Clearance">
                    <option value="all">Everyone (Company-Wide - All Staff & Managers)</option>
                    <option value="role:manager">Managers Only (Restricted / Confidential)</option>
                    <option value="role:staff">All Frontline Staff (Floor & Bar)</option>
                    <option value="role:bar_staff">Bar Staff Only</option>
                    <option value="role:wait_staff">Wait Staff / Floor Staff Only</option>
                  </optgroup>
                  <optgroup label="Private to Individual Staff Member">
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        Private to {u.firstName} {u.lastName} ({u.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-500 font-medium">
                  {uploadedFor === 'all' && 'All team members across the restaurant can view and download this file.'}
                  {uploadedFor === 'role:manager' && 'Restricted to Managers only. Frontline staff cannot see or access this file.'}
                  {uploadedFor === 'role:staff' && 'Visible to all frontline team members (Wait and Bar staff) and managers.'}
                  {uploadedFor === 'role:bar_staff' && 'Visible only to Bar Staff and managers.'}
                  {uploadedFor === 'role:wait_staff' && 'Visible only to Wait Staff / Floor Staff and managers.'}
                  {uploadedFor.startsWith('staff-') && 'Confidential: Only this specific employee and managers can view this file.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document File:</label>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center space-y-2 bg-slate-50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-slate-600">Drag and drop file here, or browse</div>
                  <input
                    type="file"
                    className="text-xs text-slate-500"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSimulatedFileName(e.target.files[0].name);
                      }
                    }}
                  />
                  {simulatedFileName && (
                    <div className="text-emerald-700 font-bold text-[11px]">
                      Selected: {simulatedFileName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs shadow-indigo-200 transition-colors cursor-pointer"
                >
                  Upload & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
