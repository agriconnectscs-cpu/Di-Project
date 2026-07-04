import { X, Filter } from "lucide-react";
import { useTheme } from "../../ThemeProvider";

const FilterToggle = ({ showFilters, setShowFilters }) => {
  const { isDarkMode } = useTheme();

  return (
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`group relative px-5 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${
        showFilters
          ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600"
          : isDarkMode
            ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-600"
      }`}
    >
      {showFilters ? (
        <X size={16} className="transition-transform duration-200 rotate-0" />
      ) : (
        <Filter size={16} className="transition-transform duration-200" />
      )}
      <span className="text-sm font-bold tracking-wide">
        {showFilters ? "Close" : "Filter"}
      </span>
    </button>
  );
};

export default FilterToggle;
