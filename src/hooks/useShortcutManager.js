import { useEffect, useRef } from "react";

/**
 * 1. Alt+N: Opens the modal + provides Focus Ref (formerly useModalShortcut)
 * 2. Alt+Enter: Submits/Saves the modal (formerly useEnterKeySubmit)
 * 3. Escape: Closes the modal (formerly useCloseOnEscape)
 * 4. Scroll Lock: Disables background scroll when open (formerly useScrollLock)
 * 5. Alt+E: Edit Last Added Record (formerly useEditLastAdded)
 * 6. Alt+Delete: Delete Last Added Record (formerly useDeleteLastAdded)

 * @param {Object} params
 * @param {boolean} params.isOpen 
 * @param {Function} params.onOpen 
 * @param {Function} params.onClose 
 * @param {Function} params.onSubmit 
 * @param {Function} params.onEditLastAdded
 * @param {Function} params.onDeleteLastAdded
 * @param {boolean} params.disableScrolling
 */

export const useShortcutManager = ({
  isOpen,
  onOpen,
  onClose,
  onSubmit,
  onEditLastAdded,
  onDeleteLastAdded,
  disableScrolling = false,
}) => {
  const firstInputRef = useRef(null);
  const shouldLock = isOpen || disableScrolling;

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // --- Shortcut: Alt+N (Opening behavior) ---
      const isAltN =
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.key.toLowerCase() === "n" || e.code === "KeyN");

      if (isAltN) {
        const isTargetInput = ["INPUT", "TEXTAREA"].includes(
          document.activeElement.tagName,
        );
        if (!isTargetInput) {
          e.preventDefault();
          e.stopPropagation();
          onOpen?.();
        }
      }

      // --- Shortcut: Alt+Enter (Saving behavior - only when open) ---
      if (isOpen && e.key === "Enter" && (e.altKey || e.metaKey)) {
        e.preventDefault();
        onSubmit?.();
      }

      // --- Shortcut: Escape (Closing behavior - only when open) ---
      if (isOpen && e.key === "Escape") {
        const isDropdownOpen = document.querySelector(
          ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
        );
        if (isDropdownOpen) return;

        onClose?.();
      }

      // --- Shortcut: Alt+E (Edit Last Added Record - only when NOT open) ---
      if (!isOpen && e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        onEditLastAdded?.();
      }

      // --- Shortcut: Alt+Delete (Delete Last Added Record - only when NOT open) ---
      if (!isOpen && e.altKey && e.key === "Delete") {
        e.preventDefault();
        onDeleteLastAdded?.();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onOpen, onClose, onSubmit, onEditLastAdded, onDeleteLastAdded]);

  // Handle Focus management on first Input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Body Scroll Locking
  useEffect(() => {
    if (shouldLock) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [shouldLock]);

  return firstInputRef;
};
