import dayjs from "dayjs";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Table, Tooltip, Spin } from "antd";
import { useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { AlertCircle, Loader, Redo, FileSearch, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import pdfIcon from "../../../../assets/pdf.webp";

const Lottie = lazy(() => import("lottie-react"));
import failedAnimation from "../../../../assets/lottie/Failed.json";
import successAnimation from "../../../../assets/lottie/submit.json";
import billingAnimation from "../../../../assets/lottie/Papers.json";
import pendingAnimation from "../../../../assets/lottie/WarningStatus.json";

import { useTheme } from "../../../../ThemeProvider";

import { usePagePermissions } from "../../../../permissions";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useGetInvoices } from "../../../../hooks/useGetInvoices";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";
import { useGenerateInvoicePDF } from "../../../../hooks/useGenerateInvoicePDF";

import SearchBar from "../../../../components/SearchBar";
import SummaryCard from "../../../../components/SummaryCard";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import FilterToggle from "../../../../components/common/FilterToggle";
import InvoiceFilters from "../../../../components/InvoiceFilters";
// Imports End-----

const FBRInvoicePage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { generateInvoicePDF, pdfLoadingIds } = useGenerateInvoicePDF();

  const { canPost, canView, permission } = usePagePermissions();

  const location = useLocation();
  const queryClient = useQueryClient();

  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    location.state?.statusFilter || "Pending",
  );
  const [postingInvoiceId, setPostingInvoiceId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    NProgress.done();
  }, []);

  const [responseModal, setResponseModal] = useState({
    open: false,
    message: "",
    isError: false,
    data: null,
  });

  const [selectedRawId, setSelectedRawId] = useState(null);
  const [rawDataModal, setRawDataModal] = useState({
    open: false,
  });

  // Date Filter Helpers
  const getAcademicYearDates = () => {
    const today = dayjs();
    const currentMonth = today.month();
    const startYear = currentMonth >= 6 ? today.year() : today.year() - 1;
    return {
      FromDate: dayjs(`${startYear}-07-01`).format("YYYY-MM-DD"),
      ToDate: dayjs(`${startYear + 1}-06-30`).format("YYYY-MM-DD"),
    };
  };

  const [showFilters, setShowFilters] = useState(false);
  const [dateFilters, setDateFilters] = useState(getAcademicYearDates);

  const { data: invoiceList = [], isLoading: invoiceIsLoading } =
    useGetInvoices(dateFilters);

  const { mutate: postInvoice, isPending: postInvoiceIsLoading } = useMutation({
    mutationFn: async (invoiceId) => {
      setPostingInvoiceId(invoiceId);

      const res = await fetch(
        `/api/DI/FBR/PostInvoice?InvoiceId=${invoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      return res.text();
    },

    onSuccess: (data) => {
      let backendMessage = "";
      let isErrorFlag = false;

      let parsedData = null;

      try {
        const parsed = JSON.parse(data);
        parsedData = parsed;
        if (parsed && typeof parsed === "object") {
          backendMessage = parsed.message || "";
          const status = parsed.statusCode ? ` (${parsed.statusCode})` : "";

          if (parsed.statusCode && parsed.statusCode >= 400) {
            isErrorFlag = true;
          }

          if (backendMessage || status) {
            backendMessage = `${backendMessage}${status}`.trim();
          }
        } else {
          backendMessage = data;
        }
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        backendMessage = data;
      }

      const displayMessage = isErrorFlag
        ? `${backendMessage}`
        : `${backendMessage ? `: ${backendMessage}` : ""}`;

      setResponseModal({
        open: true,
        message: displayMessage,
        isError: isErrorFlag,
        data: parsedData,
      });

      setShowDetails(false);

      queryClient.invalidateQueries(["invoiceList"]);
      setPostingInvoiceId(null);
    },

    onError: (error) => {
      let backendMessage = error.message;

      let errorData = null;

      try {
        const parsed = JSON.parse(error.message);
        errorData = parsed;
        if (parsed && typeof parsed === "object") {
          const msg = parsed.message || "An error occurred";
          const status = parsed.statusCode ? ` (${parsed.statusCode})` : "";
          backendMessage = `${msg}${status}`;
        }
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        backendMessage = error.message;
      }

      setResponseModal({
        open: true,
        message: `${backendMessage}`,
        isError: true,
        data: errorData,
      });

      setShowDetails(false);

      queryClient.invalidateQueries(["invoiceList"]);
      setPostingInvoiceId(null);
    },
  });

  const {
    data: invoiceRawData,
    isLoading: isRawDataLoading,
    isFetched,
  } = useQuery({
    queryKey: ["getRawData", selectedRawId],
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/FBR/GetRawData?invoiceId=${selectedRawId}`,
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch settings");
      const result = await res.json();
      return result?.data ?? null;
    },
    enabled: !!selectedRawId,

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const fetchRawData = (invoiceId) => {
    setSelectedRawId(invoiceId);
  };

  useEffect(() => {
    if (isFetched && !isRawDataLoading && selectedRawId) {
      setRawDataModal({ open: true });
    }
  }, [isFetched, isRawDataLoading, selectedRawId]);

  useCloseOnEscape(responseModal.open, () =>
    setResponseModal({
      open: false,
      message: "",
      isError: false,
      data: null,
    }),
  );

  useCloseOnEscape(rawDataModal.open, () => {
    setRawDataModal({ open: false });
    setSelectedRawId(null);
  });

  useEffect(() => {
    if (responseModal.open || rawDataModal.open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [responseModal.open, rawDataModal.open]);

  // Map Invoice list for table
  const invoicesList = useMemo(() => {
    return invoiceList
      ? invoiceList.map((item, i) => ({
          key: item.invoiceId || `invoice-${i}`,
          sr: i + 1,
          integrationStatus: item.integrationStatus ?? "N/A",
          integrationResponse: item.integrationResponse ?? "",
          invoiceOn: item.invoiceOn ?? "N/A",
          invoiceId: item.invoiceId ?? "N/A",
          invoiceNo: item.invoiceNo ?? "N/A",
          partyName: item.partyName ?? "N/A",
          partyLocationName: item.partyLocationName ?? "N/A",
          ntn: item.ntn ?? "N/A",
          gst: item.gst ?? "N/A",
          cnic: item.cnic ?? "N/A",
          totalAmount: item.totalAmount ?? 0,
          totalTax: item.totalTax ?? 0,
          totalReceivable: (item.totalAmount ?? 0) + (item.totalTax ?? 0),
          integrationRefNo: item.integrationRefNo ?? "",
          lastModifiedOn: item.lastModifiedOn ?? "N/A",
        }))
      : [];
  }, [invoiceList]);

  // Count logic
  const totalInvoices = invoicesList.length;

  const submitInvoices = invoicesList.filter(
    (o) => o.integrationStatus === "Success",
  ).length;

  const pendingInvoices = invoicesList.filter(
    (i) => !["Success", "Failed"].includes(i.integrationStatus),
  ).length;

  const failedInvoices = invoicesList.filter(
    (i) => i.integrationStatus === "Failed",
  ).length;

  // Function to handle summary card click
  const handleSummaryCardClick = (status) => {
    setStatusFilter(status);
    setGlobalSearch("");
  };

  const filteredData = useMemo(() => {
    const statusFilteredData = invoicesList.filter((item) => {
      if (statusFilter === "All") {
        return true;
      }
      if (statusFilter === "Pending") {
        return !["Success", "Failed"].includes(item.integrationStatus);
      }
      return item.integrationStatus === statusFilter;
    });

    if (!globalSearch) {
      return statusFilteredData;
    }

    const search = globalSearch.toLowerCase();
    return statusFilteredData.filter((item) => {
      const searchStr = search.toLowerCase();
      return (
        item.sr?.toString().includes(searchStr) ||
        item.invoiceOn?.toLowerCase().includes(searchStr) ||
        item.partyName?.toLowerCase().includes(searchStr) ||
        item.partyLocationName?.toLowerCase().includes(searchStr) ||
        item.invoiceNo?.toString().toLowerCase().includes(searchStr) ||
        item.ntn?.toLowerCase().includes(searchStr) ||
        item.gst?.toLowerCase().includes(searchStr) ||
        item.cnic?.toLowerCase().includes(searchStr) ||
        item.totalTax?.toString().includes(searchStr) ||
        item.totalAmount?.toString().includes(searchStr) ||
        item.totalReceivable?.toString().includes(searchStr)
      );
    });
  }, [invoicesList, statusFilter, globalSearch]);

  //   Table Columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 60,
      sorter: (a, b) => a.sr - b.sr,
      align: "center",
    },
    {
      title: "DATE",
      key: "invoice_date",
      width: 80,
      align: "right",
      sorter: (a, b) => dayjs(a.invoiceOn).unix() - dayjs(b.invoiceOn).unix(),
      render: (_, record) => (
        <div className="flex flex-col py-0.5 leading-tight">
          <span
            className={`text-[11px] font-bold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            {record.invoiceOn
              ? dayjs(record.invoiceOn).format("DD MMM YYYY")
              : "N/A"}
          </span>
          <span
            className={`text-[10px] font-black mt-0.5 tracking-tight ${
              isDarkMode ? "text-purple-400" : "text-purple-600"
            }`}
          >
            #{record.invoiceNo}
          </span>
        </div>
      ),
    },
    {
      title: "BUYER",
      dataIndex: "partyName",
      width: 215,
      ellipsis: true,
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium text-left truncate max-w-50">
            {record.partyName || "N/A"}
          </span>

          <span className="text-xs text-gray-500 text-left truncate max-w-50 -mt-1">
            {record.partyLocationName || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "REG INFO",
      key: "regInfo",
      width: 100,
      ellipsis: true,
      align: "left",
      className: "text-right",
      sorter: (a, b) => {
        const valA =
          a.cnic !== "N/A" ? a.cnic : a.ntn !== "N/A" ? a.ntn : a.gst;
        const valB =
          b.cnic !== "N/A" ? b.cnic : b.ntn !== "N/A" ? b.ntn : b.gst;
        return (valA || "").localeCompare(valB || "");
      },
      render: (_, record) => {
        let label = "";
        let value = "";

        const isInvalid = (val) =>
          !val || val === "N/A" || /^0+[-]*0*$/.test(val);

        if (!isInvalid(record.cnic)) {
          label = "CNIC";
          value = record.cnic;
        } else if (!isInvalid(record.ntn)) {
          label = "NTN";
          value = record.ntn;
        } else if (!isInvalid(record.gst)) {
          label = "STRN";
          value = record.gst;
        }

        return (
          <div className="flex flex-col items-end w-full">
            {value ? (
              <>
                <span className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">
                  {label}
                </span>
                <span className="font-medium text-purple-600 dark:text-purple-400 truncate max-w-27.5 -mt-1">
                  {value}
                </span>
              </>
            ) : (
              <span className="text-gray-400 italic text-[11px]">
                Unregistered
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "TOTAL TAX",
      dataIndex: "totalTax",
      width: 110,
      sorter: (a, b) => a.totalTax - b.totalTax,
      render: (value) => (
        <span className="text-right block">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: "TOTAL REC...",
      dataIndex: "totalReceivable",
      width: 120,
      align: "left",
      sorter: (a, b) => a.totalReceivable - b.totalReceivable,
      render: (value) => (
        <span className="text-right block">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "integrationStatus",
      width: 90,
      align: "center",
      sorter: (a, b) => a.integrationStatus.localeCompare(b.integrationStatus),
      render: (_, record) => {
        const status = record.integrationStatus;
        let bg = "bg-gray-200 text-gray-700";
        let text = status || "N/A";

        if (status === "Success") {
          bg = isDarkMode
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-emerald-50 text-emerald-700 border border-emerald-100";
        } else if (status === "Failed") {
          bg = isDarkMode
            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            : "bg-rose-50 text-rose-700 border border-rose-100";
        } else if (status === "Pending") {
          bg = isDarkMode
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            : "bg-amber-50 text-amber-700 border border-amber-100";
        }

        const capsule = (
          <span
            className={`${bg} px-3 py-1 rounded-full text-xs font-semibold inline-block duration-200 transition-all cursor-pointer`}
            style={{ minWidth: "70px" }}
          >
            {text}
          </span>
        );

        if (status === "Failed") {
          return (
            <Tooltip
              title={record.integrationResponse}
              placement="top"
              overlayInnerStyle={{
                maxWidth: "300px",
                whiteSpace: "normal",
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                color: isDarkMode ? "#f5f5f5" : "#000",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              {capsule}
            </Tooltip>
          );
        }

        if (status === "Success" && record.integrationRefNo) {
          return (
            <Tooltip
              title={`FBR Ref: ${record.integrationRefNo}`}
              placement="top"
              overlayInnerStyle={{
                maxWidth: "300px",
                whiteSpace: "normal",
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                color: isDarkMode ? "#f5f5f5" : "#000",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              {capsule}
            </Tooltip>
          );
        }

        return capsule;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => {
        const actionButtons = [];

        if (record.integrationStatus === "Pending") {
          actionButtons.push(
            postInvoiceIsLoading && postingInvoiceId === record.invoiceId ? (
              <div
                key="proceed-loading"
                className={`flex items-center justify-center h-8 w-8 rounded-xl border transition-colors duration-200 shadow-sm ${
                  isDarkMode
                    ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                    : "bg-white border-gray-300 text-violet-600"
                }`}
              >
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <button
                key="proceed"
                onClick={() => {
                  if (!permission(canPost, "No permission to post invoice"))
                    return;
                  postInvoice(record.invoiceId);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                  isDarkMode
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 hover:text-violet-300 hover:border-violet-500/40"
                    : "bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 hover:border-violet-200"
                } shadow-sm active:scale-90 group`}
                title="Proceed Invoice"
              >
                <Redo className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            ),
          );
        }

        if (record.integrationStatus === "Failed") {
          actionButtons.push(
            postInvoiceIsLoading && postingInvoiceId === record.invoiceId ? (
              <div
                key="retry-loading"
                className={`flex items-center justify-center h-8 w-8 rounded-xl border transition-colors duration-200 shadow-sm ${
                  isDarkMode
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-white border-gray-300 text-rose-600"
                }`}
              >
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <button
                key="retry"
                onClick={() => {
                  if (!permission(canPost, "No permission to post invoice"))
                    return;
                  postInvoice(record.invoiceId);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                  isDarkMode
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 hover:text-rose-300 hover:border-rose-500/40"
                    : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:border-rose-200"
                } shadow-sm active:scale-90 group`}
                title="Retry Submission"
              >
                <AlertCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            ),
          );
        }

        actionButtons.push(
          <button
            key="view"
            onClick={() => {
              if (!permission(canView, "No permission to view raw data"))
                return;
              fetchRawData(record.invoiceId);
            }}
            className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/40"
                : "bg-zinc-50 text-zinc-500 border border-zinc-100 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-100"
            } shadow-sm active:scale-90 group`}
            disabled={isRawDataLoading && selectedRawId === record.invoiceId}
            title="View Raw Data"
          >
            {isRawDataLoading && selectedRawId === record.invoiceId ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <FileSearch className="w-4 h-4 transition-transform group-hover:scale-110" />
            )}
          </button>,
        );

        actionButtons.push(
          pdfLoadingIds[record.invoiceId] ? (
            <div
              key={`preview-loading-${record.invoiceId}`}
              className={`h-8 w-8 rounded-xl border transition-colors duration-200 shadow-sm flex items-center justify-center ${
                isDarkMode
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "bg-white border-gray-300 text-sky-600"
              }`}
            >
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <button
              onClick={() => {
                if (!permission(canView, "No permission to view PDF")) return;
                generateInvoicePDF(record.invoiceId);
              }}
              key="preview"
              className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/25 hover:text-sky-300 hover:border-sky-500/40"
                  : "bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 hover:border-sky-200"
              } shadow-sm active:scale-90 group`}
              title="Preview PDF"
            >
              <img
                src={pdfIcon}
                alt="PDF"
                className="w-4 h-4 transition-transform group-hover:scale-105"
              />
            </button>
          ),
        );
        return (
          <div className="flex items-center justify-center gap-2">
            {actionButtons}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-50"
        }`}
      >
        <Breadcrumb />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 my-4">
        <SummaryCard
          animationData={billingAnimation}
          count={totalInvoices}
          title="Total"
          color="#3B82F6"
          isActive={statusFilter === "All"}
          onClick={() => handleSummaryCardClick("All")}
        />

        <SummaryCard
          animationData={pendingAnimation}
          title="Pending"
          color="#F59E0B"
          count={pendingInvoices}
          isActive={statusFilter === "Pending"}
          onClick={() => handleSummaryCardClick("Pending")}
        />

        <SummaryCard
          animationData={successAnimation}
          title="Success"
          color="#059669"
          count={submitInvoices}
          isActive={statusFilter === "Success"}
          onClick={() => handleSummaryCardClick("Success")}
        />

        <SummaryCard
          animationData={failedAnimation}
          title="Failed"
          color="#EF4444"
          count={failedInvoices}
          isActive={statusFilter === "Failed"}
          onClick={() => handleSummaryCardClick("Failed")}
        />
      </div>

      <div className="mb-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <FilterToggle
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />

              <div
                className={`text-md font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Total Records: {filteredData?.length || 0}
              </div>
            </div>

            <SearchBar
              value={globalSearch}
              onChange={setGlobalSearch}
              placeholder="Search Invoice..."
              className="w-full sm:w-80"
            />
          </div>

          <InvoiceFilters
            showFilters={showFilters}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
            getAcademicYearDates={getAcademicYearDates}
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="">
        <Table
          loading={
            invoiceIsLoading
              ? {
                  indicator: (
                    <div className="flex w-full h-full items-center justify-center min-h-100">
                      <Spin size="medium" />
                    </div>
                  ),
                }
              : false
          }
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1000 }}
          bordered
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-10 [&>td]:!py-1.5 [&>td]:!px-2"
          }
          pagination={{
            total: filteredData?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            defaultPageSize: 10,
          }}
        />
      </div>

      {/* Response Modal */}
      {responseModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() =>
            setResponseModal({
              open: false,
              message: "",
              isError: false,
              data: null,
            })
          }
        >
          <div
            className={`w-[90%] max-w-md p-6 rounded-2xl shadow-xl transform transition-all scale-100 ${
              isDarkMode ? "bg-[#1A162B] text-white" : "bg-white text-gray-800"
            }`}
            style={{ fontFamily: '"Outfit", sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full`}
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

              <h3 className="text-lg font-semibold mb-2">
                {responseModal.isError ? "Error" : "Response"}
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
                      className={`mt-4 text-left p-4 rounded-xl text-[11px] font-mono overflow-y-auto max-h-60 border ${
                        isDarkMode
                          ? "bg-black/40 border-white/10 text-gray-300"
                          : "bg-gray-50 border-gray-100 text-gray-700"
                      }`}
                    >
                      <pre className="whitespace-pre-wrap">
                        {responseModal.data?.validationResponse ? (
                          <>
                            {responseModal.data.validationResponse
                              .invoiceStatuses?.length > 0 && (
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
                          </>
                        ) : (
                          JSON.stringify(responseModal.data, null, 2)
                        )}
                      </pre>
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
                className="w-full py-2.5 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Modal */}
      {rawDataModal.open && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 p-0"
          onClick={() => {
            setRawDataModal({ open: false });
            setSelectedRawId(null);
          }}
        >
          <div
            className={`w-full max-w-5xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col sm:rounded-2xl rounded-none shadow-2xl overflow-hidden transition-all transform scale-100 ${
              isDarkMode
                ? "bg-[#141025] text-white border border-[#2a2040]"
                : "bg-white text-gray-800"
            }`}
            style={{ fontFamily: '"Outfit", sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between px-4 sm:px-6 pt-4 pb-2`}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Invoice Data
                  </h3>
                  <p className="text-xs opacity-50 font-medium uppercase tracking-widest sm:mt-1">
                    Detailed FBR Payload Preview
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setRawDataModal({ open: false });
                  setSelectedRawId(null);
                }}
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
              {isRawDataLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-sm font-medium opacity-50 animate-pulse uppercase tracking-widest">
                    Loading...
                  </p>
                </div>
              ) : invoiceRawData ? (
                <>
                  {/* Basic Info Section */}
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    {[
                      {
                        label: "Invoice Type",
                        value: invoiceRawData.invoiceType,
                      },
                      {
                        label: "Invoice Date",
                        value: invoiceRawData.invoiceDate,
                      },
                      {
                        label: "Scenario ID",
                        value: invoiceRawData.scenarioId,
                      },
                      {
                        label: "Invoice Ref",
                        value: invoiceRawData.invoiceRefNo || "N/A",
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
                            {invoiceRawData.sellerBusinessName}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              NTN/CNIC
                            </p>
                            <p className="text-xs font-bold">
                              {invoiceRawData.sellerNTNCNIC}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Province
                            </p>
                            <p className="text-xs font-bold">
                              {invoiceRawData.sellerProvince}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                            Address
                          </p>
                          <p className="text-xs opacity-70 leading-relaxed truncate">
                            {invoiceRawData.sellerAddress}
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
                            {invoiceRawData.buyerBusinessName}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              NTN/CNIC
                            </p>
                            <p className="text-xs font-bold">
                              {invoiceRawData.buyerNTNCNIC}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Registration
                            </p>
                            <p className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold w-fit uppercase">
                              {invoiceRawData.buyerRegistrationType}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Address
                            </p>
                            <p className="text-xs opacity-70 leading-relaxed truncate">
                              {invoiceRawData.buyerAddress}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] opacity-60 uppercase font-bold mb-1">
                              Province
                            </p>
                            <p className="text-xs opacity-70 leading-relaxed font-bold">
                              {invoiceRawData.buyerProvince}
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
                      <div className="h-px flex-1 bg-current opacity-10"></div>
                      <span className="text-purple-500">
                        {invoiceRawData.items?.length || 0} Items
                      </span>
                    </h4>
                    <div
                      className={`rounded-xl border overflow-hidden ${
                        isDarkMode ? "border-white/10" : "border-gray-200"
                      }`}
                    >
                      <Table
                        dataSource={invoiceRawData.items}
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                        bordered
                        rowKey={(record) =>
                          `${record.itemSNo}-${record.hsCode}-${record.productDescription}`
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
                                <div className="truncate max-w-35 font-medium opacity-80 cursor-help">
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
                                <div className="truncate max-w-60 font-medium opacity-80 cursor-help">
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

                  {/* Items Summary */}
                  <div className="pt-2">
                    <div
                      className={`rounded-2xl p-6 border ${
                        isDarkMode
                          ? "bg-linear-to-br from-[#1c1830] to-[#141025] border-white/5"
                          : "bg-linear-to-br from-gray-50 to-white border-gray-100 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <FileSearch className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold tracking-tight">
                            Items Summary
                          </h4>
                          <p className="text-[10px] opacity-50 uppercase font-black tracking-widest mt-0.5">
                            Financial Totals Overview
                          </p>
                        </div>
                        <div className="h-px flex-1 bg-current opacity-5 ml-2"></div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4">
                        {[
                          {
                            label: "Total Quantity",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) => sum + Number(item.quantity || 0),
                              0,
                            ),
                            color: "text-blue-500",
                          },
                          {
                            label: "Total Values",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) =>
                                sum + Number(item.totalValues || 0),
                              0,
                            ),
                          },
                          {
                            label: "Value Excl. ST",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) =>
                                sum + Number(item.valueSalesExcludingST || 0),
                              0,
                            ),
                          },
                          {
                            label: "ST Applicable",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) =>
                                sum + Number(item.salesTaxApplicable || 0),
                              0,
                            ),
                            color: "text-emerald-500",
                          },
                          {
                            label: "ST Withheld",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) =>
                                sum +
                                Number(item.salesTaxWithheldAtSource || 0),
                              0,
                            ),
                          },
                          {
                            label: "Extra Tax",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) => sum + Number(item.extraTax || 0),
                              0,
                            ),
                          },
                          {
                            label: "Further Tax",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) => sum + Number(item.furtherTax || 0),
                              0,
                            ),
                          },
                          {
                            label: "FED Payable",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) => sum + Number(item.fedPayable || 0),
                              0,
                            ),
                          },
                          {
                            label: "Discount",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) => sum + Number(item.discount || 0),
                              0,
                            ),
                            color: "text-rose-500",
                          },
                          {
                            label: "Grand Total",
                            value: invoiceRawData.items?.reduce(
                              (sum, item) =>
                                sum +
                                Number(
                                  item.valueSalesExcludingST ||
                                    item.totalValues ||
                                    0,
                                ) +
                                Number(item.salesTaxApplicable || 0) +
                                Number(item.furtherTax || 0) +
                                Number(item.extraTax || 0) +
                                Number(item.fedPayable || 0) -
                                Number(item.discount || 0),
                              0,
                            ),
                            isGrand: true,
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className={`flex flex-col ${
                              stat.isGrand
                                ? "lg:col-span-1 rounded-xl bg-purple-500/10 p-3 -m-3 border border-purple-500/20"
                                : ""
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                              {stat.label}
                            </span>
                            <span
                              className={`text-sm font-black tracking-tight ${
                                stat.color ||
                                (stat.isGrand
                                  ? "text-purple-500 text-lg"
                                  : isDarkMode
                                    ? "text-white"
                                    : "text-gray-900")
                              }`}
                            >
                              {stat.isGrand && (
                                <small className="text-[10px] mr-1 font-bold opacity-60">
                                  RS.
                                </small>
                              )}
                              {Number(stat.value || 0).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle
                    size={48}
                    className="mx-auto text-red-400 mb-4 opacity-30"
                  />
                  <p className="text-sm font-medium opacity-50">
                    Unable to retrieve raw data at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FBRInvoicePage;
