import React, { useEffect, useState } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { Palmtree, CalendarCheck } from 'lucide-react';
import * as holidayApi from '../../api/holiday';
import { Holiday } from '../../types';
import PageHeader from '../../components/PageHeader';

export default function HolidayPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading]   = useState(true);
  const today = new Date();

  useEffect(() => {
    holidayApi.getHolidays({ limit: 50 }).then(r => setHolidays(r.items)).finally(() => setLoading(false));
  }, []);

  const upcoming = holidays.filter(h => !isPast(new Date(h.date)));
  const past     = holidays.filter(h => isPast(new Date(h.date)));

  function daysLabel(dateStr: string) {
    const d = new Date(dateStr);
    const diff = differenceInDays(d, today);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `in ${diff} days`;
  }

  const Section = ({ title, items, dim }: { title: string; items: Holiday[]; dim?: boolean }) =>
    items.length === 0 ? null : (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">{title}</p>
        <div className="card overflow-hidden p-0">
          <div className="divide-y divide-gray-50">
            {items.map(h => {
              const isUpcoming = !isPast(new Date(h.date));
              return (
                <div key={h.id} className={`flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 ${dim ? 'opacity-60' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${isUpcoming ? 'bg-primary-50' : 'bg-gray-100'}`}>
                    {isUpcoming
                      ? <Palmtree className="w-4 h-4 text-primary" />
                      : <CalendarCheck className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm sm:text-base ${isUpcoming ? 'text-gray-800' : 'text-gray-500'}`}>{h.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(h.date), 'EEE, dd MMM yyyy')}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:hidden">
                      {isUpcoming && (
                        <span className="text-[11px] font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-lg">
                          {daysLabel(h.date)}
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${h.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {h.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    {isUpcoming && (
                      <span className="text-xs font-semibold text-primary bg-primary-50 px-2 py-1 rounded-lg">
                        {daysLabel(h.date)}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${h.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {h.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl animate-slide-up space-y-5">
      <PageHeader title="Holidays" subtitle="Company holiday calendar" />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-gray-400">
          <Palmtree className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No holidays listed</p>
        </div>
      ) : (
        <>
          <Section title={`Upcoming — ${upcoming.length}`} items={upcoming} />
          <Section title={`Past — ${past.length}`}     items={past} dim />
        </>
      )}
    </div>
  );
}
