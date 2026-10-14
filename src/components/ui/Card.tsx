import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`p-6 pb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: CardProps) {
  return (
    <h3
      className={`text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: CardProps) {
  return (
    <p
      className={`text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800/60 mt-4 flex items-center ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
