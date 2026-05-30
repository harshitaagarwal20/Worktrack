import React, { useEffect, useMemo, useState } from 'react';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as attendanceApi from '../../api/attendance';
import { Attendance } from '../../types';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import SkeletonTable from '../../components/SkeletonTable';

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'hh:mm a'); } catch { return '—'; }
}

function fmtHours(wh?: number | null) {
  if (wh == null) return '—';
  const h = Math.floor(wh), m = Math.round((wh - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MyAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    setLoading(true);
    attendanceApi.getMyAttendance({
      month: currentMonth.getMonth() + 1,
      year:  currentMonth.getFullYear(),
      limit: 31,
    }).then(r => setRecords(r.items)).finally(() => setLoading(false));
  }, [currentMonth]);

  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records],
  );

  const canGoForward = format(addMonths(currentMonth, 1), 'yyyy-MM') <= format(today, 'yyyy-MM');

  return (
    <div className="max-w-3xl animate-slide-up">
      <PageHeader title="My Attendance" subtitle="Your monthly attendance records" />

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-semibold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</p>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          disabled={!canGoForward}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">{format(currentMonth, 'MMMM yyyy')}</p>
          {!loading && <p className="text-xs text-gray-400">{records.length} records</p>}
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody><SkeletonTable cols={5} /></tbody>
            </table>
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No records for this month</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                      {format(new Date(r.date), 'EEE, dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtTime(r.checkIn)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtTime(r.checkOut)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">{fmtHours(r.workHours)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status ?? (r.checkIn && !r.checkOut ? 'CHECKED_IN' : null)} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
