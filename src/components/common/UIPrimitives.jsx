import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const Card = ({ children, className, title, subtitle, footer }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
        {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
    {footer && <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">{footer}</div>}
  </div>
);

export const Button = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    outline: 'bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-6 py-2.5 text-sm font-bold rounded-xl',
    lg: 'px-8 py-3.5 text-base font-bold rounded-2xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ className, label, error, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-slate-600 ml-1">{label}</label>}
    <input
      className={cn(
        'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 placeholder:text-slate-400',
        error && 'border-red-300 focus:ring-red-100 focus:border-red-500',
        className
      )}
      {...props}
    />
    {error && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{error}</p>}
  </div>
);

export const Select = ({ className, label, error, options, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-slate-600 ml-1">{label}</label>}
    <select
      className={cn(
        'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-500 appearance-none bg-no-repeat',
        error && 'border-red-300 focus:ring-red-100 focus:border-red-500',
        className
      )}
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2364748b\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '1.5em 1.5em'
      }}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{error}</p>}
  </div>
);
