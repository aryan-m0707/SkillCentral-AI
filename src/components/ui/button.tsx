import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mint' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6658F5] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-[#6658F5] text-white hover:bg-[#5345E6] shadow-sm active:scale-[0.98]',
      secondary: 'bg-[#F0F2FA] text-[#17243D] hover:bg-[#E4E8F5] active:scale-[0.98]',
      outline: 'border border-[#E6EAF2] bg-white text-[#17243D] hover:bg-[#F6F8FC] hover:border-[#CBD5E1] active:scale-[0.98]',
      ghost: 'text-[#718096] hover:text-[#17243D] hover:bg-[#F0F2FA]',
      mint: 'bg-[#20C997] text-white hover:bg-[#18A87E] shadow-sm active:scale-[0.98]',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
