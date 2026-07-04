/* eslint-disable react-hooks/exhaustive-deps */
import NProgress from "nprogress";
import { Search, File, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../ThemeProvider";
import { useGetAuth } from "../hooks/useGetAuth";
// IMPORTS END-----

const MenuSearch = ({
  className = "",
  inputClassName = "",
  onQueryChange,
  onSelect,
  limit = 6,
  value: externalValue,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { menus, modules } = useGetAuth();

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (externalValue !== undefined) {
      setQuery(externalValue);
    }
  }, [externalValue]);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const parentIds = new Set(
      menus.map((m) => String(m.parentAppMenuId || "")),
    );

    const filtered = menus
      .filter((menu) => {
        const name = (
          menu.appMenuDisplayName ||
          menu.appMenuName ||
          ""
        ).toLowerCase();

        const isParent = parentIds.has(String(menu.appProductMenuId));

        return (
          name.includes(query.toLowerCase()) &&
          menu.appMenuTargetURL &&
          !isParent
        );
      })
      .slice(0, limit);

    setResults(filtered);
  }, [query, menus, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      if (!isOpen || results.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      if (!isOpen || results.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      if (!isOpen || results.length === 0) return;
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handleSelect = (menu) => {
    if (!menu?.appMenuTargetURL) return;
    const path = menu.appMenuTargetURL;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    // Update active module ID in sessionStorage if available
    if (menu.appProductModuleId) {
      sessionStorage.setItem("activeModuleId", menu.appProductModuleId);
    }

    if (location.pathname.toLowerCase() === cleanPath.toLowerCase()) {
      setQuery("");
      setIsOpen(false);
      return;
    }

    NProgress.start();

    // Notify sidebar and other components to clear state
    window.dispatchEvent(new CustomEvent("module-switch"));

    navigate(cleanPath);

    setQuery("");
    setIsOpen(false);
    onSelect?.(menu);
  };

  const getModuleName = (moduleId) => {
    if (!modules) return "";
    const module = modules.find(
      (m) => (m.appProductModuleId || m.appModuleId) === Number(moduleId),
    );
    return module?.appModuleName || "";
  };

  return (
    <div className={`relative flex-1 ${className}`} ref={searchRef}>
      <div className="relative group">
        <Search
          size={18}
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isOpen
              ? "text-purple-500"
              : isDarkMode
                ? "text-gray-500 group-hover:text-purple-400"
                : "text-gray-400 group-hover:text-purple-600"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search menus (Ctrl+K)"
          value={query}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onQueryChange?.(e.target.value);
          }}
          className={`w-full pl-10 pr-10 py-2 text-sm rounded-full border transition-all duration-300 focus:outline-none ${
            isDarkMode
              ? "bg-[#141025] border-white/5 text-gray-200 placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5"
              : "bg-gray-100 border-transparent text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5"
          } ${inputClassName}`}
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              onQueryChange?.("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-[100] p-1.5 ${
              isDarkMode
                ? "bg-[#1a1428] border-white/10 shadow-black/60"
                : "bg-white border-gray-100 shadow-gray-200/50"
            }`}
          >
            {results.length > 0 ? (
              <div className="p-1">
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 mb-1 ${
                    isDarkMode ? "text-purple-400/60" : "text-purple-600/60"
                  }`}
                >
                  Search Results
                </p>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={result.appProductMenuId}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                        activeIndex === index
                          ? isDarkMode
                            ? "bg-white/10 text-white"
                            : "bg-purple-100 text-purple-700"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-white/5"
                            : "text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 transition-colors duration-200 ${
                          activeIndex === index
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                            : isDarkMode
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        <File size={14} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate">
                            {result.appMenuDisplayName || result.appMenuName}
                          </span>
                          {result.appProductModuleId && (
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shrink-0 ${
                                isDarkMode
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                  : "bg-purple-50 text-purple-600 border border-purple-100"
                              }`}
                            >
                              {getModuleName(result.appProductModuleId)}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] opacity-60 truncate mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {result.appMenuTargetURL}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    isDarkMode ? "bg-white/5" : "bg-gray-50"
                  }`}
                >
                  <Search
                    size={32}
                    className={`opacity-20 ${isDarkMode ? "text-white" : "text-black"}`}
                  />
                </div>
                <p
                  className={`text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  No results found
                </p>
                <p
                  className={`text-[11px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  No menus found for "{query}"
                </p>
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuSearch;
