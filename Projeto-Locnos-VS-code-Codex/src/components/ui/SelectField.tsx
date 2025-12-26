import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/formatters";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
      {label}
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
          error && "border-rose-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  )
);

SelectField.displayName = "SelectField";
