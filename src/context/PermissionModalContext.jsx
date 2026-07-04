import { createContext, useContext, useState, useCallback } from "react";
import PermissionDeniedModal from "../permissions/components/PermissionDeniedModal";

const PermissionModalContext = createContext(null);

export const PermissionModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPermissionModal = useCallback(() => setIsOpen(true), []);
  const closePermissionModal = useCallback(() => setIsOpen(false), []);

  return (
    <PermissionModalContext.Provider
      value={{ openPermissionModal, closePermissionModal }}
    >
      {children}
      <PermissionDeniedModal open={isOpen} onClose={closePermissionModal} />
    </PermissionModalContext.Provider>
  );
};

export const usePermissionModal = () => {
  const context = useContext(PermissionModalContext);
  if (!context) {
    throw new Error(
      "usePermissionModal must be used within PermissionModalProvider",
    );
  }
  return context;
};
