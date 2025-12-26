import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
}

export const StatCard = ({
  title,
  value,
  subValue,
  trend,
  icon
}: StatCardProps) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {icon && (
        <div className="rounded-full bg-brand-50 p-2 text-brand-600">
          {icon}
        </div>
      )}
    </div>
    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
      {value}
    </p>
    {subValue && (
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {subValue}
      </p>
    )}
    {trend && (
      <p className="mt-2 text-sm font-medium text-emerald-600">
        {trend.value > 0 ? "+" : ""}
        {trend.value}%
        <span className="ml-1 text-slate-500 font-normal">{trend.label}</span>
      </p>
    )}
  </div>
);
