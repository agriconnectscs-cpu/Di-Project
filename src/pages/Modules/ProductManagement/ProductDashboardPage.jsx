import dayjs from "dayjs";
import { Table } from "antd";
import { useMemo } from "react";
import Chart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import {
  Package,
  Layers,
  LayoutGrid,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  Tag as TagIcon,
  Settings,
  Redo,
  Ruler,
  Palette,
} from "lucide-react";

import { useTheme } from "../../../ThemeProvider";
import CustomButton from "../../../components/common/CustomButton";

import { useGetProducts } from "../../../hooks/useGetProducts";
import { useGetProductCategories } from "../../../hooks/useGetProductCategories";
import { useGetProductSubCategories } from "../../../hooks/useGetProductSubCategories";
// Imports End----

const StatCard = ({
  title,
  value,
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  trend,
  isTrendUp,
  delay,
  color,
}) => {
  const { isDarkMode } = useTheme();

  const colorMap = {
    purple: {
      bg: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      border: isDarkMode
        ? "border-[#2a2738] hover:border-purple-500/50"
        : "border-gray-100 hover:border-purple-200",
      text: isDarkMode ? "text-purple-400" : "text-purple-600",
    },
    blue: {
      bg: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
      border: isDarkMode
        ? "border-[#2a2738] hover:border-blue-500/50"
        : "border-gray-100 hover:border-blue-200",
      text: isDarkMode ? "text-blue-400" : "text-blue-600",
    },
    emerald: {
      bg: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
      border: isDarkMode
        ? "border-[#2a2738] hover:border-emerald-500/50"
        : "border-gray-100 hover:border-emerald-200",
      text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
    },
    amber: {
      bg: isDarkMode ? "bg-amber-500/10" : "bg-amber-50",
      border: isDarkMode
        ? "border-[#2a2738] hover:border-amber-500/50"
        : "border-gray-100 hover:border-amber-200",
      text: isDarkMode ? "text-amber-400" : "text-amber-600",
    },
    rose: {
      bg: isDarkMode ? "bg-rose-500/10" : "bg-rose-50",
      border: isDarkMode
        ? "border-[#2a2738] hover:border-rose-500/50"
        : "border-gray-100 hover:border-rose-200",
      text: isDarkMode ? "text-rose-400" : "text-rose-600",
    },
  };

  const colors = colorMap[color] || colorMap.purple;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl border transition-all duration-300 ${colors.border} ${
        isDarkMode ? "bg-[#141025]" : "bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={colors.text} size={24} />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              isTrendUp
                ? "text-emerald-500 bg-emerald-500/10"
                : "text-rose-500 bg-rose-500/10"
            }`}
          >
            {isTrendUp ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {trend}
          </div>
        )}
      </div>

      <h3
        className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {title}
      </h3>

      <div
        className={`text-2xl font-black mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </div>
    </Motion.div>
  );
};

const ProductDashboardPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Fetch API Data
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetProductCategories();
  const { data: subcategories = [], isLoading: subLoading } =
    useGetProductSubCategories();

  const { chartOptions, categoryDistributionData } = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const catName = p.productCategoryName || "Uncategorized";
      counts[catName] = (counts[catName] || 0) + 1;
    });

    const sortedCats = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    const data = {
      labels: sortedCats.map(([name]) => name),
      series: sortedCats.map(([, count]) => count),
    };

    const options = {
      chart: {
        id: "category-distribution-chart",
        toolbar: { show: false },
        fontFamily: "'Outfit', sans-serif",
      },
      labels: data.labels,
      colors: [
        "#a855f7",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#6366f1",
        "#ec4899",
      ],
      stroke: { show: false },
      legend: {
        position: "bottom",
        labels: { colors: isDarkMode ? "#a9a0c1" : "#64748b" },
      },
      dataLabels: { enabled: true },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Products",
                color: isDarkMode ? "#ffffff" : "#1e293b",
                formatter: () => products.length,
              },
            },
          },
        },
      },
      tooltip: {
        theme: isDarkMode ? "dark" : "light",
      },
    };

    return { chartOptions: options, categoryDistributionData: data };
  }, [products, isDarkMode]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Product Dashboard
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-sm mt-1 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Inventory Insights & Catalog Management
          </Motion.p>
        </div>
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
              isDarkMode
                ? "bg-[#141025] border-[#2a2738] text-gray-300"
                : "bg-white border-gray-100 text-gray-700 shadow-sm"
            }`}
          >
            <Calendar size={18} className="text-purple-500" />
            <span className="text-sm font-bold">
              {dayjs().format("MMM DD, YYYY")}
            </span>
          </div>
        </Motion.div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Categories"
          value={categoriesLoading ? "..." : categories.length}
          icon={Layers}
          trend="+2"
          isTrendUp={true}
          delay={0.1}
          color="blue"
        />
        <StatCard
          title="Sub-Categories"
          value={subLoading ? "..." : subcategories.length}
          icon={LayoutGrid}
          trend="+5"
          isTrendUp={true}
          delay={0.2}
          color="emerald"
        />
        <StatCard
          title="Total Products"
          value={productsLoading ? "..." : products.length}
          icon={Package}
          trend="+12"
          isTrendUp={true}
          delay={0.3}
          color="purple"
        />
      </div>

      {/* Charts Section & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Chart */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`lg:col-span-2 p-6 rounded-2xl border ${
            isDarkMode
              ? "bg-[#141025] border-[#2a2738]"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h3
              className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Top Categories Distribution
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500">
              Inventory Share
            </span>
          </div>
          <div className="min-h-[350px] flex items-center justify-center">
            {productsLoading ? (
              <div className="text-gray-500">Loading catalog data...</div>
            ) : (
              <Chart
                options={chartOptions}
                series={categoryDistributionData.series}
                type="donut"
                width="100%"
                height={350}
              />
            )}
          </div>
        </Motion.div>

        {/* Quick Actions */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-6 rounded-2xl border ${
            isDarkMode
              ? "bg-[#141025] border-[#2a2738]"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Quick Actions
            </h3>
            <Settings size={18} className="text-gray-500" />
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Add Category",
                icon: TagIcon,
                path: "/ISPM/ProductCategory/Index",
                color: "blue",
              },
              {
                label: "Add Sub Category",
                icon: LayoutGrid,
                path: "/ISPM/ProductSubCategory/Index",
                color: "emerald",
              },
              {
                label: "New Product",
                icon: Plus,
                path: "/ISPM/ProductRegV1/Index",
                color: "purple",
              },
              {
                label: "Add Unit",
                icon: Ruler,
                path: "/ISPM/Unit/Index",
                color: "amber",
              },
              {
                label: "Add Color",
                icon: Palette,
                path: "/ISPM/Color/Index",
                color: "rose",
              },
            ].map((action, idx) => {
              const actionColorMap = {
                purple: isDarkMode
                  ? "bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/10"
                  : "bg-purple-50 border-purple-100 hover:bg-purple-100",
                blue: isDarkMode
                  ? "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10"
                  : "bg-blue-50 border-blue-100 hover:bg-blue-100",
                emerald: isDarkMode
                  ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10"
                  : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100",
                rose: isDarkMode
                  ? "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
                  : "bg-rose-50 border-rose-100 hover:bg-rose-100",
                amber: isDarkMode
                  ? "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10"
                  : "bg-amber-50 border-amber-100 hover:bg-amber-100",
              };
              const iconColorMap = {
                purple: isDarkMode
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white text-purple-600",
                blue: isDarkMode
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white text-blue-600",
                emerald: isDarkMode
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white text-emerald-600",
                rose: isDarkMode
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-white text-rose-600",
                amber: isDarkMode
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white text-amber-600",
              };

              return (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${actionColorMap[action.color]}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${iconColorMap[action.color]}`}
                    >
                      <action.icon size={18} />
                    </div>
                    <span
                      className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                    >
                      {action.label}
                    </span>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-400" />
                </button>
              );
            })}
          </div>
        </Motion.div>
      </div>

      {/* Recent Products Table */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`p-6 rounded-2xl border ${
          isDarkMode
            ? "bg-[#141025] border-[#2a2738]"
            : "bg-white border-gray-100 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-600"}`}
            >
              <Package size={18} />
            </div>
            <h3
              className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Recently Added Products
            </h3>
          </div>

          <CustomButton
            title="Add Product"
            icon={Redo}
            onClick={() => navigate("/ISPM/ProductRegV1/Index")}
          />
        </div>

        <Table
          dataSource={products.slice(0, 5)}
          pagination={false}
          rowKey="productId"
          bordered
          scroll={{ x: true }}
          loading={productsLoading}
          className={`custom-dashboard-table ${isDarkMode ? "dark-table" : ""}`}
          columns={[
            {
              title: "Sr.",
              key: "sr",
              width: 60,
              align: "center",
              render: (_, __, index) => (
                <span
                  className={`text-xs font-bold ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              ),
            },
            {
              title: "Product Name",
              dataIndex: "productName",
              key: "product",
              render: (text, record) => (
                <div className="flex items-center gap-3">
                  <div>
                    <p
                      className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                    >
                      {text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.productCode}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              title: "Category",
              dataIndex: "productCategoryName",
              key: "category",
              render: (cat) => (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md ${
                    isDarkMode
                      ? "bg-white/5 text-purple-400"
                      : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {cat || "General"}
                </span>
              ),
            },
            {
              title: "Sub Category",
              dataIndex: "productSubCategoryName",
              key: "subcategory",
              render: (sub) => (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md ${
                    isDarkMode
                      ? "bg-white/5 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {sub || "Standard"}
                </span>
              ),
            },
            {
              title: "HS Code",
              dataIndex: "productRefNo",
              key: "hsCode",
              width: 120,
              align: "center",
              render: (text) => (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md ${
                    isDarkMode
                      ? "bg-white/5 text-emerald-400"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {text || "-"}
                </span>
              ),
            },
          ]}
        />
      </Motion.div>
    </div>
  );
};

export default ProductDashboardPage;
