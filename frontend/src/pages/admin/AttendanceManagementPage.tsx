import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Pencil, AlertCircle } from 'lucide-react';
import * as attendanceApi from '../../api/attendance';
import * as employeeApi from '../../api/employee';
import { Attendance, AttendanceStatus, Employee } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import SkeletonTable from '../../components/SkeletonTable';
import Modal from '../../components/Modal';

type AttendanceWithEmp = Attendance & { employee: { firstName: string; lastName: string; employeeCode: string; id: string } };

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();
const YEARS = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i);
const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT',        label: 'Present'        },
  { value: 'ABSENT',         label: 'Absent'         },
  { value: 'HALF_DAY',       label: 'Half Day'       },
  { value: 'WORK_FROM_HOME', label: 'Work From Home' },
  { value: 'LEAVE',          label: 'Leave'          },
];

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'hh:mm a'); } catch { return '—'; }
}

function fmtHours(wh?: number | null) {
  if (wh == null) return '—';
  const h = Math.floor(wh), m = Math.round((wh - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function toDatetimeLocal(iso: string) {
  try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm"); } catch { return ''; }
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

export default function AttendanceManagementPage() {
  const today = new Date();

  // ── List state ──────────────────────────────────────────────────────────
  const [records, setRecords]       = useState<AttendanceWithEmp[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [year, setYear]             = useState(now.getFullYear());
  const [empFilter, setEmpFilter]   = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Edit modal state ─────────────────────────────────────────────────────
  const [editRecord, setEditRecord]     = useState<AttendanceWithEmp | null>(null);
  const [editCheckIn, setEditCheckIn]   = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editStatus, setEditStatus]     = useState<AttendanceStatus | ''>('');
  const [editRemarks, setEditRemarks]   = useState('');
  const [editError, setEditError]       = useState('');
  const [editLoading, setEditLoading]   = useState(false);

  useEffect(() => {
    employeeApi.getAllEmployees({ limit: 100 }).then(r => setEmployees(r.items)).catch(() => {});
  }, []);

  function load(p = 1) {
    setLoading(true);
    attendanceApi.getAllAttendance({
      month,
      year,
      employeeId: empFilter || undefined,
      status: undefined,
      page: p,
      limit: 20,
    })
      .then(r => { setRecords(r.items as AttendanceWithEmp[]); setTotalPages(r.meta.totalPages); })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(1); load(1); }, [month, year, empFilter]);
  useEffect(() => { if (page > 1) load(page); }, [page]);

  // ── Edit modal helpers ───────────────────────────────────────────────────
  function openEdit(r: AttendanceWithEmp) {
    setEditRecord(r);
    setEditCheckIn(r.checkIn  ? toDatetimeLocal(r.checkIn)  : '');
    setEditCheckOut(r.checkOut ? toDatetimeLocal(r.checkOut) : '');
    setEditStatus(r.status ?? '');
    setEditRemarks(r.remarks ?? '');
    setEditError('');
  }

  // Auto-computed work hours shown as a read-only hint in the modal
  const editWorkHours = useMemo(() => {
    if (!editCheckIn || !editCheckOut) return null;
    const diff = new Date(editCheckOut).getTime() - new Date(editCheckIn).getTime();
    return diff > 0 ? diff / 3_600_000 : null;
  }, [editCheckIn, editCheckOut]);

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    if (editCheckIn && editCheckOut && new Date(editCheckOut) <= new Date(editCheckIn)) {
      setEditError('Check-out must be after check-in');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      await attendanceApi.editAttendance(editRecord.id, {
        ...(editStatus   && { status:    editStatus }),
        ...(editCheckIn  && { checkIn:   new Date(editCheckIn).toISOString() }),
        ...(editCheckOut && { checkOut:  new Date(editCheckOut).toISOString() }),
        ...(editWorkHours !== null && { workHours: editWorkHours }),
        remarks: editRemarks || undefined,
      });
      setEditRecord(null);
      load(page);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <PageHeader title="Attendance" subtitle="All employee attendance records" />

      {/* Filter bar */}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <div>
            <label className={labelCls}>Month</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Employee</label>
            <select
              value={empFilter}
              onChange={e => setEmpFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      <div className="card overflow-hidden p-0">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">{MONTHS[month - 1]} {year}</p>
              {!loading && <p className="text-xs text-gray-400">{records.length} records</p>}
            </div>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody><SkeletonTable cols={7} /></tbody>
                </table>
              </div>
            ) : records.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No records for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.employee.firstName} {r.employee.lastName}</p>
                          <p className="text-xs text-gray-400">{r.employee.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{format(new Date(r.date), 'EEE, dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtTime(r.checkIn)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtTime(r.checkOut)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">{fmtHours(r.workHours)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status ?? (r.checkIn && !r.checkOut ? 'CHECKED_IN' : null)} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openEdit(r)}
                            title="Edit record"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/8 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editRecord}
        title="Edit Attendance"
        subtitle={editRecord
          ? `${editRecord.employee.firstName} ${editRecord.employee.lastName} · ${format(new Date(editRecord.date), 'EEE, dd MMM yyyy')}`
          : undefined}
        onClose={() => setEditRecord(null)}
        panelClassName="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">

          {editError && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {editError}
            </div>
          )}

          {/* Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Check-in</label>
              <input
                type="datetime-local"
                value={editCheckIn}
                onChange={e => setEditCheckIn(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Check-out</label>
              <input
                type="datetime-local"
                value={editCheckOut}
                onChange={e => setEditCheckOut(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Computed work hours hint */}
          {editWorkHours !== null && (
            <p className="text-xs text-gray-500 -mt-1">
              Computed work hours: <span className="font-semibold text-gray-700">{fmtHours(editWorkHours)}</span>
            </p>
          )}

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as AttendanceStatus | '')}
              className={inputCls}
            >
              <option value="">— No status —</option>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className={labelCls}>Remarks</label>
            <textarea
              value={editRemarks}
              onChange={e => setEditRemarks(e.target.value)}
              rows={2}
              placeholder="Optional note about this correction"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setEditRecord(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
