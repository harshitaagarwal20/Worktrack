import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Car, Clock, MapPin, Plus } from 'lucide-react';
import SkeletonCards from '../../components/SkeletonCards';
import * as travelApi from '../../api/travelReimbursement';
import { TravelReimbursement, TransportMode, TRANSPORT_MODE_LABELS, TRAVEL_TRANSPORT_MODES } from '../../api/travelReimbursement';
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

export default function MyTravelPage() {
  const [items, setItems]       = useState<TravelReimbursement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<TabFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [travelDate, setTravelDate]       = useState('');
  const [clientName, setClientName]       = useState('');
  const [reason, setReason]               = useState('');
  const [transportMode, setTransportMode] = useState<TransportMode | ''>('');
  const [ratePerKm, setRatePerKm]         = useState('');
  const [kilometers, setKilometers]       = useState('');
  const [formError, setFormError]         = useState('');
  const [submitting, setSubmitting]       = useState(false);

  function load() {
    setLoading(true);
    travelApi
      .getMyReimbursements({ limit: 100 })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (tab === 'ALL' ? items : items.filter((i) => i.status === tab)),
    [items, tab],
  );

  const previewAmount = useMemo(() => {
    const r = parseFloat(ratePerKm);
    const k = parseFloat(kilometers);
    if (r > 0 && k > 0) return r * k;
    return null;
  }, [ratePerKm, kilometers]);

  function openForm() {
    setTravelDate(''); setClientName(''); setReason('');
    setTransportMode(''); setRatePerKm(''); setKilometers(''); setFormError('');
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const r = parseFloat(ratePerKm);
    const k = parseFloat(kilometers);
    if (!travelDate)        { setFormError('Travel date is required'); return; }
    if (!clientName.trim()) { setFormError('Client name is required'); return; }
    if (!reason.trim())     { setFormError('Reason is required'); return; }
    if (!(r > 0))           { setFormError('Rate per km must be a positive number'); return; }
    if (!(k > 0))           { setFormError('Kilometers must be a positive number'); return; }

    setSubmitting(true);
    try {
      await travelApi.submitReimbursement({
        travelDate,
        clientName: clientName.trim(),
        reason: reason.trim(),
        ...(transportMode && { transportMode }),
        ratePerKm: r,
        kilometers: k,
      });
      setFormOpen(false);
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
        title="Travel Reimbursements"
        subtitle="Submit and track your travel expense claims"
        action={
          <Button onClick={openForm}>
            <Plus className="w-4 h-4" />
            New Claim
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
            {filtered.length} {filtered.length === 1 ? 'claim' : 'claims'}
          </span>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Car className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {tab === 'ALL'
              ? 'No travel claims yet — use "New Claim" to get started'
              : `No ${tab.toLowerCase()} claims`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col gap-3"
            >
              {/* Date + amount banner */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 rounded-xl">
                <Car className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm font-semibold text-primary-800 flex-1 min-w-0">
                  {format(new Date(item.travelDate), 'd MMM yyyy')}
                </p>
                <span className="flex-shrink-0 px-2 py-0.5 bg-primary-100 text-primary text-xs font-bold rounded-full">
                  ₹{fmt(item.amount)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm flex-1">
                <p className="text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {item.clientName}
                </p>
                {item.transportMode && (
                  <p className="text-xs text-gray-500">
                    {TRANSPORT_MODE_LABELS[item.transportMode]} · {item.kilometers} km × ₹{item.ratePerKm}/km
                  </p>
                )}
                {!item.transportMode && (
                  <p className="text-xs text-gray-500">{item.kilometers} km × ₹{item.ratePerKm}/km</p>
                )}
                <p className="text-xs text-gray-500 line-clamp-2">{item.reason}</p>
                {item.approvalRemark && (
                  <p className="text-xs text-gray-500 italic">Remark: {item.approvalRemark}</p>
                )}
                {item.payrollId && (
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-full">
                    Added to Payroll
                  </span>
                )}
              </div>

              {/* Footer: timestamp + status */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {format(new Date(item.createdAt), 'd MMM, hh:mm a')}
                </span>
                <StatusBadge status={item.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <Modal
        open={formOpen}
        title="New Travel Claim"
        subtitle="Your claim will be reviewed by HR and added to payroll on approval"
        onClose={() => setFormOpen(false)}
        panelClassName="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className={labelCls}>Travel Date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Client / Destination</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Tata Motors, Andheri Office"
              className={inputCls}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Purpose / Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly describe the purpose of travel"
              className={`${inputCls} resize-none`}
              maxLength={1000}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Mode of Transport</label>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as TransportMode | '')}
              className={inputCls}
            >
              <option value="">— Select (optional) —</option>
              {TRAVEL_TRANSPORT_MODES.map((mode) => (
                <option key={mode} value={mode}>{TRANSPORT_MODE_LABELS[mode]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Rate per KM (₹)</label>
              <input
                type="number"
                value={ratePerKm}
                onChange={(e) => setRatePerKm(e.target.value)}
                placeholder="e.g. 5"
                min="0.01"
                step="0.01"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Distance (KM)</label>
              <input
                type="number"
                value={kilometers}
                onChange={(e) => setKilometers(e.target.value)}
                placeholder="e.g. 45"
                min="0.1"
                step="0.1"
                className={inputCls}
                required
              />
            </div>
          </div>

          {previewAmount !== null && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-600 font-medium">Estimated Amount</span>
              <span className="text-lg font-bold text-gray-900">₹{fmt(previewAmount)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!travelDate || !clientName.trim() || !reason.trim() || !ratePerKm || !kilometers}
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
