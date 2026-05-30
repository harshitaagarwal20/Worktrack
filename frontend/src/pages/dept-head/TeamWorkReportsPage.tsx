import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Building2, ChevronDown, Clock, FileText } from 'lucide-react';
import * as workReportApi from '../../api/workReport';
import * as employeeApi from '../../api/employee';
import { WorkReport, Employee } from '../../types';
import PageHeader from '../../components/PageHeader';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const now = new Date();
const YEARS = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

const labelCls  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const selectCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

type WRWithEmp = WorkReport & { employee: { firstName: string; lastName: string; employeeCode: string } };

export default function TeamWorkReportsPage() {
  const [month, setMonth]             = useState(now.getMonth() + 1);
  const [year, setYear]               = useState(now.getFullYear());
  const [empFilter, setEmpFilter]     = useState('');
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [records, setRecords]         = useState<WRWithEmp[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState<string | null>(null);

  useEffect(() => {
    employeeApi.getMyTeam().then(setTeamMembers).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    workReportApi.getAllWorkReports({ month, year, employeeId: empFilter || undefined, limit: 200 })
      .then(r => setRecords(r.items as WRWithEmp[]))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [month, year, empFilter]);

  return (
    <div className="animate-slide-up">
      <PageHeader title="Team Work Reports" subtitle="View daily work logs from your team" />

      {/* Filter bar */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 mb-5">
        <div>
          <label className={labelCls}>Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Member</label>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className={selectCls}>
            <option value="">All Members</option>
            {teamMembers.map(e => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">{MONTHS[month - 1]} {year}</p>
          {!loading && <p className="text-xs text-gray-400">{records.length} reports</p>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No work reports for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map(r => {
              const isOpen = expanded === r.id;
              const clientNames = r.entries.map(e => e.clientName).filter(Boolean);
              const totalTasks  = r.entries.reduce((n, e) => n + e.tasksCompleted.split('\n').filter(Boolean).length, 0);
              return (
                <div key={r.id}>
                  <div
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {r.employee.firstName} {r.employee.lastName}
                          <span className="ml-1.5 text-xs font-normal text-gray-400">{r.employee.employeeCode}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-gray-500">{format(new Date(r.date), 'EEE, d MMM yyyy')}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{r.workingHours}h
                          </span>
                          {clientNames.length > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5 truncate">
                              <Building2 className="w-3 h-3 flex-shrink-0" />{clientNames.join(', ')}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-4 pt-3">
                      {r.entries.map((entry, idx) => (
                        <div key={entry.id}>
                          {entry.clientName ? (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                              <Building2 className="w-3 h-3" />{entry.clientName}
                            </p>
                          ) : r.entries.length > 1 ? (
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Entry {idx + 1}</p>
                          ) : (
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tasks Completed</p>
                          )}
                          <ol className="space-y-0.5 list-none">
                            {entry.tasksCompleted.split('\n').filter(Boolean).map((t, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                                <span className="font-semibold text-gray-400 flex-shrink-0">{i + 1}.</span>
                                {t}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                      {r.remarks && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Remarks</p>
                          <p className="text-sm text-gray-500">{r.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
