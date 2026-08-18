import { Spin } from "antd";
import { useTheme } from "../ThemeProvider";
import { Package, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout } from "../store/authSlice";

import MenuSearch from "../layout/MenuSearch";
import ThemeToggle from "../components/common/ThemeToggle";
// Imports End----

const ModulesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const [navigatingId, setNavigatingId] = useState(null);

  const userData = useSelector(selectUser);

  const modules = useMemo(() => {
    return [...(userData?.data?.loginUserModules || [])].sort(
      (a, b) => (a.appModuleSeqNo || 0) - (b.appModuleSeqNo || 0),
    );
  }, [userData]);

  const loginClientName = userData?.data?.loginClientName || "User";

  const appProductName =
    userData?.data?.loginAppClientProduct?.appProductName || "";

  useEffect(() => {
    if (modules.length === 1) {
      // Get the single module's menus
      const singleModule = modules[0];
      const moduleMenus =
        userData?.data?.loginUserMenus?.filter(
          (menu) =>
            Number(menu.appProductModuleId) ===
            Number(singleModule.appProductModuleId),
        ) || [];

      // Find the first menu with a target URL
      const findFirstMenuPath = (menus) => {
        const parents = menus.filter((m) => !m.parentAppMenuId);
        for (const parent of parents) {
          if (parent.appMenuTargetURL) {
            return parent.appMenuTargetURL;
          }
          // Check children
          const children = menus.filter(
            (m) => m.parentAppMenuId === parent.appProductMenuId,
          );
          for (const child of children) {
            if (child.appMenuTargetURL) {
              return child.appMenuTargetURL;
            }
          }
        }
        return null;
      };

      const parents = moduleMenus.filter((m) => !m.parentAppMenuId);
      const firstMenuPath = findFirstMenuPath(moduleMenus);

      // Navigate to the first menu ONLY if there's exactly one top-level menu
      // Otherwise, just go to the module root
      const targetPath =
        parents.length === 1 && firstMenuPath
          ? firstMenuPath
          : `/${singleModule.targetSource || singleModule.appModuleShortName}`;

      navigate(targetPath, {
        replace: true,
      });
    }
  }, [modules, navigate, userData]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/UserValidate/login");
  };

  if (modules.length === 1 && navigatingId === null) return null;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200
      ${
        isDarkMode
          ? "bg-[#0e0c1c] text-white border-[#2a2040]"
          : "bg-[#f4f7fe] text-gray-900 border-gray-100"
      }`}
    >
      {/* === Main Content === */}
      <main className="flex-1 py-4 sm:py-6 px-3 sm:px-[5vw] md:px-[2vw] lg:px-[8vw] transition-colors duration-200">
        {/* Welcome Card */}
        <div
          className={`max-w-6xl mx-auto mb-8 rounded-3xl p-6 sm:p-8 text-center transition-colors duration-200 relative z-50
          ${
            isDarkMode
              ? "bg-gradient-to-br from-[#1b1633] via-[#211f3e] to-[#271c46] border border-[#322a5c] shadow-purple-900/30"
              : "bg-white border border-purple-100/30 shadow-[0_15px_45px_rgba(143,85,242,0.08)]"
          }`}
        >
          <div className="flex flex-row items-center justify-between mb-8 sm:absolute sm:top-5 sm:right-6 sm:mb-0 sm:justify-end gap-3 w-full sm:w-auto">
            <ThemeToggle />

            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/10 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm transition-all whitespace-nowrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
              </span>
              Production Env
            </span>

            <button
              title="Logout"
              onClick={handleLogout}
              className={`p-2 rounded-lg cursor-pointer group transition-colors duration-200
              ${
                isDarkMode
                  ? "hover:bg-purple-600/20 border border-transparent"
                  : "hover:bg-purple-100"
              }`}
            >
              <Power
                size={22}
                className={`transition-colors duration-200 ${
                  isDarkMode
                    ? "text-purple-500 group-hover:text-purple-400"
                    : "text-purple-500 group-hover:text-purple-600"
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 mb-2 mt-4">
            <h2
              className={`text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${
                isDarkMode
                  ? "from-purple-400 to-blue-400"
                  : "from-purple-700 via-purple-600 to-blue-600"
              }`}
            >
              Welcome back
              <br />
              {loginClientName ? ` ${loginClientName}` : ""}!
            </h2>
          </div>

          <div className="flex flex-col items-center gap-3 mb-6">
            {appProductName && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
                  isDarkMode
                    ? "bg-purple-500/5 border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                    : "bg-purple-50 border-purple-200 text-purple-600 shadow-sm"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isDarkMode ? "bg-purple-400" : "bg-purple-500"
                  }`}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {appProductName}
                </span>
              </div>
            )}

            <p
              className={`text-sm md:text-base max-w-lg transition-colors duration-200 ${
                isDarkMode ? "text-gray-400/90" : "text-gray-600"
              }`}
            >
              Explore your dashboard and access your modules easily.
            </p>
          </div>

          <div className="mt-2 relative max-w-lg mx-auto z-20">
            <MenuSearch
              className="!block"
              limit={4}
              inputClassName={
                isDarkMode
                  ? "!bg-[#1b1838] !border-[#8b5cf6] !text-white placeholder:text-gray-500 focus:!border-purple-400 focus:!ring-purple-500/20 shadow-xl shadow-purple-500/5"
                  : "!bg-white !border-purple-300 !text-gray-900 placeholder:text-gray-400 focus:!border-purple-500 focus:!ring-4 focus:!ring-purple-500/10 shadow-sm transition-all"
              }
            />
          </div>
        </div>

        {/* === Modules Grid === */}
        {modules.length > 0 ? (
          <div
            className={`grid gap-2 sm:gap-6 lg:gap-3 max-w-6xl mx-auto ${
              modules.length === 1
                ? "grid-cols-1"
                : modules.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : modules.length === 3
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
            }`}
          >
            {modules.map((module) => (
              <div
                key={module.appProductModuleId}
                onClick={() => {
                  setNavigatingId(module.appProductModuleId);
                  setTimeout(() => {
                    navigate(`/${module.targetSource}`);
                  }, 50);
                }}
                className={`group relative rounded-2xl overflow-hidden bg-gradient-to-br transition-all duration-300 h-full block cursor-pointer
                  ${
                    isDarkMode
                      ? "from-purple-700/40 via-purple-600/40 to-blue-500/40 hover:from-purple-500/50 hover:to-blue-400/50"
                      : "from-purple-100/50 via-white to-blue-50/50 hover:from-purple-100 hover:to-blue-100 shadow-sm hover:shadow-purple-500/10"
                  }`}
              >
                <div
                  className={`rounded-2xl h-full flex flex-col items-center justify-center text-center p-6 sm:p-7 transition-colors transform duration-300
                    ${
                      isDarkMode
                        ? "bg-[#141127] hover:bg-[#1b1838] border border-[#2b1b40]"
                        : "bg-white hover:bg-white border border-gray-100 hover:border-purple-300"
                    }`}
                >
                  <div
                    className={`relative w-16 h-16 mb-3 rounded-full flex items-center justify-center shadow-inner transition-colors duration-200
                      ${
                        isDarkMode
                          ? "bg-gradient-to-br from-purple-700/20 to-blue-600/20 shadow-black/30"
                          : "bg-gradient-to-br from-purple-100 to-blue-100 shadow-gray-300/40"
                      }`}
                  >
                    {/* Centered Image Loader */}
                    <AnimatePresence>
                      {navigatingId === module.appProductModuleId && (
                        <Motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-full"
                        >
                          <Spin size="small" />
                        </Motion.div>
                      )}
                    </AnimatePresence>

                    {module.moduleImageURL ? (
                      <img
                        src={module.moduleImageURL}
                        alt={module.appModuleName}
                        className="w-16 h-16 rounded-full"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <Package
                        className={`w-7 h-7 ${
                          isDarkMode ? "text-purple-300" : "text-purple-500"
                        } transition-colors duration-200`}
                      />
                    )}
                  </div>

                  <h3
                    className={`text-sm font-semibold transition-colors duration-200 
                      ${
                        isDarkMode
                          ? "text-gray-200 group-hover:text-white"
                          : "text-gray-700 group-hover:text-purple-600"
                      }`}
                  >
                    {module.appModuleName}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            className={`text-center mt-10 transition-colors duration-200 ${
              isDarkMode ? "text-gray-500" : "text-gray-600"
            }`}
          >
            No modules available.
          </p>
        )}
      </main>
    </div>
  );
};

export default ModulesPage;
