import { useEffect } from "react";
import { useTheme } from "../ThemeProvider";
import { motion as Motion, AnimatePresence } from "framer-motion";

import Lottie from "lottie-react";
import successAnimation from "../assets/lottie/successfulCheck.json";
// Imports End

const SuccessModal = ({
  open = false,
  message = "Deleted successfully!",
  onClose,
  duration = 1500,
}) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            background: isDarkMode
              ? "rgba(0,0,0,0.6)"
              : "rgba(255,255,255,0.4)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className={`w-[90%] max-w-lg rounded-xl shadow-xl py-6 flex flex-col items-center justify-center`}
            style={{
              background: isDarkMode ? "#1c1330" : "#fafafa",
              border: isDarkMode
                ? "1px solid #4B2A66"
                : "1px solid rgba(0, 0, 0, 0.15)",
              boxShadow: isDarkMode
                ? "0 0 12px rgba(127, 63, 242, 0.22)"
                : "0 2px 6px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            {/* Lottie Success Animation */}
            <Motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-32 h-32"
            >
              <Lottie animationData={successAnimation} loop={false} />
            </Motion.div>

            <h2
              className={`text-3xl font-semibold -mt-5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Success
            </h2>

            {/* Message */}
            <p
              className={`text-center text-md ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {message}
            </p>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`mt-5 px-10 py-1.5 cursor-pointer rounded-full transition-all font-medium ${
                isDarkMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              }`}
            >
              Close
            </button>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
