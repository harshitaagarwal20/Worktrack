import React, { useEffect, useMemo, useState } from 'react';
import { differenceInDays, format } from 'date-fns';
import { AlertCircle, Calendar, CalendarX, Clock, Plus } from 'lucide-react';
import SkeletonCards from '../../components/SkeletonCards';
import * as leaveApi from '../../api/leave';
import { LeaveRequest } from '../../api/leave';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

type TabFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'ALL',      label: 'All'      },
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

function leaveDays(from: string, to: string) {
  const days = differenceInDays(new Date(to), new Date(from)) + 1;
  return days === 1 ? '1 day' : `${days} days`;
}

export default function MyLeavePage() {
  const [leaves, setLeaves]       = useState<LeaveRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<TabFilter>('ALL');
  const [applyOpen, setApplyOpen] = useState(false);

  // Apply form
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [reason, setReason]         = useState('');
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    leaveApi.getMyLeaves({ limit: 100 })
      .then(r => setLeaves(r.items))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => tab === 'ALL' ? leaves : leaves.filter(l => l.status === tab),
    [leaves, tab],
  );

  const duration = useMemo(() => {
    if (!fromDate || !toDate || toDate < fromDate) return null;
    return leaveDays(fromDate, toDate);
  }, [fromDate, toDate]);

  function openApply() {
    setFromDate(''); setToDate(''); setReason(''); setFormError('');
    setApplyOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!fromDate || !toDate) { setFormError('Both dates are required'); return; }
    if (toDate < fromDate)    { setFormError('End date must be on or after start date'); return; }
    if (!reason.trim())       { setFormError('Reason is required'); return; }
    setSubmitting(true);
    try {
      await leaveApi.submitLeave({ fromDate, toDate, reason: reason.trim() });
      setApplyOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl animate-slide-up">
      <PageHeader
        title="My Leaves"
        subtitle="Apply for leave and track your requests"
        action={
          <Button onClick={openApply}>
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        }
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
            {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
          </span>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <CalendarX className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {tab === 'ALL'
              ? 'No leave requests yet — use "Apply for Leave" to get started'
              : `No ${tab.toLowerCase()} leave requests`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(leave => (
            <div
              key={leave.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
            >
              {/* Date banner */}
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
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{leave.reason}</p>

              {/* Footer: timestamp + status */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {format(new Date(leave.createdAt), 'd MMM, hh:mm a')}
                </span>
                <StatusBadge status={leave.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      <Modal
        open={applyOpen}
        title="Apply for Leave"
        subtitle="Your request will be reviewed by HR"
        onClose={() => setApplyOpen(false)}
        panelClassName="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {formError && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => {
                  setFromDate(e.target.value);
                  if (toDate && e.target.value > toDate) setToDate('');
                }}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={e => setToDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          {duration && (
            <p className="text-xs text-gray-500 -mt-1">
              Duration: <span className="font-semibold text-gray-700">{duration}</span>
            </p>
          )}

          <div>
            <label className={labelCls}>Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe the reason for your leave"
              className={`${inputCls} resize-none`}
              maxLength={1000}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!fromDate || !toDate || !reason.trim()}
            >
              Submit Request
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}
