import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CalendarCheck, UserX, CalendarX,
  ArrowRight, Car, FileText,
} from 'lucide-react';
import * as reportsApi from '../../api/reports';
import { DashboardSummary } from '../../types';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reportsApi.getDashboardSummary().then(setSummary).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const present    = summary?.attendance.presentToday ?? 0;
  const absent     = summary?.attendance.absentToday ?? 0;
  const total      = summary?.totalEmployees ?? 0;
  const attendPct  = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="animate-slide-up space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Organisation overview</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Employees',
            value: total,
            icon: Users,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary',
            border: 'border-primary-100',
          },
          {
            label: 'Present Today',
            value: present,
            icon: CalendarCheck,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            border: 'border-emerald-100',
          },
          {
            label: 'Absent Today',
            value: absent,
            icon: UserX,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            border: 'border-red-100',
          },
          {
            label: 'Pending Leaves',
            value: summary?.pendingApprovals.leaves ?? 0,
            icon: CalendarX,
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary',
            border: 'border-primary-100',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800">Today's Attendance</p>
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3 mb-3">
            <span className="text-3xl sm:text-4xl font-bold text-gray-900">{attendPct}%</span>
            <span className="text-sm text-gray-400 mb-1">attendance rate</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${attendPct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              {present} present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              {absent} absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
              {summary?.attendance.notMarkedToday ?? 0} not marked
            </span>
          </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-800 mb-4">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Employees',      icon: Users,         path: '/employees',    bg: 'bg-primary-50',  color: 'text-primary' },
            { label: 'Leave Requests', icon: CalendarX,     path: '/leaves',       bg: 'bg-primary-50',  color: 'text-primary' },
            { label: 'Work Reports',   icon: FileText,      path: '/work-reports', bg: 'bg-primary-50',  color: 'text-primary' },
            { label: 'Travel Claims',  icon: Car,           path: '/travel',       bg: 'bg-primary-50',  color: 'text-primary' },
          ].map(({ label, icon: Icon, path, bg, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
