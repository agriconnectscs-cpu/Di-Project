import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../ThemeProvider";
import LoadingSpinner from "./common/LoadingSpinner";
// Imports End-----

const CustomDeleteModal = ({ open, onConfirm, onCancel, loading, title }) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === "Escape") {
        onCancel();
      }

      if (e.key === "Enter" && !loading) {
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onConfirm, loading]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-sm ${
            isDarkMode ? "bg-black/50" : "bg-gray/10"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className={`w-[90%] max-w-md rounded-xl shadow-2xl p-6 transition-colors border ${
              isDarkMode
                ? "bg-[#1a1129] text-white border-purple-600/10"
                : "bg-white text-gray-900 border-gray-300"
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2
              className={`flex items-center gap-2 text-xl font-semibold mb-2 ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-purple-500" />
              Confirm Deletion
            </h2>

            <p
              className={`mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Are you sure you want to delete
              {title ? (
                <span className="font-bold text-red-500 mx-1  decoration-red-400">
                  "{title}"
                </span>
              ) : (
                " this record"
              )}
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={onCancel}
                className={`px-5 py-1 text-sm rounded-full border transition cursor-pointer ${
                  isDarkMode
                    ? "border-transparent text-gray-300 hover:text-white hover:border-gray-600"
                    : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-1 text-sm rounded-full text-white transition cursor-pointer ${
                  loading
                    ? "bg-purple-800 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {loading ? (
                  <LoadingSpinner content="Deleting..." />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomDeleteModal;
