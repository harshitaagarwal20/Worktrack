import React from 'react';

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className={`h-3.5 bg-gray-100 rounded-md animate-pulse ${
              i === 0 ? 'w-4/5' : i === cols - 1 ? 'w-14' : 'w-3/5'
            }`}
          />
          {i === 0 && (
            <div className="h-3 bg-gray-100 rounded-md animate-pulse w-2/5 mt-2" />
          )}
        </td>
      ))}
    </tr>
  );
}

export default function SkeletonTable({ cols, rows = 8 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
