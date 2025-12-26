import { cn } from "../../utils/formatters";

interface StatusChipProps {
  label: string;
  className?: string;
}

export const StatusChip = ({ label, className }: StatusChipProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
      className
    )}
  >
    {label}
  </span>
);
