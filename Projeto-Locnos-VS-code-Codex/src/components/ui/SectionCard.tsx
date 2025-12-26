import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, action, children }: SectionCardProps) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
    <header className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {action}
    </header>
    {children}
  </section>
);
