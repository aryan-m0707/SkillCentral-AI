import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#718096]">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] placeholder-[#94A3B8] transition-all focus:outline-none focus:border-[#6658F5] focus:ring-2 focus:ring-[#6658F5]/10 disabled:opacity-50 disabled:bg-[#F8FAFC]',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
