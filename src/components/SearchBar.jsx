import { Search } from "lucide-react";
import { useTheme } from "../ThemeProvider";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`relative transition-colors duration-200 ${className || "w-1/2 sm:w-1/3"}`}
    >
      <Search
        size={18}
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
          isDarkMode ? "text-purple-400" : "text-purple-600"
        }`}
      />

      <input
        id="globalSearch"
        name="globalSearch"
        type="text"
        value={value}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-[15px] rounded-full border transition-colors duration-200 placeholder:text-xs sm:placeholder:text-sm focus:outline-none bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-focus-border)] focus:ring focus:ring-[var(--input-focus-ring)/20]"
        style={{
          fontFamily: "Outfit, sans-serif",
        }}
      />
    </div>
  );
};

export default SearchBar;
