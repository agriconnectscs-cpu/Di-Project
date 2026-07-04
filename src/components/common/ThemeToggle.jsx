import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import { motion as Motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Motion.button
      onClick={toggleTheme}
      className={`relative flex items-center gap-2 rounded-full px-4 py-1 transition-all duration-300 cursor-pointer outline-none h-10 border border-transparent
        ${
          isDark
            ? "text-purple-400 hover:bg-white/5 hover:border-white/10"
            : "text-gray-900 hover:bg-gray-100 hover:border-gray-200"
        }`}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon container */}
      <Motion.div
        initial={false}
        animate={{ rotate: isDark ? 360 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {isDark ? (
          <Moon size={18} className="text-purple-500" />
        ) : (
          <Sun size={18} className="text-yellow-500" />
        )}
      </Motion.div>

      {/* Theme text */}
      <Motion.span
        initial={{ opacity: 0, x: isDark ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="text-xs font-bold tracking-wider"
      >
        {isDark ? "DARK" : "LIGHT"}
      </Motion.span>

      {/* Glow effect */}
      <Motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        transition={{ duration: 0.3 }}
      />
    </Motion.button>
  );
};

export default ThemeToggle;
