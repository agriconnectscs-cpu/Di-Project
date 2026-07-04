import NProgress from "nprogress";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Menu, Settings, MessageCircle, Search, X } from "lucide-react";

import { useTheme } from "../ThemeProvider";
import { useSidebar } from "../context/SidebarContext";

import { useGetAuth } from "../hooks/useGetAuth";

import MenuSearch from "./MenuSearch";
import ThemeToggle from "../components/common/ThemeToggle";
import SettingsPopup from "../components/common/SettingsPopup";
import ModuleSwitcher from "../components/common/ModuleSwitcher";
import ProfileDropdown from "../components/common/ProfileDropdown";
import FullscreenToggle from "../components/common/FullscreenToggle";
import NotificationDropdown from "../components/common/NotificationDropdown";
// Imports End-----

const Header = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { modules } = useGetAuth(location);

  const currentPathSegment = location.pathname.split("/")[1]?.toUpperCase();
  const activeModule = modules.find(
    (m) =>
      m.appModuleShortName?.toUpperCase() === currentPathSegment ||
      m.appProductModuleShortName?.toUpperCase() === currentPathSegment,
  );
  const moduleTitle = activeModule?.appModuleName || "";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const { isMobile, toggleSidebar, toggleMobileSidebar } = useSidebar();

  // Close all dropdowns on escape or click anywhere
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".profile-dropdown-container")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const handleToggle = () => {
    setIsProfileOpen(false);
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle scroll to change background
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target.scrollTop || window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? isDarkMode
            ? "bg-[#121122]/80 backdrop-blur-md border-b border-white/5 shadow-2xl shadow-black/20"
            : "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100"
          : isMobile
            ? isDarkMode
              ? "bg-[#121122]/40 backdrop-blur-sm border-b border-white/5"
              : "bg-white/40 backdrop-blur-sm border-b border-gray-100"
            : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center sm:gap-3">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer ${
              isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
            }`}
          >
            <Menu
              size={22}
              className="text-purple-400 transition-transform duration-200"
            />
          </button>

          {/* Module Switcher for Mobile*/}
          {moduleTitle && (
            <div className="lg:hidden ml-1 flex items-center">
              <ModuleSwitcher
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                trigger={
                  <div
                    className={`flex flex-col min-w-0 px-2 py-1 text-left transition-colors duration-300 ${
                      isDarkMode ? "bg-purple-500/5" : "bg-purple-50/50 "
                    }`}
                  >
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${
                        isDarkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    >
                      Module
                    </span>
                    <h2
                      className={`text-[11px] font-bold truncate max-w-25 leading-tight ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {moduleTitle}
                    </h2>
                  </div>
                }
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-0 sm:gap-1.5 flex-1 min-w-0 justify-end">
          <MenuSearch className="max-w-xl mx-2 hidden md:block" />

          {/* Mobile Search Trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className={`md:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? "text-gray-400 hover:bg-white/10 hover:text-purple-400"
                : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
            }`}
          >
            <Search size={18} />
          </button>

          {/* Testing Environment Badge */}
          <div className="hidden lg:flex items-center gap-3">
            <span
              className={`h-10 flex items-center gap-2.5 px-4 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 shadow-inner ${
                isDarkMode
                  ? "bg-orange-500/5 border-orange-500/20 text-orange-400/90 shadow-orange-500/5"
                  : "bg-orange-50 border-orange-100 text-orange-600"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]"></span>
              </span>
              Testing Env
            </span>

            {/* Vertical Divider */}
            <div
              className={`hidden xl:block w-px h-8 ml-2 ${
                isDarkMode
                  ? "bg-white/5 shadow-[0_0_1px_rgba(255,255,255,0.1)]"
                  : "bg-gray-200"
              }`}
            />
          </div>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <FullscreenToggle
              isDarkMode={isDarkMode}
              onToggleStart={() => setIsProfileOpen(false)}
            />
          </div>

          {/* Settings */}
          <button
            onClick={() => {
              setIsProfileOpen(false);
              setIsSettingsOpen(true);
            }}
            aria-label="Open Settings"
            title="Open Settings"
            className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
              isSettingsOpen
                ? "bg-purple-500/20 text-purple-400"
                : isDarkMode
                  ? "text-gray-400 hover:bg-white/10 hover:text-purple-400 "
                  : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
            }`}
          >
            <Settings size={18} />
          </button>

          {/* Module Switcher */}
          <div className="hidden sm:block">
            <ModuleSwitcher
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
            />
          </div>

          <div className="ml-2 sm:ml-0">
            <ProfileDropdown
              isDarkMode={isDarkMode}
              isOpen={isProfileOpen}
              onToggle={() => setIsProfileOpen(!isProfileOpen)}
              onClose={() => setIsProfileOpen(false)}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          </div>
        </div>
      </div>

      <SettingsPopup
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm lg:hidden"
          >
            <Motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`w-full p-4 border-b ${
                isDarkMode
                  ? "bg-[#141025] border-white/10"
                  : "bg-white border-gray-100 shadow-xl"
              }`}
            >
              <div className="flex items-center gap-3">
                <MenuSearch
                  className="flex-1"
                  autoFocus
                  onSelect={() => setIsMobileSearchOpen(false)}
                  // eslint-disable-next-line no-unused-vars
                  onQueryChange={(q) => {
                    // if user selects something it usually navigates, so we close
                  }}
                />
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className={`p-2 rounded-full ${
                    isDarkMode
                      ? "bg-white/5 text-gray-400"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </Motion.div>
            <div
              className="flex-1 h-full"
              onClick={() => setIsMobileSearchOpen(false)}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
