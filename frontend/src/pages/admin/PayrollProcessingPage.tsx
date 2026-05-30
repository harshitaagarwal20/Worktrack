import React, { useEffect, useState } from 'react';
import { X, Download, Users, Pencil } from 'lucide-react';
import * as payrollApi from '../../api/payroll';
import * as employeeApi from '../../api/employee';
import { Payroll, Employee, PayrollStatus } from '../../types';
import Button from '../../components/Button';
import Input, { Select } from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { openPayslip } from '../../utils/payslip';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();

type Filter = 'ALL' | PayrollStatus;
type Confirm = { id: string; action: 'finalize' | 'paid' } | null;

type BulkState =
  | { phase: 'idle' }
  | { phase: 'confirm' }
  | { phase: 'running' }
  | { phase: 'done'; result: payrollApi.BulkResult };

export default function PayrollProcessingPage() {
  const [payrolls, setPayrolls]   = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<Filter>('ALL');
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Single-generate modal
  const [showGen, setShowGen]     = useState(false);
  const [genEmpId, setGenEmpId]   = useState('');
  const [genMonth, setGenMonth]   = useState(now.getMonth() + 1);
  const [genYear, setGenYear]     = useState(now.getFullYear());
  const [genAdj, setGenAdj]       = useState('');
  const [genRemark, setGenRemark] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]   = useState('');

  // Detail panel + confirm dialog
  const [selected, setSelected]   = useState<Payroll | null>(null);
  const [confirm, setConfirm]     = useState<Confirm>(null);
  const [actioning, setActioning] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Payroll | null>(null);
  const [editAdj, setEditAdj]       = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');

  // Bulk generation
  const [bulkMonth, setBulkMonth] = useState(now.getMonth() + 1);
  const [bulkYear, setBulkYear]   = useState(now.getFullYear());
  const [bulk, setBulk]           = useState<BulkState>({ phase: 'idle' });

  const load = (p = page) => {
    setLoading(true);
    payrollApi.getAllPayrolls({ status: filter === 'ALL' ? undefined : filter, month, year, page: p, limit: 15 })
      .then(r => { setPayrolls(r.items); setTotalPages(r.meta.totalPages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { employeeApi.getAllEmployees({ limit: 100 }).then(r => setEmployees(r.items)); }, []);
  useEffect(() => { load(1); setPage(1); }, [filter, month, year]);
  useEffect(() => { if (page > 1) load(page); }, [page]);

  const closeGenerator = () => {
    setShowGen(false);
    setGenEmpId(''); setGenAdj(''); setGenRemark('');
    setGenMonth(now.getMonth() + 1); setGenYear(now.getFullYear());
    setGenError('');
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault(); setGenError(''); setGenerating(true);
    try {
      await payrollApi.generatePayroll({ employeeId: genEmpId, month: genMonth, year: genYear,
        manualAdjustment: genAdj ? Number(genAdj) : undefined, adjustmentRemark: genRemark || undefined });
      closeGenerator(); load(1); setPage(1);
    } catch (err) { setGenError(err instanceof Error ? err.message : 'Failed to generate'); }
    finally { setGenerating(false); }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActioning(true);
    try {
      if (confirm.action === 'finalize') await payrollApi.finalizePayroll(confirm.id);
      else await payrollApi.markPayrollPaid(confirm.id);
      setConfirm(null); load(page); setSelected(null);
    } catch { setConfirm(null); }
    finally { setActioning(false); }
  };

  const runBulk = async () => {
    setBulk({ phase: 'running' });
    try {
      const result = await payrollApi.generateBulkPayroll(bulkMonth, bulkYear);
      setBulk({ phase: 'done', result });
      load(1); setPage(1);
    } catch (err) {
      setBulk({ phase: 'idle' });
      alert(err instanceof Error ? err.message : 'Bulk generation failed');
    }
  };

  const openEdit = (p: Payroll) => {
    setEditTarget(p);
    setEditAdj(p.manualAdjustment !== 0 ? String(p.manualAdjustment) : '');
    setEditRemark(p.adjustmentRemark ?? '');
    setEditError('');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true); setEditError('');
    try {
      const updated = await payrollApi.adjustPayroll(editTarget.id, {
        manualAdjustment: editAdj ? Number(editAdj) : 0,
        adjustmentRemark: editRemark || undefined,
      });
      setEditTarget(null);
      // refresh list and update selected panel if open
      load(page);
      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const FILTERS: Filter[] = ['ALL', 'DRAFT', 'FINALIZED', 'PAID'];
  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div>
      <PageHeader
        title="Payroll Processing"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulk({ phase: 'confirm' })}>
              <Users className="w-4 h-4" />
              Generate for All
            </Button>
            <Button size="sm" onClick={() => { setGenError(''); setShowGen(true); }}>
              + Generate Payroll
            </Button>
          </div>
        }
      />

      {/* ── Confirm action dialog ── */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'finalize' ? 'Finalize Payroll' : 'Mark as Paid'}
        message={
          confirm?.action === 'finalize'
            ? 'Finalizing this payroll is permanent and cannot be undone. Continue?'
            : 'Mark this payroll as paid? This confirms salary has been disbursed.'
        }
        confirmLabel={confirm?.action === 'finalize' ? 'Finalize' : 'Mark Paid'}
        variant={confirm?.action === 'finalize' ? 'danger' : 'primary'}
        loading={actioning}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* ── Bulk generation modal ── */}
      <Modal
        open={bulk.phase === 'confirm' || bulk.phase === 'running' || bulk.phase === 'done'}
        title="Generate Payroll for All Employees"
        onClose={() => bulk.phase !== 'running' && setBulk({ phase: 'idle' })}
        panelClassName="max-w-lg"
      >
        {bulk.phase === 'confirm' && (
          <div>
            <p className="text-sm text-gray-600 mb-5">
              This will generate payroll for every active employee who doesn't already have one for the selected period.
            </p>
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Month</label>
                <select value={bulkMonth} onChange={e => setBulkMonth(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
                <select value={bulkYear} onChange={e => setBulkYear(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBulk({ phase: 'idle' })}>Cancel</Button>
              <Button onClick={runBulk}>
                <Users className="w-4 h-4" /> Generate for All
              </Button>
            </div>
          </div>
        )}

        {bulk.phase === 'running' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Generating payroll for all active employees…</p>
          </div>
        )}

        {bulk.phase === 'done' && (() => {
          const { generated, skipped, failed, results } = (bulk as { phase: 'done'; result: payrollApi.BulkResult }).result;
          return (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Generated', value: generated, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Already Existed', value: skipped,   color: 'text-primary',    bg: 'bg-primary-50' },
                  { label: 'Failed',     value: failed,    color: 'text-red-600',    bg: 'bg-red-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 mb-5">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-gray-50">
                    <span className="text-gray-700">{r.name}</span>
                    <span className={
                      r.status === 'generated' ? 'text-emerald-600 font-medium' :
                      r.status === 'skipped'   ? 'text-primary font-medium'    :
                                                  'text-red-600 font-medium'
                    }>
                      {r.status === 'generated' ? '✓ Generated' :
                       r.status === 'skipped'   ? '○ Skipped'   :
                       `✗ ${r.error ?? 'Failed'}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setBulk({ phase: 'idle' })}>Done</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Single-generate modal ── */}
      <Modal open={showGen} title="Generate Payroll" onClose={closeGenerator} panelClassName="max-w-2xl">
        {genError && <p className="mb-3 text-sm text-red-500">{genError}</p>}
        <form onSubmit={generate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Employee" value={genEmpId} onChange={e => setGenEmpId(e.target.value)} required>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
          </Select>
          <Select label="Month" value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </Select>
          <Select label="Year" value={genYear} onChange={e => setGenYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Input label="Manual Adjustment (₹, optional)" type="number" step="0.01" value={genAdj} onChange={e => setGenAdj(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Adjustment Remark" value={genRemark} onChange={e => setGenRemark(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={generating} className="w-full sm:w-auto">Generate</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit adjustment modal ── */}
      <Modal
        open={!!editTarget}
        title="Edit Payroll"
        subtitle={editTarget ? `${editTarget.employee.firstName} ${editTarget.employee.lastName} — ${MONTHS[editTarget.month - 1]} ${editTarget.year}` : ''}
        onClose={() => setEditTarget(null)}
        panelClassName="max-w-md"
      >
        {editTarget && (
          <form onSubmit={saveEdit} className="space-y-4">
            {/* Read-only summary */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Gross</p>
                <p className="font-semibold text-gray-800">{fmt(editTarget.grossSalary)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Deductions</p>
                <p className="font-semibold text-red-600">−{fmt(editTarget.totalDeductions)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Net (current)</p>
                <p className="font-semibold text-gray-800">{fmt(editTarget.netSalary)}</p>
              </div>
            </div>

            {editError && <p className="text-sm text-red-500">{editError}</p>}

            <Input
              label="Manual Adjustment (₹)"
              type="number"
              step="0.01"
              placeholder="e.g. 500 or -200"
              value={editAdj}
              onChange={e => setEditAdj(e.target.value)}
            />
            <Input
              label="Remark"
              placeholder="Reason for adjustment"
              value={editRemark}
              onChange={e => setEditRemark(e.target.value)}
            />

            {editAdj && (
              <div className="flex items-center justify-between px-4 py-3 bg-primary-50 rounded-xl text-sm">
                <span className="text-gray-600">New net salary</span>
                <span className="font-bold text-gray-900">
                  {fmt(Math.max(0, editTarget.grossSalary - editTarget.totalDeductions + (Number(editAdj) || 0)))}
                </span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" type="button" onClick={() => setEditTarget(null)} disabled={editSaving}>
                Cancel
              </Button>
              <Button type="submit" loading={editSaving}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto flex-shrink-0">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Selected payroll detail panel ── */}
      {selected && (
        <div className="card mb-5 border-l-4 border-primary animate-slide-up">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800">{selected.employee.firstName} {selected.employee.lastName}</h3>
              <p className="text-sm text-gray-500">{MONTHS[selected.month - 1]} {selected.year}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {selected.status === 'DRAFT' && (
                <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => openPayslip(selected)}>
                <Download className="w-3.5 h-3.5" /> Payslip
              </Button>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {([
              ['Working Days', selected.totalWorkingDays],
              ['Present', selected.presentDays],
              ['Absent', selected.absentDays],
              ['Half Days', selected.halfDays],
              ['Paid Holidays', selected.paidHolidays],
              ['Approved Leaves', selected.approvedLeaves],
              ['Gross Salary', fmt(selected.grossSalary)],
              ['Deductions', fmt(selected.totalDeductions)],
            ] as [string, string | number][]).map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">{l}</p>
                <p className="font-semibold text-gray-800 text-sm">{v}</p>
              </div>
            ))}
          </div>
          {selected.manualAdjustment !== 0 && (
            <p className="text-sm text-gray-600 mb-3">
              Adjustment: {fmt(selected.manualAdjustment)}
              {selected.adjustmentRemark ? ` — ${selected.adjustmentRemark}` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <p className="text-xl font-bold text-gray-900">Net: {fmt(selected.netSalary)}</p>
            <StatusBadge status={selected.status} size="sm" />
          </div>
          {selected.status === 'DRAFT' && (
            <div className="mt-4">
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setConfirm({ id: selected.id, action: 'finalize' })}>Finalize Payroll</Button>
            </div>
          )}
          {selected.status === 'FINALIZED' && (
            <div className="mt-4">
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setConfirm({ id: selected.id, action: 'paid' })}>Mark as Paid</Button>
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payrolls.length === 0 ? (
          <EmptyState message="No payroll records" />
        ) : (
          <div className="divide-y divide-gray-100">
            {payrolls.map(p => (
              <div
                key={p.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelected(p)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">
                    {p.employee.firstName[0]}{p.employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {p.employee.firstName} {p.employee.lastName}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">{p.employee.employeeCode}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-gray-500">{MONTHS[p.month - 1]} {p.year}</span>
                      <span className="text-xs text-gray-400">{p.presentDays}/{p.totalWorkingDays} days</span>
                      <span className="text-xs text-gray-500">Gross {fmt(p.grossSalary)}</span>
                      {p.totalDeductions > 0 && <span className="text-xs text-red-400">−{fmt(p.totalDeductions)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">{fmt(p.netSalary)}</span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-0 sm:ml-12" onClick={e => e.stopPropagation()}>
                  <button
                    title="Download Payslip"
                    onClick={() => openPayslip(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {p.status === 'DRAFT' && (
                    <button
                      title="Edit Payroll"
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {p.status === 'DRAFT' && (
                    <Button size="sm" variant="outline" onClick={() => setConfirm({ id: p.id, action: 'finalize' })}>Finalize</Button>
                  )}
                  {p.status === 'FINALIZED' && (
                    <Button size="sm" variant="outline" onClick={() => setConfirm({ id: p.id, action: 'paid' })}>Mark Paid</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
