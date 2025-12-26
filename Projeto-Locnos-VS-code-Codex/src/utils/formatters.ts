import { format, parseISO } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value ?? 0);

export const formatDate = (value?: string | null, fallback = "-") => {
  if (!value) return fallback;
  try {
    return format(parseISO(value), "dd/MM/yyyy");
  } catch {
    return fallback;
  }
};

export const cn = (...classes: ClassValue[]) => clsx(...classes);

export const hyphenate = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
