import React, { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { AlertCircle, Check, X, CalendarX, Calendar, Clock } from 'lucide-react';
import * as leaveApi from '../../api/leave';
import { LeaveRequest } from '../../api/leave';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import SkeletonCards from '../../components/SkeletonCards';

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL',      label: 'All'      },
];

function leaveDays(from: string, to: string) {
  const days = differenceInDays(new Date(to), new Date(from)) + 1;
  return days === 1 ? '1 day' : `${days} days`;
}

function initials(leave: LeaveRequest) {
  return `${leave.employee?.firstName?.[0] ?? ''}${leave.employee?.lastName?.[0] ?? ''}`.toUpperCase();
}

export default function TeamLeavesPage() {
  const [tab, setTab]         = useState<Tab>('PENDING');
  const [leaves, setLeaves]   = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Reject confirm dialog
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectError, setRejectError]   = useState('');
  const [rejecting, setRejecting]       = useState(false);

  function load(t = tab) {
    setLoading(true);
    leaveApi
      .getAllLeaves({ status: t === 'ALL' ? undefined : t, limit: 100 })
      .then((r) => setLeaves(r.items))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(tab); }, [tab]);

  async function approve(id: string) {
    setActionError('');
    setActing(id);
    try { await leaveApi.approveLeave(id); load(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to approve'); }
    finally { setActing(null); }
  }

  function promptReject(leave: LeaveRequest) {
    setRejectTarget(leave);
    setRejectError('');
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await leaveApi.rejectLeave(rejectTarget.id);
      setRejectTarget(null);
      load();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Team Leave Requests"
        subtitle="Review and approve leave applications for your team"
      />

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto self-center text-xs text-gray-400 font-medium">
            {leaves.length} {leaves.length === 1 ? 'request' : 'requests'}
          </span>
        )}
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonCards count={4} withAvatar />
      ) : leaves.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <CalendarX className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No {tab !== 'ALL' ? tab.toLowerCase() : ''} leave requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
            >
              {/* Card header: avatar + name + badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials(leave)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {leave.employee?.employeeCode} · {leave.employee?.designation}
                    </p>
                  </div>
                </div>
                <StatusBadge status={leave.status} size="sm" />
              </div>

              {/* Date range + duration */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 rounded-xl">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-800">
                    {format(new Date(leave.fromDate), 'd MMM yyyy')}
                    {leave.fromDate !== leave.toDate && (
                      <span className="font-normal text-primary"> – {format(new Date(leave.toDate), 'd MMM yyyy')}</span>
                    )}
                  </p>
                </div>
                <span className="flex-shrink-0 px-2 py-0.5 bg-primary-100 text-primary text-xs font-bold rounded-full">
                  {leaveDays(leave.fromDate, leave.toDate)}
                </span>
              </div>

              {/* Reason */}
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{leave.reason}</p>

              {/* Footer: applied time + actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {format(new Date(leave.createdAt), 'd MMM, hh:mm a')}
                </span>

                {leave.status === 'PENDING' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => approve(leave.id)}
                      disabled={acting === leave.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />Approve
                    </button>
                    <button
                      onClick={() => promptReject(leave)}
                      disabled={acting === leave.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject Leave Request"
        message={
          rejectTarget
            ? `Reject ${rejectTarget.employee?.firstName ?? ''}'s leave request (${format(new Date(rejectTarget.fromDate), 'd MMM')}${rejectTarget.fromDate !== rejectTarget.toDate ? ` – ${format(new Date(rejectTarget.toDate), 'd MMM yyyy')}` : ` ${format(new Date(rejectTarget.fromDate), 'yyyy')}`})?`
            : ''
        }
        confirmLabel="Reject"
        loading={rejecting}
        error={rejectError}
        onConfirm={confirmReject}
        onCancel={() => { setRejectTarget(null); setRejectError(''); }}
      />
    </div>
  );
}
