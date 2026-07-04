import React from "react";
import { CheckCircle2, ShieldOff } from "lucide-react";
import SearchBar from "../../../../../../../components/SearchBar";

const TreeHeader = ({
  isDarkMode,
  activeModule,
  allModules,
  treeDataLength,
  expandedKeysLength,
  onExpandAll,
  onSelectAll,
  treeSearch,
  onTreeSearchChange,
}) => {
  const activeModuleName = allModules.find(
    (m) => m.appProductModuleId === activeModule,
  )?.appModuleName;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3
          className={`text-md font-bold flex items-center gap-2 ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {activeModuleName} Menus
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              isDarkMode
                ? "bg-white/5 text-gray-500"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {treeDataLength} Menus
          </span>
        </h3>

        <div className="flex items-center gap-2">
          {/* Expand All */}
          <button
            onClick={() => onExpandAll(true)}
            className={`text-[10px] font-bold uppercase tracking-tight px-3 py-1.5 rounded-md border transition-all ${
              expandedKeysLength > 0 && expandedKeysLength === treeDataLength
                ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20"
                : isDarkMode
                  ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Expand All
          </button>

          {/* Collapse All */}
          <button
            onClick={() => onExpandAll(false)}
            className={`text-[10px] font-bold uppercase tracking-tight px-3 py-1.5 rounded-md border transition-all ${
              expandedKeysLength === 0
                ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20"
                : isDarkMode
                  ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Allow All */}
          <button
            onClick={() => onSelectAll(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
              isDarkMode
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300"
            }`}
          >
            <CheckCircle2
              size={14}
              className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}
            />
            Allow All
          </button>

          {/* Deny All */}
          <button
            onClick={() => onSelectAll(false)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
              isDarkMode
                ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
            }`}
          >
            <ShieldOff
              size={14}
              className={isDarkMode ? "text-red-400" : "text-red-600"}
            />
            Deny All
          </button>
        </div>

        <div>
          <SearchBar
            className="w-full"
            placeholder="Search menus or actions..."
            value={treeSearch}
            onChange={onTreeSearchChange}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </>
  );
};

export default TreeHeader;
