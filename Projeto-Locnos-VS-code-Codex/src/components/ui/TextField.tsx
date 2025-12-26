import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/formatters";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
      {label}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
            icon && "pl-10",
            error && "border-rose-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  )
);

TextField.displayName = "TextField";
