import toast from "react-hot-toast";
import { Table, Tooltip } from "antd";
import { X, Redo, Loader2, FileSearch } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";

const Lottie = lazy(() => import("lottie-react"));
import failedAnimation from "../../../../assets/lottie/Failed.json";
import successAnimation from "../../../../assets/lottie/submit.json";

import jsonIcon from "../../../../assets/json.webp";

import { useTheme } from "../../../../ThemeProvider";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../components/SearchBar";
import Breadcrumb from "../../../../components/common/Breadcrumb";
// Imports End---

// Helper Component for JSON Display
const JsonView = ({ data, isDarkMode }) => {
  if (!data) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const highlightedJson = jsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = isDarkMode ? "text-amber-400" : "text-amber-600";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = isDarkMode ? "text-blue-400" : "text-blue-600";
          } else {
            cls = isDarkMode ? "text-emerald-400" : "text-emerald-600";
          }
        } else if (/true|false/.test(match)) {
          cls = isDarkMode ? "text-orange-400" : "text-orange-600";
        } else if (/null/.test(match)) {
          cls = isDarkMode ? "text-red-400" : "text-red-600";
        }
        return `<span class="${cls} font-medium">${match}</span>`;
      },
    );

  return (
    <div
      className={`relative group p-4 rounded-2xl text-[13px] leading-relaxed overflow-x-auto transition-all duration-300 ${
        isDarkMode
          ? "bg-black/40 border border-white/5 shadow-inner"
          : "bg-slate-50 border border-slate-200 shadow-inner"
      }`}
    >
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
      </div>
      <pre
        className="whitespace-pre-wrap break-all"
        dangerouslySetInnerHTML={{ __html: highlightedJson }}
      />
    </div>
  );
};

const FBRTestScenarioPage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [rawDataModalOpen, setRawDataModalOpen] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [postingScenarioId, setPostingScenarioId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [loadingType, setLoadingType] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

  const [responseModal, setResponseModal] = useState({
    open: false,
    message: "",
    isError: false,
    data: null,
  });

  // Handle body scroll lock and Escape key when modals are open
  useEffect(() => {
    if (rawDataModalOpen || jsonModalOpen || responseModal.open) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open");
    };
  }, [rawDataModalOpen, jsonModalOpen, responseModal.open]);

  useCloseOnEscape(rawDataModalOpen, () => setRawDataModalOpen(false));
  useCloseOnEscape(jsonModalOpen, () => setJsonModalOpen(false));
  useCloseOnEscape(responseModal.open, () =>
    setResponseModal({ open: false, message: "", isError: false, data: null }),
  );

  // Reset preview loader when modal opens
  useEffect(() => {
    if (rawDataModalOpen || jsonModalOpen) {
      setLoadingId(null);
      setLoadingType(null);
      setLoadingPreviewId(null);
    }
  }, [rawDataModalOpen, jsonModalOpen]);

  // Fetch FBR Test Scenarios
  const { data: scenariosList = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ["fbrTestScenarios", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      let allRecords = [];
      let start = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const payload = {
          draw: 0,
          start: start,
          length: batchSize,
          filters: "",
          columns: [],
          search: { value: "", regex: "false" },
          order: [{ column: 0, dir: "asc" }],
        };

        const res = await fetch("/api/DI/FBRTest/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok)
          throw new Error(result?.message || "Failed to fetch scenarios");

        const data = result?.data || [];
        allRecords = [...allRecords, ...data];

        if (data.length < batchSize) {
          hasMore = false;
        } else {
          start += batchSize;
        }
      }

      return allRecords;
    },
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Post Invoice Mutation
  const { mutate: postInvoice, isPending: isPosting } = useMutation({
    mutationFn: async (scenario) => {
      const res = await fetch(
        `/api/DI/FBRTest/PostInvoice?CriteriaSubTypeId=${scenario.criteriaSubTypeId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );

      const result = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(result));
      return result;
    },

    onSuccess: (data) => {
      setResponseModal({
        open: true,
        message: data?.message || "Invoice posted successfully!",
        isError: data?.statusCode >= 400,
        data: data,
      });
      setShowDetails(false);
      setPostingScenarioId(null);
    },

    onError: (err) => {
      let finalMessage = "Post failed";
      let errorData = null;
      try {
        const parsed = JSON.parse(err.message);
        finalMessage = parsed.message || finalMessage;
        errorData = parsed;
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        finalMessage = err.message;
      }

      setResponseModal({
        open: true,
        message: finalMessage,
        isError: true,
        data: errorData,
      });
      setShowDetails(false);
      setPostingScenarioId(null);
    },
  });

  // Fetch Raw Data
  const {
    data: rawScenarioData,
    isLoading: isRawDataLoading,
    isError: isRawDataError,
    error: rawDataError,
  } = useQuery({
    queryKey: ["fbrRawScenarioData", selectedScenario?.criteriaSubTypeId],
    enabled:
      !!selectedScenario?.criteriaSubTypeId &&
      (!!loadingId || !!loadingPreviewId),

    queryFn: async () => {
      const res = await fetch(
        `/api/DI/FBRTest/GetRawData?CriteriaSubTypeId=${selectedScenario.criteriaSubTypeId}`,
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch raw data");
      const result = await res.json();
      return result?.data || null;
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const currentLoadingId = loadingId || loadingPreviewId;

    if (
      currentLoadingId &&
      currentLoadingId === selectedScenario?.criteriaSubTypeId
    ) {
      if (!isRawDataLoading) {
        if (isRawDataError) {
          toast.error(rawDataError?.message || "Failed to fetch raw data");
        } else if (rawScenarioData && Object.keys(rawScenarioData).length > 0) {
          if (loadingType === "json") {
            setJsonModalOpen(true);
          } else {
            setRawDataModalOpen(true);
          }
        } else {
          toast.error("Empty data not available");
        }
        setLoadingId(null);
        setLoadingType(null);
        setLoadingPreviewId(null);
      }
    }
  }, [
    rawScenarioData,
    isRawDataLoading,
    isRawDataError,
    rawDataError,
    loadingId,
    loadingType,
    loadingPreviewId,
    selectedScenario,
  ]);

  const filteredData = useMemo(() => {
    let list = scenariosList;
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.criteriaName?.toLowerCase().includes(search) ||
          item.criteriaCode?.toLowerCase().includes(search) ||
          item.criteriaSeqNo?.toString().includes(search),
      );
    }
    return [...list].sort(
      (a, b) => (a.criteriaSeqNo || 0) - (b.criteriaSeqNo || 0),
    );
  }, [scenariosList, globalSearch]);

  const columns = [
    {
      title: "Sr.",
      dataIndex: "criteriaSeqNo",
      key: "criteriaSeqNo",
      width: 80,
      align: "center",
      sorter: (a, b) => (a.criteriaSeqNo || 0) - (b.criteriaSeqNo || 0),
      render: (val) => (
        <span className="font-bold text-xs text-purple-600">{val}</span>
      ),
    },
    {
      title: "Scenario Name",
      dataIndex: "criteriaName",
      key: "criteriaName",
      render: (name) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm line-clamp-1">{name}</span>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "criteriaCode",
      key: "criteriaCode",
      width: 120,
      align: "center",
      render: (code) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isDarkMode
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-purple-50 border-purple-100 text-purple-700"
          }`}
        >
          {code}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip
            title="Preview Raw Data"
            color={isDarkMode ? "#2e1065" : "#7c3aed"}
            mouseEnterDelay={0}
            mouseLeaveDelay={0}
          >
            <button
              onClick={() => {
                setLoadingId(record.criteriaSubTypeId);
                setLoadingType("file");
                setSelectedScenario(record);
              }}
              disabled={loadingId === record.criteriaSubTypeId}
              className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/50"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              } shadow-sm active:scale-95 group outline-none cursor-pointer ${
                loadingId === record.criteriaSubTypeId && loadingType === "file"
                  ? "opacity-70 cursor-wait"
                  : ""
              }`}
            >
              {loadingId === record.criteriaSubTypeId &&
              loadingType === "file" ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <FileSearch className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-3" />
              )}
            </button>
          </Tooltip>

          {/* JSON Button - Shows Raw JSON */}
          <Tooltip
            title="View Raw JSON"
            color={isDarkMode ? "#78350f" : "#d97706"}
            mouseEnterDelay={0}
            mouseLeaveDelay={0}
          >
            <button
              onClick={() => {
                setLoadingId(record.criteriaSubTypeId);
                setLoadingType("json");
                setSelectedScenario(record);
              }}
              disabled={loadingId === record.criteriaSubTypeId}
              className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400"
                  : "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100/80 hover:text-amber-700"
              } shadow-sm active:scale-95 group outline-none cursor-pointer ${
                loadingId === record.criteriaSubTypeId && loadingType === "json"
                  ? "opacity-70 cursor-wait"
                  : ""
              }`}
            >
              {loadingId === record.criteriaSubTypeId &&
              loadingType === "json" ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <img
                  src={jsonIcon}
                  alt="JSON"
                  className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-3"
                />
              )}
            </button>
          </Tooltip>

          {/* Post Button */}
          <button
            onClick={() => {
              setPostingScenarioId(record.criteriaSubTypeId);
              postInvoice(record);
            }}
            disabled={isPosting}
            className={`flex items-center justify-center h-8 px-4 gap-2 rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/40 hover:text-white hover:border-violet-400/50"
                : "bg-violet-600 text-white border border-transparent hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/30"
            } shadow-md group outline-none cursor-pointer font-['Outfit'] ${
              isPosting && postingScenarioId === record.criteriaSubTypeId
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Post
            </span>
            {isPosting && postingScenarioId === record.criteriaSubTypeId ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Redo className="w-3.5 h-3.5 transition-transform" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-full sm:items-center px-3 sm:px-3 sm:pl-5
        ${isDarkMode ? " bg-[#141025]" : "bg-gray-50"}`}
      >
        <Breadcrumb />
      </div>

      <Table
        loading={isLoadingScenarios}
        columns={columns}
        dataSource={filteredData}
        rowKey="criteriaSubTypeId"
        scroll={{ x: true }}
        bordered
        rowClassName={() =>
          "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2"
        }
        pagination={{
          total: filteredData?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          defaultPageSize: 10,
        }}
        title={() => (
          <div className="flex items-center justify-between">
            <div
              className={`text-md mt-2 sm:mt-1 font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Total Records: {filteredData?.length || 0}
            </div>

            <SearchBar
              value={globalSearch}
              onChange={setGlobalSearch}
              placeholder="Search Scenario..."
            />
          </div>
        )}
      />

      {/* Raw Data Modal */}
      <AnimatePresence>
        {rawDataModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 p-0">
            <Motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-5xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col sm:rounded-2xl rounded-none shadow-2xl overflow-hidden transition-all transform scale-100 ${
                isDarkMode
                  ? "bg-[#141025] text-white border border-[#2a2040]"
                  : "bg-white text-gray-800"
              }`}
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              {/* Modal Header */}
              <div
                className={`flex items-center justify-between px-4 sm:px-6 pt-4 pb-2`}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      FBR Scenario Preview
                    </h3>
                    <p className="text-xs opacity-50 font-medium uppercase tracking-widest sm:mt-1">
                      Detailed FBR Payload Preview
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setRawDataModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors ${
                    isDarkMode
                      ? "hover:bg-white/10 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {rawScenarioData && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      {[
                        {
                          label: "Invoice Type",
                          value: rawScenarioData.invoiceType,
                        },
                        {
                          label: "Invoice Date",
                          value: rawScenarioData.invoiceDate,
                        },
                        {
                          label: "Scenario ID",
                          value: rawScenarioData.scenarioId,
                        },
                        {
                          label: "Invoice Ref",
                          value: rawScenarioData.invoiceRefNo || "N/A",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`px-4 py-2 rounded-xl border ${
                            isDarkMode
                              ? "bg-white/5 border-white/5"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                            {item.label}
                          </span>
                          <span className="text-sm font-bold tracking-tight">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Seller/Buyer Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                      {/* Seller Card */}
                      <div
                        className={`rounded-xl border overflow-hidden ${
                          isDarkMode
                            ? "border-white/5 bg-white/5"
                            : "border-gray-100 bg-white shadow-sm"
                        }`}
                      >
                        <div className="px-5 py-2">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-500">
                            Seller Information
                          </span>
                        </div>
                        <div className="px-5 py-2 space-y-4">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Business Name
                            </p>
                            <p className="text-sm font-bold">
                              {rawScenarioData.sellerBusinessName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                NTN/CNIC
                              </p>
                              <p className="text-xs font-bold">
                                {rawScenarioData.sellerNTNCNIC}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                Province
                              </p>
                              <p className="text-xs font-bold">
                                {rawScenarioData.sellerProvince}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Address
                            </p>
                            <p className="text-xs opacity-70 leading-relaxed truncate">
                              {rawScenarioData.sellerAddress}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Buyer Card */}
                      <div
                        className={`rounded-xl border overflow-hidden ${
                          isDarkMode
                            ? "border-white/5 bg-white/5"
                            : "border-gray-100 bg-white shadow-sm"
                        }`}
                      >
                        <div className="px-5 py-2">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">
                            Buyer Information
                          </span>
                        </div>
                        <div className="px-5 py-2 space-y-4">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Business Name
                            </p>
                            <p className="text-sm font-bold">
                              {rawScenarioData.buyerBusinessName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                NTN/CNIC
                              </p>
                              <p className="text-xs font-bold">
                                {rawScenarioData.buyerNTNCNIC}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                Registration
                              </p>
                              <p className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold w-fit uppercase">
                                {rawScenarioData.buyerRegistrationType}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                Address
                              </p>
                              <p className="text-xs opacity-70 leading-relaxed truncate">
                                {rawScenarioData.buyerAddress}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                                Province
                              </p>
                              <p className="text-xs opacity-70 leading-relaxed font-bold">
                                {rawScenarioData.buyerProvince}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-3">
                        Items
                        <div className="h-[1px] flex-1 bg-current opacity-10"></div>
                        <span className="text-purple-500">
                          {rawScenarioData.items?.length || 0} Items
                        </span>
                      </h4>
                      <div
                        className={`rounded-xl border overflow-hidden ${
                          isDarkMode ? "border-white/10" : "border-gray-200"
                        }`}
                      >
                        <Table
                          dataSource={rawScenarioData.items}
                          pagination={false}
                          size="small"
                          scroll={{ x: true }}
                          bordered
                          rowKey={(record, idx) =>
                            `${record.hsCode}-${record.productDescription}-${idx}`
                          }
                          columns={[
                            {
                              title: "#",
                              width: 50,
                              align: "center",
                              render: (_, __, idx) => (
                                <span className="text-[10px] font-bold opacity-40">
                                  {idx + 1}
                                </span>
                              ),
                            },
                            {
                              title: "Sale Type",
                              dataIndex: "saleType",
                              key: "saleType",
                              width: 160,
                              render: (text) => (
                                <Tooltip
                                  title={text}
                                  placement="topLeft"
                                  mouseEnterDelay={0}
                                  mouseLeaveDelay={0}
                                >
                                  <div className="truncate max-w-[140px] font-medium opacity-80 cursor-help">
                                    {text || "N/A"}
                                  </div>
                                </Tooltip>
                              ),
                            },
                            {
                              title: "HS Code",
                              dataIndex: "hsCode",
                              key: "hsCode",
                              width: 100,
                            },
                            {
                              title: "Product Description",
                              dataIndex: "productDescription",
                              key: "desc",
                              width: 250,
                              render: (text) => (
                                <Tooltip
                                  title={text}
                                  placement="top"
                                  mouseEnterDelay={0}
                                  mouseLeaveDelay={0}
                                >
                                  <div className="truncate max-w-[240px] font-medium opacity-80 cursor-help">
                                    {text || "N/A"}
                                  </div>
                                </Tooltip>
                              ),
                            },
                            {
                              title: "UOM",
                              dataIndex: "uoM",
                              key: "uoM",
                              width: 120,
                            },
                            {
                              title: "Qty",
                              dataIndex: "quantity",
                              key: "qty",
                              align: "right",
                              width: 70,
                            },
                            {
                              title: "Rate",
                              dataIndex: "rate",
                              key: "rate",
                              align: "right",
                              width: 80,
                            },
                            {
                              title: "Total Val.",
                              dataIndex: "totalValues",
                              key: "totalValues",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "Excl. Tax",
                              dataIndex: "valueSalesExcludingST",
                              key: "excl",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "Fixed/Retail",
                              dataIndex: "fixedNotifiedValueOrRetailPrice",
                              key: "fixed",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "ST Appl.",
                              dataIndex: "salesTaxApplicable",
                              key: "tax",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "ST Withheld",
                              dataIndex: "salesTaxWithheldAtSource",
                              key: "stWithheld",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "Extra Tax",
                              dataIndex: "extraTax",
                              key: "extraTax",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "Further Tax",
                              dataIndex: "furtherTax",
                              key: "furtherTax",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "FED Payable",
                              dataIndex: "fedPayable",
                              key: "fed",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "Discount",
                              dataIndex: "discount",
                              key: "discount",
                              align: "right",
                              width: 100,
                              render: (v) => Number(v || 0).toLocaleString(),
                            },
                            {
                              title: "SRO Sch.",
                              dataIndex: "sroScheduleNo",
                              key: "sroSchedule",
                              width: 100,
                              align: "center",
                            },
                            {
                              title: "SRO Ser.",
                              dataIndex: "sroItemSerialNo",
                              key: "sroSerial",
                              width: 100,
                              align: "center",
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JSON Data Modal */}
      <AnimatePresence>
        {jsonModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 p-0">
            <Motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-2xl sm:max-h-[85vh] h-full sm:h-auto flex flex-col sm:rounded-2xl rounded-none shadow-2xl overflow-hidden transition-all transform scale-100 ${
                isDarkMode
                  ? "bg-[#141025] text-white border border-[#2a2040]"
                  : "bg-white text-gray-800"
              }`}
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Scenario JSON Data
                  </h3>
                  <p className="text-xs opacity-50 font-medium uppercase tracking-widest mt-1">
                    Raw FBR Payload View
                  </p>
                </div>
                <button
                  onClick={() => setJsonModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {rawScenarioData ? (
                  <JsonView data={rawScenarioData} isDarkMode={isDarkMode} />
                ) : (
                  <div className="text-center py-8">
                    <Loader2
                      size={40}
                      className="mx-auto text-purple-500 animate-spin mb-4 opacity-50"
                    />
                    <p className="text-sm font-medium opacity-50 text-purple-400">
                      Loading JSON data...
                    </p>
                  </div>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      {responseModal.open && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`w-[90%] max-w-md p-5 rounded-2xl shadow-xl transform transition-all scale-100 ${
              isDarkMode ? "bg-[#1A162B] text-white" : "bg-white text-gray-800"
            }`}
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            <div className="text-center">
              <div
                className={`mx-auto -mb-4 flex items-center justify-center w-32 h-32 rounded-full`}
              >
                {responseModal.isError ? (
                  <div className="w-32 h-32">
                    <Suspense
                      fallback={
                        <div className="w-32 h-32 bg-red-500/5 animate-pulse rounded-full" />
                      }
                    >
                      <Lottie
                        animationData={failedAnimation}
                        loop={false}
                        className="w-32 h-32"
                      />
                    </Suspense>
                  </div>
                ) : (
                  <Suspense
                    fallback={
                      <div className="w-32 h-32 bg-emerald-500/5 animate-pulse rounded-full" />
                    }
                  >
                    <Lottie
                      animationData={successAnimation}
                      loop={false}
                      className="w-32 h-32"
                    />
                  </Suspense>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                {!responseModal.isError && (
                  <Redo size={20} className="text-purple-500" />
                )}
                {responseModal.isError ? "Error" : "Post Response"}
              </h3>

              <p className="text-sm opacity-80 mb-4">{responseModal.message}</p>

              {responseModal.data && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`text-xs font-semibold py-1 px-3 rounded-md transition-colors ${
                      isDarkMode
                        ? "bg-white/10 text-purple-300 hover:bg-white/20"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    {showDetails ? "Hide Details" : "Show Details"}
                  </button>

                  {showDetails && (
                    <div
                      className={`mt-4 text-left p-4 rounded-xl text-[11px] overflow-y-auto max-h-60 border ${
                        isDarkMode
                          ? "bg-black/40 border-white/10 text-gray-300"
                          : "bg-gray-50 border-gray-100 text-gray-700"
                      }`}
                    >
                      {responseModal.data?.validationResponse ? (
                        <div className="space-y-3">
                          {responseModal.data.validationResponse.invoiceStatuses
                            ?.length > 0 && (
                            <div className="space-y-3">
                              <div className="font-bold text-purple-400 uppercase tracking-tight text-[10px]">
                                Itemized Failures:
                              </div>
                              {responseModal.data.validationResponse.invoiceStatuses.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white/5 p-2 rounded border border-white/5"
                                  >
                                    <div className="flex justify-between font-bold text-blue-300 mb-1">
                                      <span>Item SR No: {item.itemSNo}</span>
                                      <span>
                                        Code: {item.errorCode || "N/A"}
                                      </span>
                                    </div>
                                    <div className="opacity-80 italic leading-relaxed">
                                      {item.error}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <JsonView
                          data={responseModal.data}
                          isDarkMode={isDarkMode}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() =>
                  setResponseModal({
                    open: false,
                    message: "",
                    isError: false,
                    data: null,
                  })
                }
                className="w-full py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white mt-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FBRTestScenarioPage;
