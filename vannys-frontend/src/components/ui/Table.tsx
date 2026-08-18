import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react';
import { cn } from '@/utils';

interface TableProps {
  /** Résumé lu par les lecteurs d'écran — un tableau sans légende n'est pas annonçable. */
  caption: string;
  columns: ReactNode[];
  children: ReactNode;
  className?: string;
}

/**
 * Tableau d'administration. Défile horizontalement dans son propre conteneur :
 * la page, elle, ne doit jamais déborder sur mobile.
 */
export function Table({ caption, columns, children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted border-b border-border">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-muted/60', className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-muted-foreground', className)} {...props} />;
}
