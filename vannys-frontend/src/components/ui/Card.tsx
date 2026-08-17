import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-token border border-border shadow-card',
        className,
      )}
      {...props}
    />
  );
}

// `title` porte ici un contenu React, pas l'attribut HTML title : on l'exclut.
interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)} {...props}>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground truncate">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 px-5 py-4 border-t border-border', className)}
      {...props}
    />
  );
}
