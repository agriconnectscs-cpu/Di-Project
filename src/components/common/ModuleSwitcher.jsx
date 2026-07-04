import { Grip } from "lucide-react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../../ThemeProvider";
import { useGetAuth } from "../../hooks/useGetAuth";
// Imports End---

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  speed: 400,
  minimum: 0.1,
  easing: "ease-out",
  trickleSpeed: 200,
});

const ModuleSwitcher = ({ isProfileOpen, setIsProfileOpen, trigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { authData, modules: hookModules } = useGetAuth(location);
  const [isOpen, setIsOpen] = useState(false);

  // Module tile colors
  const tileColors = [
    {
      bg: "bg-blue-500",
      text: "text-blue-500",
      light: "bg-blue-50",
      dark: "bg-blue-500/20",
    },
    {
      bg: "bg-red-500",
      text: "text-red-500",
      light: "bg-red-50",
      dark: "bg-red-500/20",
    },
    {
      bg: "bg-green-500",
      text: "text-green-500",
      light: "bg-green-50",
      dark: "bg-green-500/20",
    },
    {
      bg: "bg-yellow-500",
      text: "text-yellow-500",
      light: "bg-yellow-50",
      dark: "bg-yellow-500/20",
    },
    {
      bg: "bg-purple-500",
      text: "text-purple-500",
      light: "bg-purple-50",
      dark: "bg-purple-500/20",
    },
    {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      light: "bg-indigo-50",
      dark: "bg-indigo-500/20",
    },
    {
      bg: "bg-pink-500",
      text: "text-pink-500",
      light: "bg-pink-50",
      dark: "bg-pink-500/20",
    },
    {
      bg: "bg-orange-500",
      text: "text-orange-500",
      light: "bg-orange-50",
      dark: "bg-orange-500/20",
    },
    {
      bg: "bg-cyan-500",
      text: "text-cyan-500",
      light: "bg-cyan-50",
      dark: "bg-cyan-500/20",
    },
  ];

  // Get effective modules consistent with Sidebar logic
  const modules = useMemo(() => {
    const rawModules =
      authData?.data?.loginUserModules ||
      authData?.data?.modules ||
      hookModules ||
      authData?.data?.clientLocationModules ||
      [];

    // Ensure uniqueness and valid data
    const uniqueModules = [];
    const seenIds = new Set();

    rawModules.forEach((m) => {
      const id = m.appProductModuleId || m.appModuleId;
      if (id && !seenIds.has(id)) {
        uniqueModules.push(m);
        seenIds.add(id);
      }
    });

    return uniqueModules;
  }, [hookModules, authData]);

  // Close on click outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".module-switcher-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (isProfileOpen) {
      setIsOpen(false);
    }
  }, [isProfileOpen]);

  const handleModuleClick = (module) => {
    const moduleId = module.appProductModuleId || module.appModuleId;
    if (moduleId) {
      sessionStorage.setItem("activeModuleId", moduleId);
    }

    const shortName =
      module.targetSource ||
      module.appModuleShortName ||
      module.appProductModuleShortName ||
      module.moduleShortName;

    const targetPath =
      shortName && shortName !== "undefined"
        ? `/${shortName.trim()}`.toLowerCase()
        : "/";
    const currentPath = location.pathname.toLowerCase().replace(/\/$/, "");
    const normalizedTarget = targetPath.replace(/\/$/, "");

    setIsOpen(false);

    if (
      currentPath === normalizedTarget ||
      (currentPath === "" && normalizedTarget === "/")
    ) {
      return;
    }

    NProgress.start();
    navigate(targetPath);
    window.dispatchEvent(new Event("module-switch"));
  };

  // Only show switcher if there are 2 or more modules
  if (modules.length < 2) return null;

  return (
    <div className="relative module-switcher-container">
      <Motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && setIsProfileOpen) {
            setIsProfileOpen(false);
          }
        }}
        className={`flex items-center justify-center rounded-lg transition-all duration-300 relative overflow-hidden cursor-pointer ${
          !trigger ? "w-10 h-10" : "px-0"
        } ${
          isOpen
            ? isDarkMode
              ? "text-purple-400"
              : "text-purple-600"
            : isDarkMode
              ? "text-gray-400 hover:text-purple-400"
              : "text-gray-600 hover:text-purple-600"
        }`}
        title="Switch Module"
      >
        {trigger ? (
          trigger
        ) : (
          <Motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Grip size={22} />
          </Motion.div>
        )}
      </Motion.button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`fixed sm:absolute mt-0 sm:mt-2 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 sm:right-0 top-[70px] sm:top-full w-[290px] sm:w-[340px] max-h-[80vh] rounded-xl sm:rounded-2xl shadow-xl z-50 border overflow-y-auto hide-scrollbar p-4 transform-gpu ${
              isDarkMode
                ? "bg-[#1a1428] border-white/10 shadow-black/40"
                : "bg-white border-gray-200 shadow-purple-100/50"
            }`}
          >
            <div className="mb-4 px-1.5 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <h3
                  className={`text-[11px] font-bold uppercase tracking-[0.15em] ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Your Modules
                </h3>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isDarkMode
                    ? "bg-white/5 text-gray-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {modules.length} Available
              </span>
            </div>

            <div
              className={`grid gap-1 sm:gap-2 transform-gpu grid-cols-2 sm:${
                modules.length <= 6 ? "grid-cols-3" : "grid-cols-4"
              }`}
            >
              {modules.map((module, index) => {
                const color = tileColors[index % tileColors.length];
                const moduleId =
                  module.appProductModuleId || module.appModuleId;

                const currentPath =
                  location.pathname.split("/")[1]?.toLowerCase() || "";
                const mTarget = (module.targetSource || "").toLowerCase();
                const mShort = (module.appModuleShortName || "").toLowerCase();
                const mProdShort = (
                  module.appProductModuleShortName || ""
                ).toLowerCase();
                const mGenShort = (module.moduleShortName || "").toLowerCase();

                const isActive =
                  currentPath &&
                  (currentPath === mTarget ||
                    currentPath === mShort ||
                    currentPath === mProdShort ||
                    currentPath === mGenShort);

                return (
                  <button
                    key={moduleId || index}
                    onClick={() => handleModuleClick(module)}
                    className={`flex flex-col items-center gap-2.5 p-1 sm:p-2 rounded-lg sm:rounded-2xl transition-all duration-300 group cursor-pointer relative ${
                      isActive
                        ? isDarkMode
                          ? "bg-purple-500/10 border border-purple-500/30"
                          : "bg-purple-50 border border-purple-200"
                        : "bg-transparent border border-transparent hover:bg-gray-100/80 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Active Pulse Indicator */}
                    {isActive && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                    )}

                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden  ${
                        isActive && !module.moduleImageURL
                          ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/20"
                          : !module.moduleImageURL
                            ? isDarkMode
                              ? `${color.dark} ${color.text} group-hover:bg-purple-500 group-hover:text-white`
                              : `${color.light} ${color.text} group-hover:bg-purple-600 group-hover:text-white`
                            : isDarkMode
                              ? "bg-white/5 border border-white/10 group-hover:border-purple-500/30"
                              : "bg-white border border-gray-100 group-hover:border-purple-200 shadow-sm"
                      }`}
                    >
                      {module.moduleImageURL ? (
                        <img
                          src={module.moduleImageURL}
                          alt={module.appModuleName}
                          className="w-full h-full object-cover transition-transform"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `<span class="text-xs font-bold">${module.appModuleName?.[0]}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold uppercase tracking-tighter">
                          {module.appModuleName?.[0]}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-bold text-center leading-tight line-clamp-2 min-h-[1.6em] sm:min-h-[2.4em] transition-colors duration-200 ${
                        isActive
                          ? isDarkMode
                            ? "text-white"
                            : "text-purple-700"
                          : isDarkMode
                            ? "text-gray-400 group-hover:text-gray-100"
                            : "text-gray-600 group-hover:text-purple-600"
                      }`}
                    >
                      {module.appModuleName}
                    </span>
                  </button>
                );
              })}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleSwitcher;
