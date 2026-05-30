import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Clock, Hotel, MapPin, PackageOpen, Plus, Train, Utensils } from 'lucide-react';
import SkeletonCards from '../../components/SkeletonCards';
import * as api from '../../api/outstationClaim';
import { OutstationClaim, TransportMode, TRANSPORT_MODE_LABELS, OUTSTATION_TRANSPORT_MODES } from '../../api/outstationClaim';
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

function ExpenseRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  if (value <= 0) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 flex items-center gap-1.5"><Icon className={`w-3.5 h-3.5 ${color}`} />{label}</span>
      <span className="font-medium text-gray-800">₹{fmt(value)}</span>
    </div>
  );
}

export default function MyOutstationPage() {
  const [items, setItems]       = useState<OutstationClaim[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<TabFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  // form state
  const [fromDate,             setFromDate]             = useState('');
  const [toDate,               setToDate]               = useState('');
  const [destination,          setDestination]          = useState('');
  const [purpose,              setPurpose]              = useState('');
  const [transportMode,        setTransportMode]        = useState<TransportMode | ''>('');
  const [travelExpense,        setTravelExpense]        = useState('');
  const [foodExpense,          setFoodExpense]          = useState('');
  const [accommodationExpense, setAccommodationExpense] = useState('');
  const [otherExpense,         setOtherExpense]         = useState('');
  const [otherExpenseNote,     setOtherExpenseNote]     = useState('');
  const [formError,            setFormError]            = useState('');
  const [submitting,           setSubmitting]           = useState(false);

  function load() {
    setLoading(true);
    api.getMyClaims({ limit: 100 })
      .then(r => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (tab === 'ALL' ? items : items.filter(i => i.status === tab)),
    [items, tab],
  );

  const totalPreview = useMemo(() => {
    const t = parseFloat(travelExpense) || 0;
    const f = parseFloat(foodExpense) || 0;
    const a = parseFloat(accommodationExpense) || 0;
    const o = parseFloat(otherExpense) || 0;
    return t + f + a + o;
  }, [travelExpense, foodExpense, accommodationExpense, otherExpense]);

  function openForm() {
    setFromDate(''); setToDate(''); setDestination(''); setPurpose('');
    setTransportMode(''); setTravelExpense(''); setFoodExpense('');
    setAccommodationExpense(''); setOtherExpense(''); setOtherExpenseNote('');
    setFormError('');
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!fromDate)            { setFormError('From date is required'); return; }
    if (!toDate)              { setFormError('To date is required'); return; }
    if (toDate < fromDate)    { setFormError('End date cannot be before start date'); return; }
    if (!destination.trim())  { setFormError('Destination is required'); return; }
    if (!purpose.trim())      { setFormError('Purpose is required'); return; }
    if (totalPreview <= 0)    { setFormError('Enter at least one expense amount'); return; }

    setSubmitting(true);
    try {
      await api.submitClaim({
        fromDate,
        toDate,
        destination: destination.trim(),
        purpose: purpose.trim(),
        ...(transportMode && { transportMode }),
        ...(parseFloat(travelExpense) > 0        && { travelExpense:        parseFloat(travelExpense) }),
        ...(parseFloat(foodExpense) > 0           && { foodExpense:           parseFloat(foodExpense) }),
        ...(parseFloat(accommodationExpense) > 0  && { accommodationExpense: parseFloat(accommodationExpense) }),
        ...(parseFloat(otherExpense) > 0          && { otherExpense:          parseFloat(otherExpense) }),
        ...(otherExpenseNote.trim()               && { otherExpenseNote:      otherExpenseNote.trim() }),
      });
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl animate-slide-up">
      <PageHeader
        title="Outstation Claims"
        subtitle="Submit and track your outstation expense claims"
        action={
          <Button onClick={openForm}>
            <Plus className="w-4 h-4" />
            New Claim
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
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
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Train className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {tab === 'ALL' ? 'No outstation claims yet — use "New Claim" to get started' : `No ${tab.toLowerCase()} claims`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col gap-3"
            >
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
              <div className="space-y-1.5 text-sm flex-1">
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

                {item.otherExpenseNote && (
                  <p className="text-xs text-gray-400">Note: {item.otherExpenseNote}</p>
                )}
                {item.approvalRemark && (
                  <p className="text-xs text-gray-500 italic">Remark: {item.approvalRemark}</p>
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
        title="New Outstation Claim"
        subtitle="Submit your outstation expenses for approval"
        onClose={() => setFormOpen(false)}
        panelClassName="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Trip dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate} className={inputCls} required />
            </div>
          </div>

          <div>
            <label className={labelCls}>Destination</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Mumbai, Delhi Office"
              className={inputCls}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Purpose</label>
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              rows={2}
              placeholder="Briefly describe the purpose of the trip"
              className={`${inputCls} resize-none`}
              maxLength={1000}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Mode of Transport</label>
            <select
              value={transportMode}
              onChange={e => setTransportMode(e.target.value as TransportMode | '')}
              className={inputCls}
            >
              <option value="">— Select (optional) —</option>
              {OUTSTATION_TRANSPORT_MODES.map(mode => (
                <option key={mode} value={mode}>{TRANSPORT_MODE_LABELS[mode]}</option>
              ))}
            </select>
          </div>

          {/* Expense breakdown */}
          <div>
            <p className={labelCls}>Expense Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Travel (₹)</label>
                <input type="number" value={travelExpense} onChange={e => setTravelExpense(e.target.value)}
                  placeholder="0" min="0" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Food (₹)</label>
                <input type="number" value={foodExpense} onChange={e => setFoodExpense(e.target.value)}
                  placeholder="0" min="0" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Accommodation (₹)</label>
                <input type="number" value={accommodationExpense} onChange={e => setAccommodationExpense(e.target.value)}
                  placeholder="0" min="0" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Other (₹)</label>
                <input type="number" value={otherExpense} onChange={e => setOtherExpense(e.target.value)}
                  placeholder="0" min="0" step="0.01" className={inputCls} />
              </div>
            </div>
          </div>

          {parseFloat(otherExpense) > 0 && (
            <div>
              <label className={labelCls}>Other Expense Note</label>
              <input
                type="text"
                value={otherExpenseNote}
                onChange={e => setOtherExpenseNote(e.target.value)}
                placeholder="Describe the other expense"
                className={inputCls}
                maxLength={500}
              />
            </div>
          )}

          {totalPreview > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl">
              <span className="text-sm text-primary font-medium">Total Claim Amount</span>
              <span className="text-lg font-bold text-primary-800">₹{fmt(totalPreview)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!fromDate || !toDate || !destination.trim() || !purpose.trim() || totalPreview <= 0}
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
