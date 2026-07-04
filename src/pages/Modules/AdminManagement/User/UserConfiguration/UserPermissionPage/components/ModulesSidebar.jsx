import { motion as Motion } from "framer-motion";

const ModulesSidebar = ({
  allModules,
  activeModule,
  isDarkMode,
  onModuleChange,
}) => {
  return (
    <div
      className={`w-full lg:w-72 shrink-0 rounded-xl border p-3 min-h-full ${
        isDarkMode ? "bg-white/5 border-gray-800" : "bg-gray-50 border-gray-200"
      }`}
    >
      <h3
        className={`text-md font-semibold mb-2 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Modules
      </h3>

      <div className="space-y-1.5">
        {allModules.map((module) => (
          <Motion.div
            key={module.appProductModuleId}
            whileTap={{ scale: 0.99 }}
            onClick={() => onModuleChange(module.appProductModuleId)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border select-none ${
              activeModule === module.appProductModuleId
                ? isDarkMode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20 border-purple-500/50"
                  : "bg-purple-600 text-white shadow-lg shadow-purple-200 border-purple-500"
                : isDarkMode
                  ? "hover:bg-white/5 text-gray-400 border-transparent"
                  : "hover:bg-white text-gray-600 border-transparent"
            }`}
          >
            {module.moduleImageURL ? (
              <img
                src={module.moduleImageURL}
                className="w-8 h-8 rounded-full object-cover border border-white/10 shadow-sm"
                alt={module.appModuleName}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 ${
                activeModule === module.appProductModuleId
                  ? "bg-white/20"
                  : isDarkMode
                    ? "bg-white/10"
                    : "bg-gray-200"
              } ${module.moduleImageURL ? "hidden" : "block"}`}
            />

            <span
              className={`text-sm font-medium truncate ${
                activeModule === module.appProductModuleId
                  ? "text-white"
                  : isDarkMode
                    ? "text-gray-200"
                    : "text-gray-800"
              }`}
            >
              {module.appModuleName}
            </span>
          </Motion.div>
        ))}
      </div>
    </div>
  );
};

export default ModulesSidebar;
