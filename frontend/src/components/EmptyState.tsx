import React from 'react';
import { InboxIcon } from 'lucide-react';

export default function EmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <InboxIcon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
