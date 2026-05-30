import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as payrollApi from '../../api/payroll';
import { Payroll } from '../../types';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import SkeletonTable from '../../components/SkeletonTable';
import { openPayslip } from '../../utils/payslip';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();
const YEARS = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i);

export default function MyPayslipsPage() {
  const [payrolls, setPayrolls]   = useState<Payroll[]>([]);
  const [loading, setLoading]     = useState(true);
  const [year, setYear]           = useState(now.getFullYear());
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    payrollApi.getMyPayrolls({ year, page, limit: 12 })
      .then(r => { setPayrolls(r.items); setTotalPages(r.meta.totalPages); })
      .catch(() => setPayrolls([]))
      .finally(() => setLoading(false));
  }, [year, page]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="animate-slide-up">
      <PageHeader title="My Payslips" subtitle="View and download your monthly payslips" />

      <div className="flex items-center gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
          <select
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="font-semibold text-gray-800 text-sm">Payroll History — {year}</p>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Period', 'Working Days', 'Present', 'Gross', 'Deductions', 'Net Salary', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody><SkeletonTable cols={8} rows={6} /></tbody>
            </table>
          </div>
        ) : payrolls.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No payslips found for {year}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Period', 'Working Days', 'Present', 'Gross', 'Deductions', 'Net Salary', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.totalWorkingDays}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{p.presentDays}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-red-500">
                      {p.totalDeductions > 0 ? `−${fmt(p.totalDeductions)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.netSalary)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <button
                        title="Download Payslip"
                        onClick={() => openPayslip(p)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
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
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
