import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  UserCircle,
  LogOut,
  ChevronDown,
  Lock,
  Settings,
  Sun,
  Moon,
  Keyboard,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout } from "../../store/authSlice";

import { useTheme } from "../../ThemeProvider";

import ChangePasswordModal from "./ChangePasswordModal";
// Imports End----

const ProfileDropdown = ({
  isDarkMode,
  isOpen,
  onToggle,
  onClose,
  onSettingsClick,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toggleTheme } = useTheme();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const authData = useSelector(selectUser);
  const data = authData?.data || null;
  const userInfo = {
    loginImageUrl: data?.loginImageUrl,
    loginName: data?.loginName,
    loginClientName: data?.loginClientName,
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/UserValidate/login");
  };

  return (
    <div className="relative profile-dropdown-container">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2.5 p-1 pr-3.5 rounded-full border transition-all duration-300 h-10 shadow-sm ${
          isOpen
            ? "bg-purple-500/10 border-purple-500/40 ring-4 ring-purple-500/5 shadow-md"
            : isDarkMode
              ? "bg-[#1a1428] border-white/10 hover:border-purple-500/30 hover:bg-white/10"
              : "bg-white border-gray-200 hover:border-purple-200 hover:bg-gray-50"
        }`}
      >
        <div
          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm transition-all duration-300 overflow-hidden ${
            !userInfo.loginImageUrl
              ? isDarkMode
                ? "bg-gradient-to-br from-purple-600 to-indigo-700"
                : "bg-gradient-to-br from-purple-500 to-indigo-600"
              : "ring-2 ring-purple-500/20"
          }`}
        >
          {userInfo.loginImageUrl ? (
            <img
              src={userInfo.loginImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            userInfo.loginName?.[0]?.toUpperCase() ||
            userInfo.loginClientName?.[0]?.toUpperCase() || (
              <UserCircle size={16} />
            )
          )}
        </div>

        <div className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span
            className={`text-xs font-bold tracking-tight ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {userInfo.loginName || "User"}
          </span>
          <span
            className={`text-[9px] font-semibold opacity-60 uppercase tracking-wide truncate max-w-[100px] ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {userInfo.loginClientName || "Account"}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`ml-1 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-purple-500" : "text-gray-400"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <Motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 border overflow-hidden ${
                isDarkMode
                  ? "bg-[#1a1428] border-white/10 shadow-black/50"
                  : "bg-white border-gray-200 shadow-gray-200/50"
              }`}
            >
              {/* Header  */}
              <div
                className={`px-4 py-4 border-b flex items-center gap-3 ${
                  isDarkMode
                    ? "border-white/5 bg-white/5"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-all duration-300 overflow-hidden shrink-0 ${
                    !userInfo.loginImageUrl
                      ? isDarkMode
                        ? "bg-gradient-to-br from-purple-600 to-indigo-700"
                        : "bg-gradient-to-br from-purple-500 to-indigo-600"
                      : "ring-2 ring-purple-500/20"
                  }`}
                >
                  {userInfo.loginImageUrl ? (
                    <img
                      src={userInfo.loginImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="text-xs font-bold">${
                          userInfo.loginName?.[0]?.toUpperCase() || "U"
                        }</div>`;
                      }}
                    />
                  ) : (
                    <span className="text-xs">
                      {userInfo.loginName?.[0]?.toUpperCase() ||
                        userInfo.loginClientName?.[0]?.toUpperCase() || (
                          <UserCircle size={18} />
                        )}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-bold text-sm truncate leading-tight ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userInfo.loginName || "User"}
                  </p>
                  <p
                    className={`text-[10px] font-semibold opacity-60 uppercase tracking-wider truncate mt-0.5 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {userInfo.loginClientName || "Account"}
                  </p>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    onClose();
                    setIsChangePasswordOpen(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Lock size={18} className="text-purple-500" />
                  Change Password
                </button>

                {/* Theme Toggle */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 sm:hidden ${
                    isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      {isDarkMode ? (
                        <Moon size={18} className="text-purple-400" />
                      ) : (
                        <Sun size={18} className="text-purple-600" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Dark Mode
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                    }}
                    className={`relative w-10 h-5.5 rounded-full transition-all duration-300 outline-none ${
                      isDarkMode
                        ? "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                        : "bg-gray-200"
                    }`}
                  >
                    <Motion.div
                      animate={{ x: isDarkMode ? 18 : 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-1 w-3.5 h-3.5 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden"
                    />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    navigate("/Shortcuts");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Keyboard size={18} className="text-purple-500" />
                  Keyboard Shortcuts
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onSettingsClick();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer sm:hidden ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings size={18} className="text-purple-500" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                    isDarkMode
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      <ChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default ProfileDropdown;
