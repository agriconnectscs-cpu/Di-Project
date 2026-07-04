import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Tag,
  Settings,
  MapPin,
  MapPinned,
  RefreshCcw,
} from "lucide-react";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";

import BuyerPricingTab from "./Tabs/BuyerPricingTab";
import BuyerProductsTab from "./Tabs/BuyerProductsTab";
// Imports End---

const BuyerSettingsModal = ({ isOpen, onClose, party, isDarkMode }) => {
  const { loginAccessToken } = useGetAuth();
  const [activeTab, setActiveTab] = useState("product");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const contentRef = useRef(null);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  // Reset tab to first one when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("locations");
      setSelectedLocation(null);
      setSelectedProductId(null);
    }
  }, [isOpen]);

  // Fetch Locations for this Buyer
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["buyerLocations", party?.partyId, isOpen],
    enabled: isOpen && !!party?.partyId && !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch(
        `/api/CRM/BuyerLocation/GetByPartyId?Id=${party?.partyId}`,
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      if (!res.ok) return [];
      const result = await res.json();
      return result?.data || [];
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedLocation(null);
      setActiveTab("product");
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useCloseOnEscape(isOpen, onClose);

  const tabs = [
    {
      id: "product",
      label: "Products",
      icon: Package,
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: Tag,
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        className={`fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm ${
          isDarkMode ? "bg-black/60" : "bg-gray-900/40"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Motion.div
          className={`relative w-full h-full overflow-hidden flex flex-col md:flex-row ${
            isDarkMode ? "bg-[#1B172D] text-white" : "bg-white text-gray-800"
          }`}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* ── MOBILE: Top header ── */}
          <div
            className={`md:hidden flex items-center justify-between px-4 pt-4 pb-2 border-b ${
              isDarkMode ? "border-white/5" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-600/10 flex items-center justify-center">
                <Settings
                  size={16}
                  className="text-green-600 animate-[spin_10s_linear_infinite]"
                />
              </div>
              <span
                className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Buyer Settings
              </span>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDarkMode
                  ? "hover:bg-white/5 text-gray-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-500"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── MOBILE: Horizontal tab strip ── */}
          <div
            className={`md:hidden flex gap-1 px-4 py-2 border-b ${
              isDarkMode
                ? "border-white/5 bg-black/20"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            {selectedLocation ? (
              tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === "pricing") setSelectedProductId(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? isDarkMode
                          ? "bg-green-600 text-white"
                          : "bg-white text-green-600 shadow-sm border border-gray-100 font-bold"
                        : isDarkMode
                          ? "text-gray-400 hover:bg-white/5"
                          : "text-gray-500 hover:bg-white"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-2 w-full opacity-40">
                <MapPin size={20} className="mb-1 text-gray-400" />
                <p className="text-[10px] uppercase font-bold text-center">
                  Select location to unlock tabs
                </p>
              </div>
            )}
          </div>

          {/* ── DESKTOP: Left Sidebar (hidden on mobile) ── */}
          <div
            className={`hidden md:flex w-64 p-4 flex-col gap-2 border-r transition-all overflow-y-auto ${
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
                    ? "hover:bg-white/5 text-gray-400 hover:text-white"
                    : "hover:bg-gray-200 text-gray-500"
                }`}
              >
                <X size={20} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-green-600/10 flex items-center justify-center">
                <Settings
                  size={18}
                  className="shrink-0 text-green-600 animate-[spin_10s_linear_infinite]"
                />
              </div>
            </div>

            <div className="px-2 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Buyer Settings
              </h2>
            </div>

            {selectedLocation ? (
              tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === "pricing") setSelectedProductId(null);
                    }}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                      isActive
                        ? isDarkMode
                          ? "bg-green-600 text-white shadow-xl shadow-green-600/20"
                          : "bg-white text-green-600 shadow-sm border border-gray-100 font-bold"
                        : isDarkMode
                          ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                          : "text-gray-500 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`transition-colors duration-300 ${isActive ? "text-current" : "opacity-50 group-hover:opacity-100"}`}
                    />
                    <span className="text-sm tracking-tight">{tab.label}</span>
                    {isActive && (
                      <Motion.div
                        layoutId="activeTabIndicatorDesktop"
                        className="absolute -left-4 w-1 h-6 bg-green-600 rounded-r-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <MapPin size={32} className="mb-2" />
                <p className="text-[10px] uppercase font-bold text-center px-4">
                  Select location to unlock tabs
                </p>
              </div>
            )}

            <div className="mt-auto p-4 rounded-2xl bg-linear-to-br from-green-600/5 to-emerald-600/5 border border-green-500/10">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Managing
              </p>
              <p className="text-xs font-bold text-green-600 truncate">
                {party?.partyName}
              </p>
            </div>
          </div>

          {/* Right Side Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
            <div
              className={`hidden md:flex px-8 py-4 items-center justify-between border-b ${isDarkMode ? "border-white/5 bg-white/2" : "border-gray-50 bg-white"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {tabs.find((t) => t.id === activeTab)?.label}
                </span>
                {selectedLocation && (
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <MapPin size={12} className="text-green-600 shrink-0" />
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none">
                          {selectedLocation.partyLocationName}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLocation(null);
                        setSelectedProductId(null);
                      }}
                      className="flex items-center gap-1.5 px-0 py-0 border-transparent rounded-none shrink-0 text-[10px] font-bold text-gray-500 hover:text-green-600 transition-colors uppercase tracking-widest group"
                    >
                      <RefreshCcw
                        size={10}
                        className="group-hover:rotate-180 transition-transform duration-500"
                      />
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={onClose}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isDarkMode
                      ? "text-gray-400 hover:bg-white/5"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 scroll-smooth"
            >
              <AnimatePresence mode="wait">
                {!selectedLocation ? (
                  <Motion.div
                    key="location-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full flex flex-col items-center justify-center p-6"
                  >
                    <div className="w-full max-w-2xl mt-4 md:mt-0">
                      <div className="text-center mb-6 md:mb-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-600/10 flex items-center justify-center mx-auto mb-3 md:mb-4">
                          <MapPin className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3
                          className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          Pick a Buyer Location
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm px-4">
                          Select the operational branch to view products and
                          pricing
                        </p>
                      </div>

                      {locationsLoading ? (
                        <div className="flex flex-col gap-3">
                          {[1].map((i) => (
                            <div
                              key={i}
                              className={`p-5 rounded-2xl border animate-pulse ${
                                isDarkMode
                                  ? "bg-white/2 border-white/5"
                                  : "bg-gray-50 border-gray-100"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}
                                  />
                                  <div className="flex flex-col gap-2">
                                    <div
                                      className={`h-3.5 w-36 rounded-full ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}
                                    />
                                    <div
                                      className={`h-2.5 w-24 rounded-full ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}
                                    />
                                  </div>
                                </div>
                                <div
                                  className={`w-6 h-6 rounded-full ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {locations.map((loc) => (
                            <button
                              key={loc.partyLocationId}
                              onClick={() => {
                                setSelectedLocation(loc);
                                setActiveTab("product");
                              }}
                              className={`group flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${
                                isDarkMode
                                  ? "bg-white/2 border-white/5 hover:border-green-600/30 hover:bg-white/5"
                                  : "bg-white border-gray-100 hover:border-green-600 hover:bg-green-50/30 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-white/5 text-gray-400 group-hover:text-green-500" : "bg-gray-50 text-gray-500 group-hover:text-green-600"}`}
                                >
                                  <MapPinned size={20} />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <p
                                    className={`font-bold text-sm truncate ${isDarkMode ? "text-white" : "text-gray-800"}`}
                                  >
                                    {loc.partyLocationName}
                                  </p>
                                  {loc.shortName && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-green-600 uppercase">
                                        {loc.shortName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center pl-2">
                                <div
                                  className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${isDarkMode ? "border-white/10 text-white group-hover:bg-green-600 group-hover:border-green-600" : "border-gray-200 text-gray-600 group-hover:bg-green-600 group-hover:border-green-600 group-hover:text-white"}`}
                                >
                                  Select
                                </div>
                              </div>
                            </button>
                          ))}
                          {locations.length === 0 && (
                            <div className="text-center py-20 opacity-40">
                              <p className="text-sm font-bold">
                                No locations found
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full flex flex-col min-w-0 bg-transparent"
                  >
                    {activeTab === "product" && (
                      <BuyerProductsTab
                        party={party}
                        location={selectedLocation}
                        isDarkMode={isDarkMode}
                        isActive={activeTab === "product"}
                        onClose={onClose}
                        onViewPricing={(id) => {
                          setSelectedProductId(id);
                          setActiveTab("pricing");
                        }}
                      />
                    )}

                    {activeTab === "pricing" && (
                      <BuyerPricingTab
                        party={party}
                        location={selectedLocation}
                        isDarkMode={isDarkMode}
                        isActive={activeTab === "pricing"}
                        onClose={onClose}
                        productId={selectedProductId}
                      />
                    )}
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default BuyerSettingsModal;
