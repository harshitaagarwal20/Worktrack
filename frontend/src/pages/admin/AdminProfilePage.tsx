import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import * as employeeApi from '../../api/employee';
import * as authApi from '../../api/auth';
import { Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

type Tab = 'info' | 'security';

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

function FieldCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="px-5 py-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value || '—'}</p>
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

export default function AdminProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading]  = useState(true);
  const [tab, setTab]          = useState<Tab>('info');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    employeeApi.getMyProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="max-w-4xl animate-slide-up space-y-4">

      {/* ═══ PROFILE HEADER ═══ */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

        {/* Banner — avatar is anchored inside here so it overlaps cleanly */}
        <div className="h-24 bg-primary relative">
          <button
            onClick={logout}
            className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          {/* Avatar anchored to banner bottom-left, extends 28px below */}
          <div className="absolute left-6 -bottom-7">
            <div className="w-14 h-14 rounded-full ring-4 ring-white bg-white shadow-sm flex items-center justify-center text-primary text-lg font-bold select-none">
              {loading ? '·' : initials}
            </div>
          </div>
        </div>

        {/* Identity — pt-9 (36px) gives 8px clearance below avatar */}
        <div className="px-6 pt-9">
          {loading ? (
            <div className="space-y-2 pb-4">
              <Skel w="w-48" h="h-6" />
              <Skel w="w-36" />
              <div className="flex gap-2 pt-1"><Skel w="w-20" h="h-6" /></div>
            </div>
          ) : (
            <div className="pb-4">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
              </h1>
              {profile && <p className="text-sm text-gray-500 mt-0.5">{profile.designation}</p>}
              <div className="flex items-center flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary border border-primary-200 rounded text-xs font-semibold">
                  HR Admin
                </span>
                {profile?.employeeCode && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {profile.employeeCode}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-gray-100 px-4">
          {(['info', 'security'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPwSuccess(false); setPwError(''); }}
              className={`relative px-1 mr-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t ? 'text-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'info' ? 'Profile Info' : 'Security'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Profile Info ── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in">
          <SectionHeader title="Contact & Work" />
          {loading ? (
            <div className="p-5 space-y-5">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="space-y-1.5">
                  <Skel w="w-16" h="h-3" />
                  <Skel w="w-40" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <FieldCell label="Email"       value={user?.email} />
                <FieldCell label="Phone"       value={profile?.phone} />
              </div>
              <div className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <FieldCell label="Designation"    value={profile?.designation} />
                <FieldCell label="Monthly Salary" value={
                  profile?.monthlySalary != null
                    ? `₹${profile.monthlySalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                    : undefined
                } />
              </div>
              <div className="border-t border-gray-100">
                <FieldCell
                  label="Date of Joining"
                  value={profile?.dateOfJoining ? format(new Date(profile.dateOfJoining), 'dd MMM yyyy') : undefined}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
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
