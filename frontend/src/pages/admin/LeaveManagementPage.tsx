import React, { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { CalendarX } from 'lucide-react';
import SkeletonList from '../../components/SkeletonList';
import * as leaveApi from '../../api/leave';
import { LeaveRequest } from '../../api/leave';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    leaveApi.getAllLeaves({ status: 'APPROVED', limit: 200 })
      .then(r => setLeaves(r.items))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, []);

  function leaveDays(from: string, to: string) {
    const days = differenceInDays(new Date(to), new Date(from)) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  }

  return (
    <div className="animate-slide-up">
      <PageHeader title="Leave Requests" subtitle="Approved employee leave applications" />

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">Approved Leaves</p>
          {!loading && <p className="text-xs text-gray-400">{leaves.length} requests</p>}
        </div>

        {loading ? (
          <SkeletonList rows={6} />
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <CalendarX className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No approved leave requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaves.map(leave => (
              <div key={leave.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <CalendarX className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{leave.employee?.employeeCode}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {format(new Date(leave.fromDate), 'd MMM')} – {format(new Date(leave.toDate), 'd MMM yyyy')}
                    </span>
                    <span className="text-xs text-gray-400">{leaveDays(leave.fromDate, leave.toDate)}</span>
                  </div>
                </div>
                <StatusBadge status={leave.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
