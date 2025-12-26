import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
