import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarCheck, Clock, CheckCircle, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import * as attendanceApi from '../../api/attendance';
import { useAuth } from '../../context/AuthContext';
import { Attendance } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'hh:mm a'); } catch { return '—'; }
}

function fmtHours(wh?: number | null) {
  if (wh == null) return '—';
  const h = Math.floor(wh), m = Math.round((wh - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<Attendance | null | undefined>(undefined);
  const [recent, setRecent] = useState<Attendance[]>([]);

  useEffect(() => {
    attendanceApi.getTodayAttendance().then(setToday).catch(() => setToday(null));
    const now = new Date();
    attendanceApi
      .getMyAttendance({ month: now.getMonth() + 1, year: now.getFullYear(), limit: 5 })
      .then(r => setRecent(r.items))
      .catch(() => {});
  }, []);

  const name = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email ?? '';

  const firstName = name.split(' ')[0];

  return (
    <div className="animate-slide-up">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={format(new Date(), 'EEEE, dd MMMM yyyy')}
        action={
          !today?.checkIn ? (
            <Link to="/attendance/mark">
              <Button variant="secondary" size="sm">
                <CalendarCheck className="w-4 h-4" />
                Mark Attendance
              </Button>
            </Link>
          ) : !today?.checkOut ? (
            <Link to="/attendance/mark">
              <Button variant="danger" size="sm">
                <Clock className="w-4 h-4" />
                Check Out
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Today's stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="card card-hover relative overflow-hidden flex items-center gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-1">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Check In</p>
            <p className="font-semibold text-gray-900 mt-0.5">{fmtTime(today?.checkIn)}</p>
          </div>
        </div>

        <div className="card card-hover relative overflow-hidden flex items-center gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-1">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Check Out</p>
            <p className="font-semibold text-gray-900 mt-0.5">{fmtTime(today?.checkOut)}</p>
          </div>
        </div>

        <div className="card card-hover relative overflow-hidden flex items-center gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-1">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Work Hours</p>
            <p className="font-semibold text-gray-900 mt-0.5">{fmtHours(today?.workHours)}</p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {today === undefined ? null : !today ? (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">Attendance not marked yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Don't forget to check in today</p>
            </div>
          </div>
          <Link to="/attendance/mark" className="flex-shrink-0">
            <Button variant="secondary" size="sm">
              Check In <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={today.checkOut ? today.status : 'CHECKED_IN'} />
            <div>
              <p className="font-medium text-gray-800 text-sm">
                {today.checkOut ? 'Attendance complete' : 'Currently checked in'}
              </p>
              {today.checkIn && (
                <p className="text-xs text-gray-500 mt-0.5">Since {fmtTime(today.checkIn)}</p>
              )}
            </div>
          </div>
          {!today.checkOut && (
            <Link to="/attendance/mark" className="flex-shrink-0">
              <Button variant="danger" size="sm">Check Out</Button>
            </Link>
          )}
        </div>
      )}

      {/* Recent attendance */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 text-sm">Recent Attendance</h2>
          <Link to="/attendance" className="text-xs text-primary font-medium hover:underline underline-offset-2">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No records this month</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(r => (
              <div key={r.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {format(new Date(r.date), 'EEE, dd MMM')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtTime(r.checkIn)} – {fmtTime(r.checkOut)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {r.workHours != null && (
                    <span className="text-xs font-medium text-gray-400">{fmtHours(r.workHours)}</span>
                  )}
                  <StatusBadge
                    status={r.status ?? (r.checkIn && !r.checkOut ? 'CHECKED_IN' : null)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
