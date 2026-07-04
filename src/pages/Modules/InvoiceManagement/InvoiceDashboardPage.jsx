import dayjs from "dayjs";
import { Table } from "antd";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useMemo } from "react";
import Chart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { FileText, TrendingUp, Activity, Users, Redo } from "lucide-react";

import { useTheme } from "../../../ThemeProvider";
import { useGetInvoices } from "../../../hooks/useGetInvoices";
import { useGetBuyer } from "../../../hooks/useGetBuyer";

import SummaryCard from "../../../components/SummaryCard";
import CustomButton from "../../../components/common/CustomButton";

import InvoicesSkeleton from "../../../components/skeletons/InvoicesSkeleton";

import moneyAnim from "../../../assets/lottie/Money.json";
import papersAnim from "../../../assets/lottie/Papers.json";
import failedAnim from "../../../assets/lottie/Failed.json";
import walletAnim from "../../../assets/lottie/Wallet_Money.json";
import warningAnim from "../../../assets/lottie/WarningStatus.json";
// Imports End-----

const InvoiceDashboardPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const { data: invoiceList = [], isLoading } = useGetInvoices();
  const { data: buyerList = [], isLoading: buyerLoading } = useGetBuyer();

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    if (!invoiceList) return { total: 0, amount: 0, tax: 0, receivable: 0 };

    return invoiceList.reduce(
      (acc, item) => ({
        total: acc.total + 1,
        amount: acc.amount + (Number(item.totalAmount) || 0),
        tax: acc.tax + (Number(item.totalTax) || 0),
        receivable: acc.receivable + (Number(item.totalReceivable) || 0),
        pending: acc.pending + (item.integrationStatus === "Pending" ? 1 : 0),
        failed: acc.failed + (item.integrationStatus === "Failed" ? 1 : 0),
      }),
      {
        total: 0,
        amount: 0,
        tax: 0,
        receivable: 0,
        pending: 0,
        failed: 0,
      },
    );
  }, [invoiceList]);

  // 2. Prepare Chart Data
  const chartData = useMemo(() => {
    if (!invoiceList)
      return { days: [], values: [], parties: [], partyValues: [] };

    const dateMap = {};
    const partyMap = {};

    invoiceList.forEach((item) => {
      // Date Grouping
      const dateKey = item.invoiceOn
        ? dayjs(item.invoiceOn).format("MMM DD")
        : "Unknown";
      dateMap[dateKey] =
        (dateMap[dateKey] || 0) + (Number(item.totalAmount) || 0);

      // Party Grouping
      const party = item.partyName || "Unknown";
      partyMap[party] =
        (partyMap[party] || 0) + (Number(item.totalAmount) || 0);
    });

    const sortedList = [...invoiceList].sort(
      (a, b) => new Date(a.invoiceOn) - new Date(b.invoiceOn),
    );

    const sortedDateMap = {};
    sortedList.forEach((item) => {
      const d = item.invoiceOn
        ? dayjs(item.invoiceOn).format("DD MMM")
        : "Unknown";
      sortedDateMap[d] =
        (sortedDateMap[d] || 0) + (Number(item.totalAmount) || 0);
    });

    const days = Object.keys(sortedDateMap);
    const values = Object.values(sortedDateMap);

    // Format for Party Bar Chart (Top 5)
    const sortedParties = Object.entries(partyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      days,
      values,
      parties: sortedParties.map((p) => p[0]),
      partyValues: sortedParties.map((p) => p[1]),
    };
  }, [invoiceList]);

  // 3. Recent Invoices
  const recentInvoices = useMemo(() => {
    return [...invoiceList]
      .sort(
        (a, b) =>
          new Date(b.lastModifiedOn || b.invoiceOn) -
          new Date(a.lastModifiedOn || a.invoiceOn),
      )
      .slice(0, 5)
      .map((item, i) => ({
        key: item.invoiceId || i,
        sr: i + 1,
        invoiceNo: item.invoiceNo || "N/A",
        partyName: item.partyName || "N/A",
        date: item.invoiceOn
          ? dayjs(item.invoiceOn).format("DD-MM-YYYY")
          : "N/A",
        amount: item.totalAmount,
        status: item.integrationStatus || "Pending",
      }));
  }, [invoiceList]);

  // 4. Recent Parties
  const recentParties = useMemo(() => {
    return [...buyerList]
      .sort((a, b) => b.partyId - a.partyId)
      .slice(0, 5)
      .map((item, i) => ({
        key: item.partyId || i,
        sr: i + 1,
        name: item.partyName || "N/A",
        category: item.partyCategoryName || "N/A",
        ntn: item.ntn || "N/A",
        strn: item.gst || "N/A",
      }));
  }, [buyerList]);

  // --- Chart Configs ---
  const areaChartOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#8b5cf6"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.days,
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#4b5563",
          fontFamily: "Outfit, sans-serif",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#4b5563",
          fontFamily: "Outfit, sans-serif",
        },
        formatter: (value) => value.toLocaleString(),
      },
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      style: { fontFamily: "Outfit, sans-serif" },
    },
  };

  const barChartOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#10b981"],
    plotOptions: {
      bar: { borderRadius: 4, horizontal: true, barHeight: "60%" },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.parties,
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#4b5563",
          fontFamily: "Outfit, sans-serif",
        },
        formatter: (val) => val.toLocaleString(),
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#4b5563",
          fontFamily: "Outfit, sans-serif",
        },
      },
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      style: { fontFamily: "Outfit, sans-serif" },
    },
  };

  // --- Table Columns ---
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 50,
      align: "center",
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      align: "center",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Date",
      dataIndex: "date",
      align: "center",
      render: (text) => (
        <span className="text-gray-500 dark:text-gray-400">{text}</span>
      ),
    },
    {
      title: "Party",
      dataIndex: "partyName",
      ellipsis: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right",
      render: (val) => (
        <span className="font-semibold">{Number(val).toLocaleString()}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status) => {
        const statusConfig = {
          Success: {
            bg: "bg-green-100/80",
            text: "text-green-700",
            border: "border-green-200",
            darkBg: "bg-green-500/20",
            darkText: "text-green-400",
            darkBorder: "border-green-500/20",
          },
          Failed: {
            bg: "bg-red-100/80",
            text: "text-red-700",
            border: "border-red-200",
            darkBg: "bg-red-500/20",
            darkText: "text-red-400",
            darkBorder: "border-red-500/20",
          },
          Pending: {
            bg: "bg-orange-100/80",
            text: "text-orange-700",
            border: "border-orange-200",
            darkBg: "bg-orange-500/20",
            darkText: "text-orange-400",
            darkBorder: "border-orange-500/20",
          },
        };

        const config = statusConfig[status] || {
          bg: "bg-gray-100/80",
          text: "text-gray-700",
          border: "border-gray-200",
          darkBg: "bg-gray-500/20",
          darkText: "text-gray-400",
          darkBorder: "border-gray-500/20",
        };

        return (
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm transition-all duration-200
              ${
                isDarkMode
                  ? `${config.darkBg} ${config.darkText} ${config.darkBorder}`
                  : `${config.bg} ${config.text} ${config.border}`
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? config.darkBg.replace("bg-", "bg-") : config.text.replace("text-", "bg-")}`}
            />
            {status}
          </span>
        );
      },
    },
  ];

  // --- Party Table Columns ---
  const partyColumns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 50,
      align: "center",
    },
    {
      title: "Party Name",
      dataIndex: "name",
      ellipsis: true,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Party Category",
      dataIndex: "category",
      align: "center",
      render: (text) => (
        <span
          className={`
          inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm transition-all duration-200
          ${
            isDarkMode
              ? "bg-blue-500/20 text-blue-300 border-blue-500/20"
              : "bg-blue-100/80 text-blue-700 border-blue-200"
          }
        `}
        >
          {text}
        </span>
      ),
    },
    {
      title: "NTN",
      dataIndex: "ntn",
      align: "center",
    },
    {
      title: "STRN",
      dataIndex: "strn",
      align: "center",
    },
  ];

  if (isLoading) return <InvoicesSkeleton isDarkMode={isDarkMode} />;

  return (
    <Motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full space-y-6"
    >
      {/* Header */}
      <Motion.div
        variants={itemVariants}
        className={`relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl px-8 py-4 transition-all duration-300 border-l-[6px] border-purple-500 shadow-lg ${
          isDarkMode
            ? "bg-[#1B172D]/50 border-purple-600/50 backdrop-blur-md"
            : "bg-white border-purple-500 shadow-purple-100"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${isDarkMode ? "bg-purple-900/40 text-purple-400" : "bg-purple-50 text-purple-600"}`}
          >
            <Activity size={28} />
          </div>

          <div>
            <h1
              className={`text-2xl font-extrabold tracking-tight ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Invoice Dashboard
            </h1>

            <p
              className={`text-sm font-medium mt-0.5 ${
                isDarkMode ? "text-purple-300/60" : "text-purple-600/70"
              }`}
            >
              Real-time monitoring of your financial flow
            </p>
          </div>
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl invisible sm:visible" />
      </Motion.div>

      {/* Summary Cards Line 1 */}
      <Motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <SummaryCard
          title="Total Invoices"
          count={stats.total}
          color="#8b5cf6"
          animationData={papersAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "All" },
            });
          }}
        />
        <SummaryCard
          title="Total Amount"
          count={statusFormatted(stats.amount)}
          color="#3b82f6"
          animationData={walletAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "All" },
            });
          }}
        />
        <SummaryCard
          title="Total Tax"
          count={statusFormatted(stats.tax)}
          color="#f43f5e"
          animationData={papersAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "All" },
            });
          }}
        />
        <SummaryCard
          title="Total Receivable"
          count={statusFormatted(stats.receivable)}
          color="#8b5cf6"
          animationData={moneyAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "All" },
            });
          }}
        />
      </Motion.div>

      {/* Summary Cards Line 2 */}
      <Motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <SummaryCard
          title="Pending Invoices"
          count={stats.pending}
          color="#f59e0b"
          animationData={warningAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "Pending" },
            });
          }}
        />
        <SummaryCard
          title="Failed Invoices"
          count={stats.failed}
          color="#ef4444"
          animationData={failedAnim}
          onClick={() => {
            NProgress.start();
            navigate("/FIN/FBRInvoice/Index", {
              state: { statusFilter: "Failed" },
            });
          }}
        />
      </Motion.div>

      {/* Charts Section */}
      <Motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Area Chart: Revenue Trend */}
        <div
          className={`p-5 rounded-2xl shadow-sm border ${
            isDarkMode
              ? "bg-[#1B172D] border-gray-800"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3
              className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Revenue Trend
            </h3>
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-600"}`}
            >
              <TrendingUp size={20} />
            </div>
          </div>

          <Chart
            options={areaChartOptions}
            series={[{ name: "Revenue", data: chartData.values }]}
            type="area"
            height={300}
          />
        </div>

        {/* Bar Chart: Top Customers */}
        <div
          className={`p-5 rounded-2xl shadow-sm border ${
            isDarkMode
              ? "bg-[#1B172D] border-gray-800"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3
              className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Top Customers
            </h3>

            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
            >
              <Activity size={20} />
            </div>
          </div>

          <Chart
            options={barChartOptions}
            series={[{ name: "Amount", data: chartData.partyValues }]}
            type="bar"
            height={300}
          />
        </div>
      </Motion.div>

      {/* Recent Invoices Table */}
      <Motion.div
        variants={itemVariants}
        className={`p-5 rounded-2xl shadow-sm border ${
          isDarkMode
            ? "bg-[#1B172D] border-gray-800"
            : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-600"}`}
            >
              <FileText size={18} />
            </div>
            <h3
              className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Recent Invoices
            </h3>
          </div>

          <CustomButton
            title="Add Invoice"
            icon={Redo}
            onClick={() => {
              NProgress.start();
              navigate("/FIN/SalesTaxInvoice/Index");
            }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={recentInvoices}
          pagination={false}
          scroll={{ x: true }}
          bordered
          className="ant-table-custom"
          rowClassName={() =>
            `hover:bg-purple-50/5 transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
          }
        />
      </Motion.div>

      {/* Party Registration Table */}
      <Motion.div
        variants={itemVariants}
        className={`p-5 rounded-2xl shadow-sm border ${
          isDarkMode
            ? "bg-[#1B172D] border-gray-800"
            : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}
            >
              <Users size={18} />
            </div>
            <h3
              className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Registered Parties
            </h3>
          </div>

          <CustomButton
            title="Add Parties"
            icon={Redo}
            onClick={() => {
              NProgress.start();
              navigate("/CRM/PartyRegistration/Index");
            }}
          />
        </div>

        <Table
          columns={partyColumns}
          dataSource={recentParties}
          pagination={false}
          scroll={{ x: true }}
          bordered
          loading={buyerLoading}
          className="ant-table-custom"
          rowClassName={() =>
            `hover:bg-blue-50/5 transition-colors ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
          }
        />
      </Motion.div>
    </Motion.div>
  );
};

// Helper: Format large numbers nicely (e.g. 1.2M, 45k)
const statusFormatted = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "k";
  return num.toLocaleString();
};

export default InvoiceDashboardPage;
