import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronsLeft,
  Ellipsis,
  FolderOpen,
  Folder,
  LayoutDashboard,
  File,
  X,
} from "lucide-react";

import { useTheme } from "../ThemeProvider";
import { useGetAuth } from "../hooks/useGetAuth";
import { useSidebar } from "../context/SidebarContext";
// Imports End ------

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  speed: 400,
  minimum: 0.1,
  easing: "ease",
  trickleSpeed: 200,
});

const Sidebar = () => {
  const { authData, loginUserModules, menus } = useGetAuth();
  const { isExpanded, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [navItems, setNavItems] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const [activeModule, setActiveModule] = useState(null);
  const [activePopupKey, setActivePopupKey] = useState(null);
  const sidebarRef = useRef(null);
  const isCollapsed = !isExpanded && !isMobileOpen;

  const effectiveModules = useMemo(() => {
    return (
      loginUserModules ||
      authData?.data?.loginUserModules ||
      authData?.data?.modules ||
      []
    );
  }, [loginUserModules, authData]);

  const effectiveMenus = useMemo(() => {
    return (
      menus || authData?.data?.loginUserMenus || authData?.data?.menus || []
    );
  }, [menus, authData]);

  const isActive = useCallback(
    (path) => {
      if (!path) return false;
      const cleanPath = path.replace(/\/$/, "").toLowerCase();
      const currentPath = location.pathname.replace(/\/$/, "").toLowerCase();
      return currentPath === cleanPath;
    },
    [location.pathname],
  );

  const toggleMenu = (key) => {
    setOpenMenus((prev) => {
      const isOpening = !prev[key];

      if (!isOpening) {
        const newState = { ...prev };
        newState[key] = false;
        Object.keys(newState).forEach((k) => {
          if (k.startsWith(`${key}-`)) {
            newState[k] = false;
          }
        });
        return newState;
      }

      const parentPrefix = key.substring(0, key.lastIndexOf("-"));
      const newState = { ...prev };

      Object.keys(newState).forEach((k) => {
        if (newState[k]) {
          const kPrefix = k.substring(0, k.lastIndexOf("-"));

          if (kPrefix === parentPrefix && k !== key) {
            newState[k] = false;

            Object.keys(newState).forEach((descendant) => {
              if (descendant.startsWith(`${k}-`)) {
                newState[descendant] = false;
              }
            });
          }
        }
      });

      newState[key] = true;
      return newState;
    });
  };

  // Build menu tree
  const buildTree = (parentId, allMenus, moduleShortName) =>
    allMenus
      .filter((m) => String(m.parentAppMenuId) === String(parentId))
      .map((m) => ({
        id: m.appProductMenuId,
        name: m.appMenuDisplayName || m.appMenuName,
        seqNo: m.appMenuSeqNo || 0,
        path: m.appMenuTargetURL
          ? m.appMenuTargetURL.startsWith("/")
            ? m.appMenuTargetURL
            : `/${m.appMenuTargetURL}`
          : null,
        children: buildTree(m.appProductMenuId, allMenus, moduleShortName),
      }))
      .sort((a, b) => a.seqNo - b.seqNo);

  // Handle click outside to close popups when collapsed
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setActivePopupKey(null);
      }
    };

    if (isCollapsed && activePopupKey) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed, activePopupKey]);

  // Listen for module switch event from Header to clear open menus
  useEffect(() => {
    const handleModuleSwitch = () => {
      setOpenMenus({});
      setActivePopupKey(null);
    };

    window.addEventListener("module-switch", handleModuleSwitch);
    return () =>
      window.removeEventListener("module-switch", handleModuleSwitch);
  }, []);

  useEffect(() => {
    if (!effectiveModules.length || !effectiveMenus.length) return;

    let moduleShortName = location.pathname.split("/")[1]?.toUpperCase();
    let matchedModule =
      effectiveModules.find(
        (m) =>
          m.appModuleShortName?.toUpperCase() === moduleShortName ||
          m.appProductModuleShortName?.toUpperCase() === moduleShortName,
      ) || null;

    if (!matchedModule) {
      const savedModule = sessionStorage.getItem("activeModuleId");
      matchedModule =
        effectiveModules.find(
          (m) => m.appProductModuleId === Number(savedModule),
        ) || effectiveModules[0];
    }

    if (!matchedModule) return;

    setActiveModule(matchedModule);
    sessionStorage.setItem("activeModuleId", matchedModule.appProductModuleId);

    const moduleMenus = effectiveMenus.filter(
      (m) =>
        Number(m.appProductModuleId) ===
        Number(matchedModule.appProductModuleId),
    );

    const parents = moduleMenus.filter((m) => !m.parentAppMenuId);
    const tree = parents
      .map((parent) => ({
        id: parent.appProductMenuId,
        name: parent.appMenuDisplayName || parent.appMenuName,
        seqNo: parent.appMenuSeqNo || 0,
        path: parent.appMenuTargetURL
          ? parent.appMenuTargetURL.startsWith("/")
            ? parent.appMenuTargetURL
            : `/${parent.appMenuTargetURL}`
          : null,
        children: buildTree(
          parent.appProductMenuId,
          moduleMenus,
          matchedModule.appProductModuleShortName ||
            matchedModule.appModuleShortName,
        ),
      }))
      .sort((a, b) => a.seqNo - b.seqNo);

    setNavItems(tree);

    const findFirstPath = (items) => {
      for (const item of items) {
        if (item.path) return item.path;
        if (item.children && item.children.length > 0) {
          const childPath = findFirstPath(item.children);
          if (childPath) return childPath;
        }
      }
      return null;
    };

    const findAndExpandActiveMenus = (items, parentKey = "") => {
      items.forEach((item, index) => {
        const key = `${parentKey}-${item.id || index}`;

        if (item.children && item.children.length > 0) {
          // Check if any child is active
          const hasActiveChild = (children) => {
            return children.some((child) => {
              if (child.path && isActive(child.path)) return true;
              if (child.children && child.children.length > 0) {
                return hasActiveChild(child.children);
              }
              return false;
            });
          };

          if (hasActiveChild(item.children)) {
            setOpenMenus((prev) => ({ ...prev, [key]: true }));
          }

          // Recursively check children
          findAndExpandActiveMenus(item.children, key);
        }
      });
    };

    // Auto-expand menus containing active items
    findAndExpandActiveMenus(tree);

    // Auto-select if at system root or module root
    const currentPath = location.pathname.replace(/\/$/, "").toLowerCase();
    const modulePath = `/${
      matchedModule.appProductModuleShortName ||
      matchedModule.appModuleShortName
    }`.toLowerCase();
    const isSystemRoot = currentPath === "";
    const isModuleRoot =
      currentPath === modulePath ||
      currentPath === `/${matchedModule.appModuleShortName}`.toLowerCase();

    if (tree.length === 1 && (isSystemRoot || isModuleRoot)) {
      const firstAvailablePath = findFirstPath(tree);
      if (firstAvailablePath) {
        navigate(firstAvailablePath, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, effectiveModules, effectiveMenus, navigate]);

  const moduleHomePath = useMemo(() => {
    if (!activeModule) return "/";
    return `/${
      activeModule.targetSource ||
      activeModule.appModuleShortName ||
      activeModule.appProductModuleShortName
    }`;
  }, [activeModule]);

  const handleMenuClick = () => {
    if (activeModule)
      sessionStorage.setItem("activeModuleId", activeModule.appProductModuleId);
  };

  const renderPopupMenu = (items, parentKey = "", depth = 0) => (
    <ul className="flex flex-col gap-1">
      {items.map((item, idx) => {
        const key = `${parentKey}-${item.id || idx}`;
        const hasChildren = item.children.length > 0;
        const isOpen = openMenus[key];

        return (
          <li key={key} className="rounded-md">
            {hasChildren ? (
              <button
                onClick={() => toggleMenu(key)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[12px] transition-all duration-200 ${
                  isOpen
                    ? isDarkMode
                      ? "bg-white/5 text-white"
                      : "bg-purple-50 text-purple-700"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder
                    size={14}
                    className={
                      isDarkMode ? "text-purple-300" : "text-purple-500"
                    }
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDownIcon
                  size={14}
                  className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : item.path ? (
              <Link
                to={item.path}
                onClick={() => {
                  NProgress.start();
                  handleMenuClick();
                  setActivePopupKey(null);
                  if (isMobileOpen) setIsMobileOpen(false);
                  setTimeout(() => NProgress.done(), 300);
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors duration-200 ${
                  isActive(item.path)
                    ? isDarkMode
                      ? "bg-white/5 text-white"
                      : "bg-purple-50 text-purple-700"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <File
                  size={14}
                  className={isDarkMode ? "text-purple-300" : "text-purple-500"}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            ) : (
              <div
                className={`flex items-center gap-2 px-2 py-1.5 text-[12px] ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <Folder
                  size={14}
                  className={isDarkMode ? "text-purple-300" : "text-purple-500"}
                />
                <span className="font-medium">{item.name}</span>
              </div>
            )}

            <AnimatePresence>
              {hasChildren && isOpen && (
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pl-3 border-l border-purple-500/20 ml-2 mt-1"
                >
                  {renderPopupMenu(item.children, key, depth + 1)}
                </Motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );

  const renderMenu = (items, parentKey = "") => (
    <ul className="flex flex-col gap-1">
      {items.map((item, idx) => {
        const key = `${parentKey}-${item.id || idx}`;
        const hasChildren = item.children.length > 0;

        const baseClasses = `flex rounded-md text-[13px] transition-all duration-300 relative ${
          isCollapsed
            ? "flex-col items-center gap-1 px-8 py-1.5 text-center"
            : "items-center gap-3 px-2 py-2"
        }`;

        const hoverClasses = isDarkMode
          ? "hover:bg-[#2a1b44] hover:text-purple-300"
          : "hover:bg-purple-100 hover:text-purple-700";

        const activeClasses = isDarkMode
          ? "bg-gradient-to-r from-[#8f55f2]/20 to-[#0284c7]/20 text-white font-semibold"
          : "bg-purple-200/30 text-purple-800 font-semibold";

        return (
          <li key={key} className="relative">
            {hasChildren ? (
              <button
                onClick={() => {
                  if (isCollapsed) {
                    const nextKey = activePopupKey === key ? null : key;
                    setActivePopupKey(nextKey);
                    setOpenMenus(nextKey ? { [key]: true } : {});
                  } else {
                    toggleMenu(key);
                  }
                }}
                className={`${baseClasses} ${
                  (isCollapsed ? activePopupKey === key : openMenus[key])
                    ? activeClasses
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-700"
                } ${hoverClasses} w-full justify-between`}
              >
                <div
                  className={`flex ${
                    isCollapsed
                      ? "flex-col items-center gap-1.5"
                      : "items-center gap-3"
                  }`}
                >
                  {openMenus[key] ? (
                    <FolderOpen
                      size={16}
                      className={
                        isDarkMode ? "text-purple-400" : "text-purple-500"
                      }
                    />
                  ) : (
                    <Folder
                      size={16}
                      className={
                        isDarkMode ? "text-purple-400" : "text-purple-500"
                      }
                    />
                  )}
                  {isCollapsed ? (
                    <span className="text-[10px] font-semibold leading-tight">
                      {item.name}
                    </span>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      openMenus[key] ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            ) : item.path ? (
              <Link
                to={item.path}
                onClick={() => {
                  NProgress.start();
                  handleMenuClick();
                  if (isMobileOpen) setIsMobileOpen(false);
                  setTimeout(() => NProgress.done(), 300);
                }}
                className={`${baseClasses} ${
                  isActive(item.path)
                    ? activeClasses
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-700"
                } ${hoverClasses}`}
              >
                <div
                  className={`flex ${
                    isCollapsed
                      ? "flex-col items-center gap-1.5"
                      : "items-center gap-2"
                  }`}
                >
                  <File
                    size={16}
                    className={
                      isDarkMode ? "text-purple-400" : "text-purple-500"
                    }
                  />
                  {isCollapsed ? (
                    <span className="text-[10px] font-semibold leading-tight">
                      {item.name}
                    </span>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            ) : (
              <div
                className={`${baseClasses} ${
                  isDarkMode ? "text-gray-500" : "text-gray-600"
                }`}
              >
                {isCollapsed ? (
                  <span className="text-[10px] font-semibold leading-tight">
                    {item.name}
                  </span>
                ) : (
                  item.name
                )}
              </div>
            )}

            <AnimatePresence>
              {isCollapsed && hasChildren && activePopupKey === key && (
                <Motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className={`absolute left-full top-0 ml-2 w-64 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[50] border p-3 border-purple-500/20 backdrop-blur-xl ${
                    isDarkMode
                      ? "bg-[#1a1428]/95 shadow-black/60 text-white"
                      : "bg-white/95 border-gray-200 shadow-gray-200/50 text-gray-900"
                  }`}
                >
                  <div
                    className={`relative z-10 mb-3 px-2 flex items-center justify-between border-b pb-2 ${isDarkMode ? "border-white/5" : "border-gray-100"}`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="relative z-10">
                    {renderPopupMenu(item.children, `${key}-popup`)}
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hasChildren &&
                (isExpanded || isMobileOpen) &&
                openMenus[key] && (
                  <Motion.div
                    initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: {
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                          mass: 1,
                        },
                        opacity: { duration: 0.2 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: {
                          type: "spring",
                          stiffness: 500,
                          damping: 40,
                          mass: 1,
                        },
                        opacity: { duration: 0.2 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <ul
                      className={`mt-1 space-y-1 ml-5 pl-2.5 text-[13px] border-l ${
                        isDarkMode
                          ? "border-purple-800/40"
                          : "border-purple-300/40"
                      }`}
                    >
                      {renderMenu(item.children, key)}
                    </ul>
                  </Motion.div>
                )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      ref={sidebarRef}
      className={`fixed top-0 left-0 h-screen flex flex-col mb-5 px-4 transition-all duration-300 ease-in-out ${
        isDarkMode
          ? "bg-[#121122]/95 text-gray-300 border-r border-white/5 backdrop-blur-xl"
          : "bg-white/95 text-gray-800 border-r border-gray-100 backdrop-blur-xl shadow-2xl shadow-purple-500/10"
      } ${isExpanded ? "lg:w-[270px]" : "lg:w-[90px]"}
       ${isMobileOpen ? "w-[285px] translate-x-0" : "-translate-x-full"}
       lg:flex lg:translate-x-0 z-[40]`}
    >
      <div className="py-4 sm:py-3 mb-4 sm:mb-2 mt-0.5 sm:mt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 sm:hidden ${
                isDarkMode
                  ? "bg-white/5 text-purple-400 hover:bg-white/10"
                  : "bg-purple-50 text-purple-600 hover:bg-purple-100"
              }`}
            >
              <X size={18} />
            </button>

            {activeModule && (
              <Link
                to="/"
                className={`flex items-center gap-2.5 group px-2 sm:py-1.5 rounded-lg transition-all duration-200 
                  ${isDarkMode ? "hover:bg-white/5" : "hover:bg-purple-50"}`}
              >
                {!isCollapsed && (
                  <div
                    className={`p-1.5 rounded-md ${
                      isDarkMode
                        ? "bg-purple-500/20 group-hover:bg-purple-500/30"
                        : "bg-purple-100 group-hover:bg-purple-200"
                    } transition-colors duration-200`}
                  >
                    <FolderOpen
                      size={18}
                      className={
                        isDarkMode ? "text-purple-400" : "text-purple-600"
                      }
                    />
                  </div>
                )}
                <span
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isDarkMode
                      ? "text-gray-200 group-hover:text-white"
                      : "text-gray-800 group-hover:text-purple-700"
                  } ${isCollapsed ? "flex-1 flex justify-center" : ""}`}
                >
                  {isExpanded || isMobileOpen ? (
                    activeModule.appModuleName ||
                    activeModule.appProductModuleShortName
                  ) : (
                    <div
                      className={`ml-1 w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl transition-all duration-300 border border-white/10 ${
                        isDarkMode
                          ? "bg-purple-600 text-white shadow-xl shadow-black/40"
                          : "bg-purple-600 text-white shadow-xl shadow-purple-500/30"
                      }`}
                    >
                      {(activeModule.appModuleName ||
                        activeModule.appProductModuleShortName)?.[0]?.toUpperCase()}
                    </div>
                  )}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex-1 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"} hide-scrollbar max-h-[calc(100vh-80px)]`}
      >
        <nav>
          <div>
            <h2
              className={`mb-4 text-xs uppercase flex items-center gap-1 tracking-wider ${
                !isExpanded ? "justify-center" : "justify-start"
              } ${isDarkMode ? "text-purple-400" : "text-purple-500"}`}
            >
              {isExpanded || isMobileOpen ? (
                "Menu"
              ) : (
                <Ellipsis size={18} className="opacity-60 ml-2" />
              )}
            </h2>

            {activeModule && (
              <div className="mb-1">
                <Link
                  to={moduleHomePath}
                  onClick={() => {
                    NProgress.start();
                    handleMenuClick();
                    setOpenMenus({});
                    if (isMobileOpen) setIsMobileOpen(false);
                    setTimeout(() => NProgress.done(), 300);
                  }}
                  className={`flex rounded-md text-[13px] transition-colors duration-300 ${
                    isCollapsed
                      ? "flex-col items-center gap-1.5 px-8 py-1 text-center"
                      : "items-center gap-2.5 px-2 py-2.5"
                  } ${
                    isActive(moduleHomePath)
                      ? isDarkMode
                        ? "bg-gradient-to-r from-[#8f55f2]/20 to-[#0284c7]/20 text-white font-semibold"
                        : "bg-purple-200/30 text-purple-800 font-semibold"
                      : isDarkMode
                        ? "text-gray-400 hover:bg-[#2a1b44] hover:text-purple-300"
                        : "text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                  }`}
                >
                  <LayoutDashboard
                    size={18}
                    className={
                      isDarkMode ? "text-purple-400" : "text-purple-500"
                    }
                  />
                  {isCollapsed ? (
                    <span className="text-[10px] font-semibold leading-tight">
                      Dashboard
                    </span>
                  ) : (
                    <span className="font-medium">Dashboard</span>
                  )}
                </Link>
              </div>
            )}

            {navItems.length > 0 && renderMenu(navItems)}
          </div>
        </nav>
      </div>

      {/* Hidden Scrollbar */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
