import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-primary text-white hover:bg-primary-700 shadow-button-primary hover:shadow-none disabled:opacity-50 disabled:shadow-none',
  secondary: 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50',
  danger:    'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
  outline:   'border border-primary text-primary hover:bg-primary-50 disabled:opacity-50',
  ghost:     'text-gray-600 hover:bg-gray-100 disabled:opacity-50',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  loading,
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: Props) {
  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-sm' :
    size === 'lg' ? 'px-6 py-2.5 text-base' :
    'px-4 py-2 text-sm';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer ${sizeClass} ${VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
