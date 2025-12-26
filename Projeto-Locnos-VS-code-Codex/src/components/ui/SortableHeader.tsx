import { ArrowDownUp } from "lucide-react";
import { cn } from "../../utils/formatters";

interface SortableHeaderProps {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: () => void;
}

export const SortableHeader = ({
  label,
  active,
  direction,
  onSort
}: SortableHeaderProps) => (
  <button
    type="button"
    className={cn(
      "flex items-center gap-2 text-left text-sm font-semibold text-slate-500 transition hover:text-slate-900",
      active && "text-slate-900"
    )}
    onClick={onSort}
  >
    {label}
    <ArrowDownUp
      size={16}
      className={cn(
        "text-slate-400 transition",
        active && direction === "desc" && "rotate-180"
      )}
    />
  </button>
);
