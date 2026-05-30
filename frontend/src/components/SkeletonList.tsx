import React from 'react';

function SkeletonListRow() {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-md animate-pulse w-3/5" />
        <div className="h-3 bg-gray-100 rounded-md animate-pulse w-2/5" />
      </div>
      <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
    </div>
  );
}

export default function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}
