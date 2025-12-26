import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/formatters";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ label, error, className, ...props }, ref) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
    {label}
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
        error && "border-rose-500",
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-rose-500">{error}</span>}
  </label>
));

TextAreaField.displayName = "TextAreaField";
