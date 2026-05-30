import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import * as employeeApi from '../../api/employee';
import * as payrollApi from '../../api/payroll';
import * as authApi from '../../api/auth';
import { Employee, Payroll } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = ['Personal Info', 'Salary & Payroll', 'Security'] as const;
type Tab = typeof TABS[number];

function Skel({ w = 'w-32', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-gray-100 rounded animate-pulse`} />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
    </div>
  );
}

function FieldCell({ label, value, loading, wide }: {
  label: string; value?: string; loading?: boolean; wide?: boolean;
}) {
  return (
    <div className={`px-5 py-3${wide ? ' sm:col-span-3' : ''}`}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      {loading
        ? <Skel w="w-36" />
        : <p className="text-sm text-gray-900 font-medium">{value || '—'}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile]       = useState<Employee | null>(null);
  const [payrolls, setPayrolls]     = useState<Payroll[]>([]);
  const [loading, setLoading]       = useState(true);
  const [payLoading, setPayLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('Personal Info');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    employeeApi.getMyProfile()
      .then(setProfile).catch(() => {}).finally(() => setLoading(false));
    payrollApi.getMyPayrolls({ limit: 4 })
      .then(r => setPayrolls(r.items)).catch(() => {}).finally(() => setPayLoading(false));
  }, []);

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (newPw.length < 6)    { setPwError('New password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return; }
    if (newPw === currentPw) { setPwError('New password must differ from the current one'); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-slide-up space-y-4">

      {/* ═══ PROFILE HEADER ═══ */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

        {/* Banner — avatar anchored inside, extends 28px below */}
        <div className="h-24 bg-primary relative">
          <div className="absolute left-6 -bottom-7">
            <div className="w-14 h-14 rounded-full ring-4 ring-white bg-white shadow-sm flex items-center justify-center text-primary text-lg font-bold select-none">
              {initials}
            </div>
          </div>
        </div>

        {/* Identity — pt-9 gives 8px clearance below avatar */}
        <div className="px-6 pt-9">
          {loading ? (
            <div className="space-y-2 pb-4">
              <Skel w="w-48" h="h-6" />
              <Skel w="w-36" />
              <div className="flex gap-2 pt-1"><Skel w="w-20" h="h-6" /><Skel w="w-16" h="h-6" /></div>
            </div>
          ) : profile ? (
            <div className="pb-4">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{profile.designation}</p>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                  {profile.employeeCode}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
                  profile.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 pb-4">Could not load profile</p>
          )}
        </div>


        {/* Tab bar */}
        <div className="flex border-t border-gray-100 px-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative shrink-0 px-1 mr-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PERSONAL INFO ═══ */}
      {activeTab === 'Personal Info' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in">

          <SectionHeader title="Personal Details" />
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <FieldCell label="First Name"    value={profile?.firstName} loading={loading} />
            <FieldCell label="Last Name"     value={profile?.lastName}  loading={loading} />
            <FieldCell label="Email Address" value={user?.email} />
          </div>

          <div className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <FieldCell label="Phone Number"  value={profile?.phone}         loading={loading} />
            <FieldCell label="Designation"   value={profile?.designation}   loading={loading} />
            <FieldCell label="Employee Code" value={profile?.employeeCode}  loading={loading} />
          </div>

          <div className="border-t border-gray-100">
            <SectionHeader title="Employment" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <FieldCell
              label="Date of Joining"
              value={profile ? format(new Date(profile.dateOfJoining), 'dd MMMM yyyy') : undefined}
              loading={loading}
            />
            <FieldCell
              label="Account Status"
              value={!loading && profile ? (profile.isActive ? 'Active' : 'Inactive') : undefined}
              loading={loading}
            />
            <div className="px-5 py-4" />
          </div>

        </div>
      )}

      {/* ═══ SALARY & PAYROLL ═══ */}
      {activeTab === 'Salary & Payroll' && (
        <div className="space-y-4 animate-fade-in">

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader title="Salary Overview" />
            <div className="p-5">
              <div className="inline-flex flex-col p-4 rounded-xl bg-primary-50 border border-primary-100">
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1.5">Monthly CTC</p>
                {loading
                  ? <Skel w="w-36" h="h-7" />
                  : <p className="text-2xl font-bold text-gray-900">
                      ₹{profile?.monthlySalary.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}
                    </p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader title="Payroll History" />
            <div className="p-5">
              {payLoading ? (
                <div className="space-y-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 animate-pulse">
                      <div className="space-y-2"><Skel w="w-20" /><Skel w="w-32" h="h-3" /></div>
                      <div className="flex flex-col items-end gap-2"><Skel w="w-16" /><Skel w="w-12" h="h-5" /></div>
                    </div>
                  ))}
                </div>
              ) : payrolls.length > 0 ? (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Period','Attendance','Gross Salary','Deductions','Net Pay','Status'].map(h => (
                          <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-2.5 pr-4 last:pr-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3.5 pr-4 font-semibold text-gray-800 whitespace-nowrap">
                            {MONTHS[p.month - 1]} {p.year}
                          </td>
                          <td className="py-3.5 pr-4 text-gray-600">
                            {p.presentDays}d / {p.presentDays + p.absentDays}d
                          </td>
                          <td className="py-3.5 pr-4 text-gray-700">
                            ₹{p.grossSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3.5 pr-4 text-red-500">
                            {p.totalDeductions > 0
                              ? `−₹${p.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                              : '—'}
                          </td>
                          <td className="py-3.5 pr-4 font-bold text-gray-900 whitespace-nowrap">
                            ₹{p.netSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3.5">
                            <StatusBadge status={p.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No payroll records yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECURITY ═══ */}
      {activeTab === 'Security' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in">
          <SectionHeader title="Change Password" />
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-6">
              Keep your account secure by updating your password regularly.
            </p>
            {pwSuccess && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 mb-5">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Password updated successfully
              </div>
            )}
            {pwError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {pwError}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
              <PasswordField label="Current Password"     value={currentPw}  onChange={setCurrentPw} />
              <PasswordField label="New Password"         value={newPw}       onChange={setNewPw}     placeholder="Min. 6 characters" />
              <PasswordField label="Confirm New Password" value={confirmPw}  onChange={setConfirmPw} />
              <div className="pt-2">
                <Button type="submit" loading={pwLoading} disabled={!currentPw || !newPw || !confirmPw}>
                  <Lock className="w-4 h-4" />
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
