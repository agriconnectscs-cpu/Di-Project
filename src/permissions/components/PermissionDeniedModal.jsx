import { useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import Lottie from "lottie-react";
import failedAnimation from "../../assets/lottie/Failed.json";

import { useTheme } from "../../ThemeProvider";
// Imports End-------

const PermissionDeniedModal = ({ open = false, onClose }) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const container = document.getElementById("main-scroll-container");

    if (container) container.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (container) container.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-sm"
          style={{
            background: isDarkMode
              ? "rgba(0,0,0,0.65)"
              : "rgba(255,255,255,0.4)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <Motion.div
            className="w-[90%] max-w-lg rounded-xl shadow-xl py-6 flex flex-col items-center justify-center px-4"
            style={{
              background: isDarkMode ? "#1A162B" : "#ffffff",
              border: isDarkMode
                ? "1px solid rgba(139, 92, 246, 0.2)"
                : "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 12px rgba(139, 92, 246, 0.15)"
                : "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="w-28 h-28"
            >
              <Lottie animationData={failedAnimation} loop={false} />
            </Motion.div>

            <h2
              className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Permission denied
            </h2>

            <p
              className={`text-center text-sm max-w-xs mb-6 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              You don't have the required permissions to perform this action.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-2 cursor-pointer rounded-full transition-all font-medium focus:outline-none border-none"
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
                  : "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
                color: "#ffffff",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.filter = "brightness(0.9)";
                e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Dismiss
            </button>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default PermissionDeniedModal;
