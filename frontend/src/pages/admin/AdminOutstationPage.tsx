import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Check, Clock, Hotel, MapPin, PackageOpen, Train, Utensils, X } from 'lucide-react';
import SkeletonCards from '../../components/SkeletonCards';
import * as api from '../../api/outstationClaim';
import { OutstationClaim, TRANSPORT_MODE_LABELS } from '../../api/outstationClaim';
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

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function initials(item: OutstationClaim) {
  return `${item.employee?.firstName?.[0] ?? ''}${item.employee?.lastName?.[0] ?? ''}`.toUpperCase();
}

function ExpenseRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  if (value <= 0) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 flex items-center gap-1.5"><Icon className={`w-3.5 h-3.5 ${color}`} />{label}</span>
      <span className="font-medium text-gray-800">₹{fmt(value)}</span>
    </div>
  );
}

export default function AdminOutstationPage() {
  const [items, setItems]       = useState<OutstationClaim[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<TabFilter>('PENDING');

  const [selected,    setSelected]    = useState<OutstationClaim | null>(null);
  const [action,      setAction]      = useState<'approve' | 'reject' | null>(null);
  const [remark,      setRemark]      = useState('');
  const [actionError, setActionError] = useState('');
  const [processing,  setProcessing]  = useState(false);

  function load() {
    setLoading(true);
    api.getAllClaims({ limit: 200 })
      .then(r => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (tab === 'ALL' ? items : items.filter(i => i.status === tab)),
    [items, tab],
  );

  function openReview(item: OutstationClaim, act: 'approve' | 'reject') {
    setSelected(item); setAction(act); setRemark(''); setActionError('');
  }

  async function handleReview() {
    if (!selected || !action) return;
    if (action === 'reject' && !remark.trim()) {
      setActionError('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);
    try {
      if (action === 'approve') {
        await api.approveClaim(selected.id, remark.trim() || undefined);
      } else {
        await api.rejectClaim(selected.id, remark.trim());
      }
      setSelected(null); setAction(null);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-5xl animate-slide-up">
      <PageHeader title="Outstation Claims" subtitle="Review and manage employee outstation expense claims" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto self-center text-xs text-gray-400 font-medium">
            {filtered.length} {filtered.length === 1 ? 'claim' : 'claims'}
          </span>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <SkeletonCards count={4} withAvatar />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Train className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {tab === 'PENDING' ? 'No pending claims to review' : `No ${tab.toLowerCase()} claims`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col gap-3"
            >
              {/* Header: avatar + name + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials(item)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{item.employee?.employeeCode}</p>
                  </div>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>

              {/* Dates + amount banner */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 rounded-xl">
                <Train className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm font-semibold text-primary-800 flex-1 min-w-0">
                  {format(new Date(item.fromDate), 'd MMM')} – {format(new Date(item.toDate), 'd MMM yyyy')}
                </p>
                <span className="flex-shrink-0 px-2 py-0.5 bg-primary-100 text-primary text-xs font-bold rounded-full">
                  ₹{fmt(item.totalAmount)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <p className="text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {item.destination}
                  {item.transportMode && (
                    <span className="text-gray-400 ml-0.5">· {TRANSPORT_MODE_LABELS[item.transportMode]}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">{item.purpose}</p>

                <div className="pt-1 space-y-1">
                  <ExpenseRow icon={Train}       label="Travel"        value={item.travelExpense}        color="text-primary" />
                  <ExpenseRow icon={Utensils}    label="Food"          value={item.foodExpense}          color="text-gray-500" />
                  <ExpenseRow icon={Hotel}       label="Accommodation" value={item.accommodationExpense} color="text-gray-500" />
                  <ExpenseRow icon={PackageOpen} label="Other"         value={item.otherExpense}         color="text-gray-500" />
                </div>

                {item.approvalRemark && (
                  <p className="text-xs text-gray-500 italic">Remark: {item.approvalRemark}</p>
                )}
              </div>

              {/* Footer: timestamp + actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {format(new Date(item.createdAt), 'd MMM, hh:mm a')}
                </span>
                {item.status === 'PENDING' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openReview(item, 'approve')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />Approve
                    </button>
                    <button
                      onClick={() => openReview(item, 'reject')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
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

      {/* Review Modal */}
      <Modal
        open={!!selected && !!action}
        title={action === 'approve' ? 'Approve Claim' : 'Reject Claim'}
        subtitle={
          selected
            ? `${selected.employee?.firstName ?? ''} ${selected.employee?.lastName ?? ''} — ₹${fmt(selected.totalAmount)}`
            : ''
        }
        onClose={() => { setSelected(null); setAction(null); }}
        panelClassName="max-w-sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trip dates</span>
                <span className="font-medium text-gray-800">
                  {format(new Date(selected.fromDate), 'd MMM')} – {format(new Date(selected.toDate), 'd MMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Destination</span>
                <span className="font-medium text-gray-800">{selected.destination}</span>
              </div>
              {selected.transportMode && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transport</span>
                  <span className="font-medium text-gray-800">{TRANSPORT_MODE_LABELS[selected.transportMode]}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 space-y-1.5">
                <ExpenseRow icon={MapPin}      label="Travel"        value={selected.travelExpense}        color="text-primary" />
                <ExpenseRow icon={Utensils}    label="Food"          value={selected.foodExpense}          color="text-gray-500" />
                <ExpenseRow icon={Hotel}       label="Accommodation" value={selected.accommodationExpense} color="text-gray-500" />
                <ExpenseRow icon={PackageOpen} label="Other"         value={selected.otherExpense}         color="text-gray-500" />
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="font-bold text-gray-900">₹{fmt(selected.totalAmount)}</span>
              </div>
            </div>

            {actionError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {actionError}
              </div>
            )}

            <div>
              <label className={labelCls}>Remark {action === 'reject' ? '(required)' : '(optional)'}</label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={2}
                placeholder={action === 'approve' ? 'Optional note…' : 'Reason for rejection…'}
                className={`${inputCls} resize-none`}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setSelected(null); setAction(null); }}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={processing}
                onClick={handleReview}
                className={
                  action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
