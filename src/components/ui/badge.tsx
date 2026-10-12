import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'accent' | 'warning' | 'danger' | 'outline' | 'demo';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#F0F2FA] text-[#17243D] border-[#E6EAF2]',
    mint: 'bg-[#E6F9F4] text-[#138A67] border-[#B7EEDF]',
    accent: 'bg-[#EFEBFE] text-[#5546DC] border-[#D6CDFD]',
    warning: 'bg-[#FEF6E9] text-[#B45309] border-[#FDE5BD]',
    danger: 'bg-[#FEECEB] text-[#DC2626] border-[#FDCAC7]',
    outline: 'bg-white text-[#718096] border-[#E6EAF2]',
    demo: 'bg-amber-100 text-amber-800 border-amber-300 font-bold tracking-wide uppercase',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
