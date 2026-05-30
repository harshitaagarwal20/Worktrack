import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, Clock, LogIn, LogOut, Timer } from 'lucide-react';
import * as attendanceApi from '../../api/attendance';
import { Attendance } from '../../types';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

type ScreenState = 'loading' | 'idle' | 'checked-in' | 'checked-out';

function computeStatus(h: number) {
  if (h < 4) return 'ABSENT';
  if (h < 8) return 'HALF_DAY';
  return 'PRESENT';
}

function fmtDuration(isoStart: string) {
  const mins = Math.floor((Date.now() - new Date(isoStart).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtHours(wh: number) {
  const h = Math.floor(wh);
  const m = Math.round((wh - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTime(iso?: string) {
  if (!iso) return '-';
  try {
    return format(new Date(iso), 'hh:mm a');
  } catch {
    return '-';
  }
}

function getStateCopy(screen: ScreenState, attendance: Attendance | null, todayLabel: string) {
  if (screen === 'checked-in') {
    return {
      title: 'Checked in',
      subtitle: 'Your attendance session is running right now.',
      tone: 'border-emerald-200 bg-emerald-50',
      icon: Timer,
      helper: attendance?.checkIn ? `In at ${fmtTime(attendance.checkIn)}` : 'Session active',
      badge: 'text-emerald-700 bg-emerald-100',
      titleColor: 'text-emerald-900',
      textColor: 'text-emerald-700',
    };
  }

  if (screen === 'checked-out') {
    return {
      title: 'Attendance marked',
      subtitle: 'Check-in and check-out were saved for today.',
      tone: 'border-gray-200 bg-gray-50',
      icon: CalendarDays,
      helper: attendance?.workHours != null ? `Worked ${fmtHours(attendance.workHours)}` : 'Completed',
      badge: 'text-gray-700 bg-gray-100',
      titleColor: 'text-gray-900',
      textColor: 'text-gray-600',
    };
  }

  return {
    title: 'Ready to start',
    subtitle: '',
    tone: 'border-primary-100 bg-primary-50',
    icon: ArrowRight,
    helper: `Today: ${todayLabel}`,
    badge: 'text-primary bg-primary-100',
    titleColor: 'text-gray-900',
    textColor: 'text-primary',
  };
}

export default function MarkAttendancePage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE, dd MMM yyyy');

  const [screen, setScreen] = useState<ScreenState>('loading');
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [now, setNow] = useState(new Date());
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clockRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  useEffect(() => {
    fetchToday();
  }, []);

  useEffect(() => {
    if (screen === 'checked-in' && attendance?.checkIn) {
      setDuration(fmtDuration(attendance.checkIn));
      durationRef.current = setInterval(() => setDuration(fmtDuration(attendance!.checkIn!)), 60000);
    }

    return () => clearInterval(durationRef.current);
  }, [screen, attendance]);

  async function fetchToday() {
    try {
      const rec = await attendanceApi.getTodayAttendance();
      if (rec) {
        setAttendance(rec);
        setScreen(rec.checkOut ? 'checked-out' : 'checked-in');
      } else {
        setScreen('idle');
      }
    } catch {
      setScreen('idle');
    }
  }

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const rec = await attendanceApi.checkIn({
        date: today,
        checkInTime: new Date().toISOString(),
      });
      setAttendance(rec);
      setScreen('checked-in');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance) return;
    setSubmitting(true);
    setError(null);

    try {
      const checkOutTime = new Date();
      const workHours = parseFloat(
        ((checkOutTime.getTime() - new Date(attendance.checkIn!).getTime()) / 3600000).toFixed(4),
      );
      const rec = await attendanceApi.checkOut({
        attendanceId: attendance.id,
        checkOutTime: checkOutTime.toISOString(),
        workHours,
        status: computeStatus(workHours),
      });
      setAttendance(rec);
      setScreen('checked-out');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-out failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (screen === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const state = getStateCopy(screen, attendance, todayLabel) as {
    title: string;
    subtitle: string;
    tone: string;
    icon: React.ComponentType<{ className?: string }>;
    helper: string;
    badge: string;
    titleColor: string;
    textColor: string;
  };
  const StateIcon = state.icon;

  return (
    <div className="relative w-full overflow-hidden rounded-none bg-gradient-to-b from-gray-50 via-white to-primary-50/30 p-3 sm:mx-auto sm:max-w-2xl sm:rounded-[2rem] sm:p-5">
      <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-gray-50 to-transparent" />
      <div className="absolute -top-8 right-2 -z-10 h-28 w-28 rounded-full bg-gray-200/35 blur-3xl" />
      <div className="absolute -bottom-12 left-0 -z-10 h-32 w-32 rounded-full bg-primary-200/20 blur-3xl" />

      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow-sm">
          <CalendarDays className="h-3.5 w-3.5" />
          {todayLabel}
        </div>
        <h1 className="mt-3 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">Mark Attendance</h1>
      </div>

      <div className={`card mb-4 overflow-hidden border ${state.tone} p-3 shadow-sm sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${state.badge}`}>
            <StateIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Today
            </div>
            <h2 className={`mt-2 text-sm font-semibold tracking-tight sm:text-base ${state.titleColor}`}>{state.title}</h2>
            <p className={`mt-1 text-[11px] leading-4 sm:text-xs sm:leading-5 ${state.textColor}`}>{state.subtitle}</p>
            <p className={`mt-1.5 text-[11px] font-medium sm:text-xs ${state.textColor}`}>{state.helper}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs text-red-700 shadow-sm md:text-sm">
          {error}
        </div>
      )}

      {screen === 'idle' && (
        <div className="card border-gray-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Start your session</h3>
              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                One tap records today&apos;s check-in time.
              </p>
            </div>
          </div>
          <Button
            onClick={handleCheckIn}
            loading={submitting}
            disabled={submitting}
            variant="secondary"
            size="lg"
          className="mt-4 w-full rounded-2xl py-2.5 text-sm shadow-sm"
          >
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
        </div>
      )}

      {screen === 'checked-in' && attendance && (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card bg-white p-3 shadow-sm sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Checked In</p>
              <p className="mt-1 text-xs font-semibold text-gray-900">{fmtTime(attendance.checkIn)}</p>
            </div>
            <div className="card bg-white p-3 shadow-sm sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Current Hours</p>
              <p className="mt-1 text-lg font-bold text-primary">{duration}</p>
            </div>
          </div>

          <div className="card border border-emerald-200 bg-emerald-50 p-3 shadow-sm sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Timer className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mt-1 text-base font-semibold tracking-tight text-emerald-900">You are currently working</p>
                <p className="mt-1 text-[11px] text-emerald-700">Check out when your day is complete.</p>
              </div>
            </div>
            <Button
              onClick={handleCheckOut}
              loading={submitting}
              variant="secondary"
              size="lg"
              className="mt-4 w-full rounded-2xl text-sm"
            >
              <LogOut className="h-4 w-4" />
              Check Out
            </Button>
          </div>
        </div>
      )}

      {screen === 'checked-out' && attendance && (
        <div className="grid gap-4">
          <div className="card border-emerald-100 bg-emerald-50/60 p-3 sm:p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Attendance marked</h3>
              <p className="mt-1 text-[11px] text-gray-500">Your day has been recorded successfully.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Status', value: <StatusBadge status={attendance.status} /> },
              { label: 'Check In', value: fmtTime(attendance.checkIn) },
              { label: 'Check Out', value: fmtTime(attendance.checkOut) },
              { label: 'Total Hours', value: attendance.workHours != null ? fmtHours(attendance.workHours) : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="card bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <div className="mt-1.5 text-xs font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
