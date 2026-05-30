import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Car, MapPin } from 'lucide-react';
import SkeletonList from '../../components/SkeletonList';
import * as travelApi from '../../api/travelReimbursement';
import { TravelReimbursement, TRANSPORT_MODE_LABELS } from '../../api/travelReimbursement';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function TravelReimbursementPage() {
  const [items, setItems]     = useState<TravelReimbursement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    travelApi.getAllReimbursements({ status: 'APPROVED', limit: 200 })
      .then(r => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-slide-up">
      <PageHeader title="Travel Reimbursements" subtitle="Approved employee travel expense claims" />

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">Approved Claims</p>
          {!loading && <p className="text-xs text-gray-400">{items.length} claims</p>}
        </div>

        {loading ? (
          <SkeletonList rows={6} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <Car className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No approved travel claims</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.employee?.firstName} {item.employee?.lastName}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{item.employee?.employeeCode}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-gray-500">{format(new Date(item.travelDate), 'd MMM yyyy')}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />{item.clientName}
                    </span>
                    {item.transportMode && (
                      <span className="text-xs text-gray-400">{TRANSPORT_MODE_LABELS[item.transportMode]}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-800">₹{fmt(item.amount)}</span>
                  <StatusBadge status={item.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
