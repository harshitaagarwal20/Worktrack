import React, { useEffect, useState } from 'react';
import { Users, CalendarX, Car, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as employeeApi from '../../api/employee';
import * as leaveApi from '../../api/leave';
import * as travelApi from '../../api/travelReimbursement';
import PageHeader from '../../components/PageHeader';

export default function DeptHeadDashboardPage() {
  const { user } = useAuth();
  const [teamCount, setTeamCount] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);
  const [pendingTravel, setPendingTravel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeeApi.getMyTeam(),
      leaveApi.getAllLeaves({ status: 'PENDING', limit: 200 }),
      travelApi.getAllReimbursements({ status: 'PENDING', limit: 200 }),
    ])
      .then(([team, leaves, travel]) => {
        setTeamCount(team.length);
        setPendingLeaves(leaves.meta.total);
        setPendingTravel(travel.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const name = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email ?? 'Department Head';

  const stats = [
    {
      label: 'Team Members',
      value: teamCount,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves,
      icon: CalendarX,
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
    {
      label: 'Pending Travel Claims',
      value: pendingTravel,
      icon: Car,
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
  ];

  return (
    <div className="animate-slide-up">
      <PageHeader
        title={`Welcome, ${name}`}
        subtitle="Here's an overview of your team's pending actions"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                ) : (
                  value ?? '—'
                )}
              </p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {(pendingLeaves ?? 0) > 0 || (pendingTravel ?? 0) > 0 ? (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <p className="font-semibold text-gray-800 text-sm">Action Required</p>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {(pendingLeaves ?? 0) > 0 && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" />
                {pendingLeaves} leave {pendingLeaves === 1 ? 'request' : 'requests'} awaiting your approval
              </li>
            )}
            {(pendingTravel ?? 0) > 0 && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" />
                {pendingTravel} travel {pendingTravel === 1 ? 'claim' : 'claims'} awaiting your approval
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
