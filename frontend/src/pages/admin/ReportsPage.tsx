import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as reportsApi from '../../api/reports';
import * as employeeApi from '../../api/employee';
import { Employee } from '../../types';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

/* ── types ── */
interface AttendanceRow {
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; designation: string };
  totalWorkingDays: number;
  presentDays: number;
  wfhDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceRate: number;
}
interface PayrollRow {
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; designation: string };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  presentDays: number;
  absentDays: number;
}
interface AttendanceSummary { month: number; year: number; records: AttendanceRow[] }
interface PayrollSummary    { month: number; year: number; totalEmployees: number; totalGross: number; totalDeductions: number; totalNet: number; records: PayrollRow[] }

/* ── CSV helpers ── */
function escapeCSV(v: string | number) {
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAttendanceCSV(data: AttendanceSummary) {
  const header = [
    'Employee Name', 'Employee Code', 'Designation',
    'Total Working Days', 'Present', 'Half Days', 'Absent',
  ];
  const rows = data.records.map(r => [
    `${r.employee.firstName} ${r.employee.lastName}`,
    r.employee.employeeCode,
    r.employee.designation,
    r.totalWorkingDays,
    r.presentDays,
    r.halfDays,
    r.absentDays,
  ]);
  downloadCSV(`Attendance_Report_${MONTHS[data.month - 1]}_${data.year}.csv`, [header, ...rows]);
}

function exportPayrollCSV(data: PayrollSummary) {
  const header = [
    'Employee Name', 'Employee Code', 'Designation',
    'Present Days', 'Absent Days',
    'Gross Salary (₹)', 'Deductions (₹)', 'Net Salary (₹)', 'Status',
  ];
  const rows = data.records.map(r => [
    `${r.employee.firstName} ${r.employee.lastName}`,
    r.employee.employeeCode,
    r.employee.designation,
    r.presentDays,
    r.absentDays,
    r.grossSalary,
    r.totalDeductions,
    r.netSalary,
    r.status,
  ]);
  downloadCSV(`Payroll_Report_${MONTHS[data.month - 1]}_${data.year}.csv`, [header, ...rows]);
}

/* ── component ── */
export default function ReportsPage() {
  const [tab, setTab]             = useState<'attendance' | 'payroll'>('attendance');
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());
  const [empFilter, setEmpFilter] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attData, setAttData]     = useState<AttendanceSummary | null>(null);
  const [payData, setPayData]     = useState<PayrollSummary | null>(null);
  const [loading, setLoading]     = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    employeeApi.getAllEmployees({ limit: 100 }).then(r => setEmployees(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    if (tab === 'attendance') {
      reportsApi.getAttendanceSummary({ month, year, employeeId: empFilter || undefined })
        .then(setAttData).catch(() => { setAttData(null); setFetchError(true); }).finally(() => setLoading(false));
    } else {
      reportsApi.getPayrollSummary({ month, year })
        .then(setPayData).catch(() => { setPayData(null); setFetchError(true); }).finally(() => setLoading(false));
    }
  }, [tab, month, year, empFilter]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const filterBar = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3 mb-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Month</label>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {tab === 'attendance' && (
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employee</label>
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
      )}

      {/* Export button */}
      <div className="col-span-2 sm:col-span-1 sm:ml-auto flex items-end">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || (tab === 'attendance' ? !attData?.records.length : !payData?.records.length)}
          onClick={() => {
            if (tab === 'attendance' && attData) exportAttendanceCSV(attData);
            if (tab === 'payroll'    && payData) exportPayrollCSV(payData);
          }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports" subtitle="Attendance and payroll summaries" />

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {(['attendance', 'payroll'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'attendance' ? 'Attendance' : 'Payroll'}
          </button>
        ))}
      </div>

      {filterBar}

      {tab === 'attendance' ? (
        /* ── Attendance table ── */
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-800 text-sm">
              Attendance Report — {MONTHS[month - 1]} {year}
            </p>
            {!loading && attData && (
              <p className="text-xs text-gray-400">{attData.records.length} employees</p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <p className="text-center py-14 text-red-400 text-sm">Failed to load data — make sure the backend server is running</p>
          ) : !attData || attData.records.length === 0 ? (
            <p className="text-center py-14 text-gray-400 text-sm">No attendance data for this period</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {attData.records.map(r => (
                <div key={r.employee.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">
                    {r.employee.firstName[0]}{r.employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{r.employee.firstName} {r.employee.lastName}</p>
                    <p className="text-xs text-gray-400">{r.employee.employeeCode} · {r.employee.designation}</p>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-0.5">
                    <p className="text-xs text-gray-500">{r.totalWorkingDays} working days</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-semibold text-emerald-600">{r.presentDays}P</span>
                      <span className="text-xs font-semibold text-gray-500">{r.halfDays}H</span>
                      <span className="text-xs font-semibold text-red-500">{r.absentDays}A</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (
        /* ── Payroll tab ── */
        <div>
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">
                Payroll Report — {MONTHS[month - 1]} {year}
              </p>
              {!loading && payData && (
                <p className="text-xs text-gray-400">{payData.totalEmployees} employees</p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fetchError ? (
              <p className="text-center py-14 text-red-400 text-sm">Failed to load data — make sure the backend server is running</p>
            ) : !payData || payData.records.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No payroll data for this period</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {payData.records.map(r => (
                  <div key={r.employee.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">
                      {r.employee.firstName[0]}{r.employee.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{r.employee.firstName} {r.employee.lastName}</p>
                      <p className="text-xs text-gray-400">{r.employee.employeeCode} · {r.employee.designation}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-gray-500">Gross {fmt(r.grossSalary)}</span>
                        {r.totalDeductions > 0 && <span className="text-xs text-red-400">−{fmt(r.totalDeductions)}</span>}
                        <span className="text-xs text-gray-400">{r.presentDays}P / {r.absentDays}A</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">{fmt(r.netSalary)}</span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
