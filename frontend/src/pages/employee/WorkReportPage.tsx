import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertCircle, Building2, CheckCircle, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, Clock, FileText, Plus, Trash2,
} from 'lucide-react';
import * as workReportApi from '../../api/workReport';
import { WorkReport } from '../../types';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const todayStr = format(new Date(), 'yyyy-MM-dd');

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

// Distinct pastel chip colours for client names (cycles if > 5 clients)
const CLIENT_COLORS = [
  'bg-primary-100 text-primary',
  'bg-primary-50 text-primary',
  'bg-primary-100 text-primary',
  'bg-primary-50 text-primary',
  'bg-red-100 text-red-600',
];

interface Section {
  clientName: string;
  tasks: string[];
}

function emptySection(): Section {
  return { clientName: '', tasks: [''] };
}

// ── Client pill ──────────────────────────────────────────────────────────────
function ClientPill({ name, colorIdx }: { name: string; colorIdx: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${CLIENT_COLORS[colorIdx % CLIENT_COLORS.length]}`}>
      <Building2 className="w-3 h-3" />
      {name}
    </span>
  );
}

// ── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ report }: { report: WorkReport }) {
  const [open, setOpen] = useState(false);
  const isToday = report.date.slice(0, 10) === todayStr;
  const date    = new Date(report.date);
  const namedClients = report.entries.map(e => e.clientName).filter(Boolean) as string[];
  const totalTasks   = report.entries.reduce(
    (n, e) => n + e.tasksCompleted.split('\n').filter(Boolean).length, 0,
  );

  return (
    <div className={`border-b border-gray-50 last:border-0 ${isToday ? 'bg-primary-50/20' : ''}`}>
      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-3 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-gray-50/80 transition-colors text-left"
      >
        {/* Date badge */}
        <div className="flex-shrink-0 w-12 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            {format(date, 'EEE')}
          </p>
          <p className={`text-xl font-bold leading-tight ${isToday ? 'text-primary' : 'text-gray-800'}`}>
            {format(date, 'd')}
          </p>
          <p className="text-[10px] text-gray-400">{format(date, 'MMM')}</p>
        </div>

        {/* Client chips + task count */}
        <div className="flex-1 min-w-0">
          {namedClients.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {namedClients.map((c, i) => <ClientPill key={i} name={c} colorIdx={i} />)}
            </div>
          ) : null}
          <p className="text-xs text-gray-400">
            {totalTasks} task{totalTasks !== 1 ? 's' : ''}
            {report.entries.length > 1 && ` across ${report.entries.length} entries`}
          </p>
        </div>

        {/* Hours + today badge + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isToday && (
            <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Today
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />{report.workingHours}h
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-3 sm:px-5 pb-4 pt-0 space-y-4 bg-gray-50/40">
          {report.entries.map((entry, idx) => (
            <div key={entry.id} className="pl-4 sm:pl-16">
              {(entry.clientName || report.entries.length > 1) && (
                <div className="flex items-center gap-2 mb-2">
                  {entry.clientName
                    ? <ClientPill name={entry.clientName} colorIdx={idx} />
                    : <span className="text-xs font-semibold text-gray-400">General</span>}
                </div>
              )}
              <ol className="space-y-1 list-none">
                {entry.tasksCompleted.split('\n').filter(Boolean).map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="font-bold text-gray-300 flex-shrink-0 text-xs mt-0.5">{i + 1}.</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {report.remarks && (
            <p className="pl-4 sm:pl-16 text-xs text-gray-400 italic">{report.remarks}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function WorkReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [reports, setReports]   = useState<WorkReport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // form
  const [sections, setSections] = useState<Section[]>([emptySection()]);
  const [remarks, setRemarks]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const todayReport    = isCurrentMonth
    ? reports.find(r => r.date.slice(0, 10) === todayStr)
    : undefined;
  const canGoForward   = !isCurrentMonth;

  function fetchReports() {
    setLoading(true);
    workReportApi.getMyWorkReports({ month, year, limit: 100 })
      .then(r => setReports(r.items))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchReports(); }, [month, year]);

  function openForm() {
    setSections([emptySection()]); setRemarks(''); setFormError('');
    setFormOpen(true);
  }

  // Section helpers
  function addSection() { setSections(p => [...p, emptySection()]); }
  function removeSection(si: number) {
    setSections(p => p.length === 1 ? p : p.filter((_, i) => i !== si));
  }
  function updateClient(si: number, v: string) {
    setSections(p => p.map((s, i) => i === si ? { ...s, clientName: v } : s));
  }
  function updateTask(si: number, ti: number, v: string) {
    setSections(p => p.map((s, i) =>
      i === si ? { ...s, tasks: s.tasks.map((t, j) => j === ti ? v : t) } : s,
    ));
  }
  function addTask(si: number) {
    setSections(p => p.map((s, i) => i === si ? { ...s, tasks: [...s.tasks, ''] } : s));
  }
  function removeTask(si: number, ti: number) {
    setSections(p => p.map((s, i) =>
      i === si ? { ...s, tasks: s.tasks.length === 1 ? s.tasks : s.tasks.filter((_, j) => j !== ti) } : s,
    ));
  }

  function goBack() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  }
  function goForward() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entries = sections.map(s => ({
      clientName: s.clientName.trim() || undefined,
      tasks: s.tasks.filter(t => t.trim()),
    }));
    if (entries.some(e => e.tasks.length === 0)) {
      setFormError('Each section needs at least one task'); return;
    }
    setFormError(''); setSubmitting(true);
    try {
      await workReportApi.submitWorkReport({
        date: todayStr,
        remarks: remarks.trim() || undefined,
        entries,
      });
      setFormOpen(false);
      fetchReports();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl animate-slide-up space-y-5">
      <PageHeader
        title="Daily Work Report"
        subtitle="Log what you worked on each day"
        action={
          isCurrentMonth && !todayReport ? (
            <Button onClick={openForm}>
              <Plus className="w-4 h-4" />
              Log Today
            </Button>
          ) : undefined
        }
      />

      {/* Today's submitted banner */}
      {isCurrentMonth && todayReport && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Report submitted for today</p>
              <p className="text-xs text-emerald-600">{format(now, 'EEEE, d MMMM yyyy')}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <Clock className="w-3.5 h-3.5" />{todayReport.workingHours}h
            </div>
          </div>
          {/* Entries */}
          <div className="px-5 py-4 space-y-4">
            {todayReport.entries.map((entry, idx) => (
              <div key={entry.id}>
                {entry.clientName && (
                  <div className="mb-2">
                    <ClientPill name={entry.clientName} colorIdx={idx} />
                  </div>
                )}
                {!entry.clientName && todayReport.entries.length > 1 && (
                  <p className="text-xs font-semibold text-gray-400 mb-2">General</p>
                )}
                <ol className="space-y-1.5 list-none">
                  {entry.tasksCompleted.split('\n').filter(Boolean).map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="font-bold text-gray-300 text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {todayReport.remarks && (
              <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
                {todayReport.remarks}
              </p>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Month navigator */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <p className="font-semibold text-gray-800 text-sm flex-1">Report History</p>
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[100px] sm:min-w-[130px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!loading && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {reports.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-1">
              <FileText className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No reports for {MONTHS[month - 1]} {year}</p>
            {isCurrentMonth && (
              <p className="text-xs text-gray-400">Click "Log Today" to submit your first report</p>
            )}
          </div>
        ) : (
          <div>
            {reports.map(r => <HistoryRow key={r.id} report={r} />)}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <Modal
        open={formOpen}
        title="Log Today's Work Report"
        subtitle={format(now, 'EEEE, d MMMM yyyy')}
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

          {sections.map((section, si) => (
            <div key={si} className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100">
                {section.clientName
                  ? <ClientPill name={section.clientName} colorIdx={si} />
                  : (
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {sections.length > 1 ? `Client ${si + 1}` : 'Client / Project'}
                    </span>
                  )}
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(si)}
                    className="ml-auto p-1 text-gray-300 hover:text-red-400 transition-colors rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="px-4 py-3 space-y-3">
                <input
                  type="text"
                  value={section.clientName}
                  onChange={e => updateClient(si, e.target.value)}
                  placeholder="Client or project name (optional)"
                  className={inputCls}
                  maxLength={200}
                />

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${labelCls} mb-0`}>
                      Tasks <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => addTask(si)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Task
                    </button>
                  </div>
                  <div className="space-y-2">
                    {section.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 w-4 text-right flex-shrink-0">
                          {ti + 1}.
                        </span>
                        <input
                          type="text"
                          value={task}
                          onChange={e => updateTask(si, ti, e.target.value)}
                          placeholder={`Task ${ti + 1}…`}
                          className={`${inputCls} flex-1`}
                        />
                        {section.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(si, ti)}
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add another client */}
          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-0.5"
          >
            <div className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </div>
            Add Another Client
          </button>

          {/* Remarks */}
          <div>
            <label className={labelCls}>
              Remarks
              <span className="text-gray-400 font-normal normal-case ml-1">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any blockers, notes, or context…"
              className={`${inputCls} resize-none`}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={sections.every(s => s.tasks.every(t => !t.trim()))}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
