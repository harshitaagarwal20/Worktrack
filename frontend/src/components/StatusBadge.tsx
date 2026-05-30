import React from 'react';

type Status = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'WORK_FROM_HOME' | 'LEAVE'
  | 'PENDING' | 'APPROVED' | 'REJECTED'
  | 'DRAFT' | 'FINALIZED' | 'PAID'
  | 'CHECKED_IN';

const CONFIG: Record<Status, { label: string; className: string }> = {
  PRESENT:        { label: 'Present',    className: 'bg-emerald-100 text-emerald-700' },
  ABSENT:         { label: 'Absent',     className: 'bg-red-100 text-red-700' },
  HALF_DAY:       { label: 'Half Day',   className: 'bg-gray-100 text-gray-600' },
  WORK_FROM_HOME: { label: 'WFH',        className: 'bg-primary-100 text-primary' },
  LEAVE:          { label: 'Leave',      className: 'bg-primary-100 text-primary' },
  PENDING:        { label: 'Pending',    className: 'bg-primary-100 text-primary' },
  APPROVED:       { label: 'Approved',   className: 'bg-emerald-100 text-emerald-700' },
  REJECTED:       { label: 'Rejected',   className: 'bg-red-100 text-red-700' },
  DRAFT:          { label: 'Draft',      className: 'bg-gray-100 text-gray-600' },
  FINALIZED:      { label: 'Finalized',  className: 'bg-primary-100 text-primary' },
  PAID:           { label: 'Paid',       className: 'bg-emerald-100 text-emerald-700' },
  CHECKED_IN:     { label: 'Checked In', className: 'bg-primary-100 text-primary' },
};

export default function StatusBadge({ status, size = 'md' }: { status: string | null | undefined; size?: 'sm' | 'md' }) {
  if (!status) return null;
  const cfg = CONFIG[status as Status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`badge ${cfg.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      {cfg.label}
    </span>
  );
}
