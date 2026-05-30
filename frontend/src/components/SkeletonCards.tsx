import React from 'react';

function SkeletonCard({ withAvatar }: { withAvatar?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-3">
      {withAvatar && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded animate-pulse w-2/5" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
          </div>
          <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse" />
        </div>
      )}
      <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
      <div className="space-y-2">
        <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-auto">
        <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
        <div className="h-6 bg-gray-100 rounded-full animate-pulse w-16" />
      </div>
    </div>
  );
}

export default function SkeletonCards({
  count = 4,
  withAvatar = false,
}: {
  count?: number;
  withAvatar?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} withAvatar={withAvatar} />
      ))}
    </div>
  );
}
