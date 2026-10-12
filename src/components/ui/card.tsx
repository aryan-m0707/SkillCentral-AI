import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  hoverEffect = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hoverEffect?: boolean }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E6EAF2] shadow-[0_1px_3px_0_rgba(23,36,61,0.04)]',
        hoverEffect && 'transition-card hover:border-[#CBD5E1]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pb-3 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-[#17243D] tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[#718096] mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-2', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0 border-t border-[#F0F2FA] mt-4 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
