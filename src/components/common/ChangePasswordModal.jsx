import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { X, Edit, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../../ThemeProvider";
import { useGetAuth } from "../../hooks/useGetAuth";
import { handleApiResponse } from "../../utils/handleApiResponse";

import CustomInput from "../CustomInput";
import ModalActionButtons from "../ModalActionButtons";
// Imports End----

const ChangePasswordModal = ({ open, onClose }) => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken, authData } = useGetAuth();

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/User/ChangePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, "Failed to change password");
    },

    onSuccess: (result) => {
      toast.success(result?.message);
      handleClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleClose = () => {
    setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    onClose();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    const userId = authData?.data?.loginAppUserId;

    changePassword({
      userId: userId,
      oldPassword: passwords.oldPassword,
      newPassword: passwords.newPassword,
    });
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <Motion.div
          className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm ${
            isDarkMode ? "bg-black/50" : "bg-gray-900/10"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <Motion.div
            className={`relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[40%] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border px-5 sm:px-6 py-8 select-none ${
              isDarkMode
                ? "bg-[#1A162B] text-white border-purple-600/10"
                : "bg-white text-gray-800 border-gray-200"
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`flex items-center gap-2 text-lg font-semibold mb-5 ${
                isDarkMode ? "text-purple-400" : "text-purple-700"
              }`}
            >
              <Edit size={18} />
              Change Password
            </h2>

            <div className="space-y-4">
              <CustomInput
                id="oldPassword"
                label="Old Password"
                type="password"
                icon={Lock}
                value={passwords.oldPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, oldPassword: e.target.value })
                }
                required
                placeholder="Enter current password"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CustomInput
                  id="newPassword"
                  label="New Password"
                  type="password"
                  icon={Lock}
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                  placeholder="New password"
                />
                <CustomInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  placeholder="Confirm password"
                />
              </div>

              <ModalActionButtons
                onCancel={handleClose}
                onSubmit={handleSubmit}
                isDarkMode={isDarkMode}
                isSubmitting={isPending}
                submitText="Update Password"
              />
            </div>

            <button
              onClick={handleClose}
              className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-white/5 hover:bg-white/10 text-gray-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ChangePasswordModal;
