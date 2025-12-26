import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
    <p className="text-lg font-semibold text-slate-900 dark:text-white">
      {title}
    </p>
    <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
