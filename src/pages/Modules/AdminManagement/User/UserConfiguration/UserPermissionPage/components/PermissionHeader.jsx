import { Undo, ShieldCheck } from "lucide-react";
import LoadingSpinner from "../../../../../../../components/common/LoadingSpinner";

const PermissionHeader = ({
  isDarkMode,
  selectedUserRow,
  isSaving,
  isFetchingPermissions,
  onBack,
  onSave,
  hasChanges,
}) => {
  return (
    <div
      className={`sticky top-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-2 pt-1 px-1 border-b border-dashed border-gray-700/50 backdrop-blur-md transition-all duration-300 ${
        isDarkMode ? "bg-[#0d0c1a]/90" : "bg-white/90"
      }`}
    >
      <div>
        <h2
          className={`text-lg font-bold flex items-center gap-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <ShieldCheck className="text-purple-500" />
          Manage Permissions
        </h2>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium`}
          >
            {selectedUserRow?.roleName}
          </span>
          <span className={`text-xs text-gray-500`}>at</span>
          <span className={`text-xs font-semibold text-gray-400`}>
            {selectedUserRow?.locationName}
          </span>
          <span className={`mx-2 text-gray-700`}>|</span>
          <span className={`text-sm font-semibold text-purple-500`}>
            {selectedUserRow?.appUserName}
          </span>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onBack}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isDarkMode
              ? "border-gray-700 text-gray-300 hover:bg-gray-800"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Undo size={14} />
            Back to List
          </div>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving || isFetchingPermissions || !hasChanges}
          className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-w-[180px] ${
            !hasChanges || isSaving || isFetchingPermissions
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30 shadow-none"
              : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 active:scale-95 shadow-lg"
          }`}
        >
          {isSaving ? (
            <>
              <LoadingSpinner content="" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Update Permissions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PermissionHeader;
