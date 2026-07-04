import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Skeleton, ConfigProvider, theme as antTheme } from "antd";
import { Globe, Building2, Shield, X, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../ThemeProvider";
import { useGetAuth } from "../../hooks/useGetAuth";
import { handleApiResponse } from "../../utils/handleApiResponse";

import ModalActionButtons from "../ModalActionButtons";

import BusinessSettingsTab from "./Settings/BusinessSettingsTab";
// Imports End-----

const SettingsPopup = ({ open, onClose }) => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("1");

  const [settings, setSettings] = useState({
    clientSettingId: 0,
    consultantPartyRoleId: 0,
    clientPartyRoleId: 0,
    chatLinkURL: "",
    isWebGoLive: false,
    footerDescription: "",
    businessName: "",
    businessNature: "",
    businessProvince: "",
    fbrTokenNo: "",
    fbrValidationTokenNo: "",
    rowVersionLong: 0,
  });

  const { data: clientSettings, isLoading } = useQuery({
    queryKey: ["getClientSetting", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/ClientSetting/GetAdmin", {
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      const result = await handleApiResponse(res, "Failed to fetch settings");
      return result?.data ?? {};
    },

    enabled: !!loginAccessToken && open,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (clientSettings && open) {
      setSettings(clientSettings);
    }
  }, [clientSettings, open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = "hidden";
      setActiveTab("1");
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/ClientSetting/SaveAdmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, "Failed to save settings");
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["getClientSetting"]);
      toast.success("Settings updated");
    },

    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => saveSettings(settings);

  const updateField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const modalContent = (
    <AnimatePresence>
      {open && (
        <ConfigProvider
          theme={{
            algorithm: isDarkMode
              ? antTheme.darkAlgorithm
              : antTheme.defaultAlgorithm,
          }}
        >
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm p-0 sm:p-4 md:p-6 ${
              isDarkMode ? "bg-black/60" : "bg-gray-900/40"
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                mass: 0.8,
              }}
              className={`settings-popup-modal relative w-full sm:max-w-5xl h-full sm:h-[85vh] overflow-hidden sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row ${
                isDarkMode
                  ? "bg-[#1B172D] text-white"
                  : "bg-white text-gray-800"
              }`}
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <div className="flex flex-col sm:flex-row h-full w-full overflow-hidden">
                {/* ── MOBILE: Top header + horizontal tab bar ── */}
                <div
                  className={`sm:hidden flex items-center justify-between px-4 pt-4 pb-2 border-b ${
                    isDarkMode ? "border-white/5" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-(--secondary-color)/10 flex items-center justify-center">
                      <Settings
                        size={16}
                        className="text-(--secondary-color) animate-[spin_10s_linear_infinite]"
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                    >
                      Settings
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-xl transition-all ${
                      isDarkMode
                        ? "hover:bg-white/5 text-[#a9a0c1] hover:text-white"
                        : "hover:bg-gray-200 text-gray-500"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ── MOBILE: Horizontal tab strip ── */}
                <div
                  className={`sm:hidden flex gap-1 px-4 py-2 border-b ${
                    isDarkMode
                      ? "border-white/5 bg-black/20"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  {[{ id: "1", label: "Business", icon: Building2 }].map(
                    (tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? isDarkMode
                                ? "bg-purple-600 text-white"
                                : "bg-white text-(--secondary-color) shadow-sm border border-gray-100 font-bold"
                              : isDarkMode
                                ? "text-[#a9a0c1] hover:bg-white/5"
                                : "text-gray-500 hover:bg-white"
                          }`}
                        >
                          <Icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* ── DESKTOP: Left Sidebar (hidden on mobile) ── */}
                <div
                  className={`hidden sm:flex w-60 p-4 flex-col gap-2 border-r transition-all ${
                    isDarkMode
                      ? "border-white/5 bg-black/20"
                      : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  {/* Header in Sidebar */}
                  <div className="flex items-center justify-between mb-8">
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-xl transition-all ${
                        isDarkMode
                          ? "hover:bg-white/5 text-[#a9a0c1] hover:text-white"
                          : "hover:bg-gray-200 text-gray-500"
                      }`}
                    >
                      <X size={20} />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-(--secondary-color)/10 flex items-center justify-center">
                      <Settings
                        size={18}
                        className="shrink-0 text-(--secondary-color) animate-[spin_10s_linear_infinite]"
                      />
                    </div>
                  </div>

                  {[{ id: "1", label: "Business", icon: Building2 }].map(
                    (tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                            isActive
                              ? isDarkMode
                                ? "bg-purple-600 text-white shadow-xl shadow-purple-600/20"
                                : "bg-white text-(--secondary-color) shadow-sm border border-gray-100 font-bold"
                              : isDarkMode
                                ? "text-[#a9a0c1] hover:bg-white/5 hover:text-[#e0d7ff]"
                                : "text-gray-500 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          <Icon
                            size={18}
                            className={`transition-colors duration-300 ${isActive ? "text-current" : "opacity-50 group-hover:opacity-100"}`}
                          />
                          <span className="text-sm tracking-tight">
                            {tab.label}
                          </span>
                          {isActive && (
                            <Motion.div
                              layoutId="activeTabIndicator"
                              className="absolute -left-4 w-1 h-6 bg-(--secondary-color) rounded-r-full"
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                            />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 sm:px-8 pt-4 sm:pt-5 pb-2 max-w-4xl">
                      {isLoading ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                          <div
                            className={`p-6 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-100"}`}
                          >
                            <div className="flex items-center gap-4">
                              <Skeleton.Avatar
                                active
                                size="small"
                                shape="circle"
                              />

                              <div className="space-y-2 flex flex-col">
                                <Skeleton.Button
                                  active
                                  style={{ width: 140, height: 20 }}
                                />

                                <Skeleton.Button
                                  active
                                  style={{ width: 200, height: 14 }}
                                />
                              </div>
                            </div>

                            <Skeleton.Button
                              active
                              className="w-12! h-6! rounded-full!"
                            />
                          </div>
                          <div className="space-y-4">
                            <Skeleton.Button
                              active
                              style={{ width: 150, height: 16 }}
                            />
                            <div
                              className={`rounded-2xl border p-6 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-100"}`}
                            >
                              <Skeleton
                                active
                                paragraph={{ rows: 6 }}
                                title={false}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Motion.div
                          key={activeTab}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="space-y-6"
                        >
                          {activeTab === "1" && (
                            <BusinessSettingsTab
                              settings={settings}
                              updateField={updateField}
                            />
                          )}
                        </Motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className={`mt-auto flex items-center justify-end gap-3 px-8 py-4 ${isDarkMode ? " bg-transparent" : "bg-transparent"}`}
                  >
                    <ModalActionButtons
                      onCancel={onClose}
                      onSubmit={handleSave}
                      isDarkMode={isDarkMode}
                      isSubmitting={isSaving}
                      submitText="Save Settings"
                    />
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        </ConfigProvider>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default SettingsPopup;
