import React from 'react';

export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center py-14 ${className}`}>
      <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
