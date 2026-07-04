/* eslint-disable no-unused-vars */
import dayjs from "dayjs";
import { useMemo } from "react";
import Chart from "react-apexcharts";
import { Table, Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion as Motion } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import {
  MapPin,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  UserCheck,
  Redo,
  Users,
} from "lucide-react";

import { useTheme } from "../../../ThemeProvider";

import { useGetAuth } from "../../../hooks/useGetAuth";
import { useGetRoles } from "../../../hooks/useGetRoles";
import { useGetCurrency } from "../../../hooks/useGetCurrency";
import { useGetLocations } from "../../../hooks/useGetLocations";

import CustomButton from "../../../components/common/CustomButton";
// Imports End----

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  isTrendUp,
  delay,
  isDarkMode,
}) => (
  <Motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5 }}
    className={`p-6 rounded-2xl border transition-all duration-300 ${
      isDarkMode
        ? "bg-[#141025] border-[#2a2738] hover:border-purple-500/50"
        : "bg-white border-gray-100 shadow-sm hover:shadow-md"
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div
        className={`p-3 rounded-xl ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}
      >
        <Icon
          className={isDarkMode ? "text-purple-400" : "text-purple-600"}
          size={24}
        />
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

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  // Fetch Admin Module Data
  const { data: locations = [], isLoading: locationsLoading } =
    useGetLocations();
  const { data: currencies = [], isLoading: currencyLoading } =
    useGetCurrency();
  const { data: roles = [], isLoading: rolesLoading } = useGetRoles();

  const { data: userList = [], isLoading: userListLoading } = useQuery({
    queryKey: ["userList", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/User/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      return Array.isArray(result?.data) ? result.data : [];
    },
    enabled: !!loginAccessToken,

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Aggregate User Registration Data for Chart
  const userTrendData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = dayjs().month();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      last6Months.push({ name: months[m], value: 0, index: m });
    }

    userList.forEach((user) => {
      if (user.createdOn) {
        const userMonth = dayjs(user.createdOn).month();
        const match = last6Months.find((m) => m.index === userMonth);
        if (match) {
          match.value += 1;
        }
      }
    });

    return {
      categories: last6Months.map((m) => m.name),
      series: [{ name: "New Users", data: last6Months.map((m) => m.value) }],
    };
  }, [userList]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        id: "user-trend-chart",
        toolbar: { show: false },
        fontFamily: "'Outfit', sans-serif",
      },
      colors: ["#a855f7"],
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100],
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: isDarkMode ? "#2a2738" : "#f1f1f1",
        strokeDashArray: 4,
      },
      xaxis: {
        categories: userTrendData.categories,
        labels: {
          style: { colors: isDarkMode ? "#a9a0c1" : "#64748b" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: isDarkMode ? "#a9a0c1" : "#64748b" },
        },
      },
      tooltip: {
        theme: isDarkMode ? "dark" : "light",
      },
    }),
    [isDarkMode, userTrendData.categories],
  );

  return (
    <div className="p-6 max-w-400 mx-auto space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Admin Dashboard
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-sm mt-1 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Centralized Control & System Monitoring
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
          title="Registered Users"
          value={userListLoading ? "..." : userList.length}
          icon={UserCheck}
          trend="+2.1%"
          isTrendUp={true}
          delay={0.1}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total Locations"
          value={locationsLoading ? "..." : locations.length}
          icon={MapPin}
          trend="+0.8%"
          isTrendUp={true}
          delay={0.2}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Active Currencies"
          value={currencyLoading ? "..." : currencies.length}
          icon={Coins}
          trend="+0.4%"
          isTrendUp={true}
          delay={0.3}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-2xl border ${
            isDarkMode
              ? "bg-[#141025] border-[#2a2738]"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h3
              className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              User Registration Trends
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500">
              Last 6 Months
            </span>
          </div>
          <Chart
            options={chartOptions}
            series={userTrendData.series}
            type="area"
            height={350}
          />
        </Motion.div>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
            <span className="text-xs font-black uppercase tracking-widest text-purple-500">
              Shortcuts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/ADM/User/Index")}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
                  : "bg-purple-50 border-purple-100 hover:bg-purple-100"
              }`}
            >
              <Users
                className={`mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                size={20}
              />
              <p
                className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
              >
                Add User
              </p>
              <p className="text-xs text-gray-500 mt-1">Register new user</p>
            </button>
            <button
              onClick={() => navigate("/ADM/Role/Index")}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-amber-50 border-amber-100 hover:bg-amber-100"
              }`}
            >
              <UserCheck
                className={`mb-2 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                size={20}
              />
              <p
                className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
              >
                Manage Roles
              </p>
              <p className="text-xs text-gray-500 mt-1">Configure access</p>
            </button>
            <button
              onClick={() => navigate("/ADM/LocationConfig/Index")}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20"
                  : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
              }`}
            >
              <MapPin
                className={`mb-2 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                size={20}
              />
              <p
                className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
              >
                Locations
              </p>
              <p className="text-xs text-gray-500 mt-1">Setup locations</p>
            </button>
            <button
              onClick={() => navigate("/ADM/Currency/Index")}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                  : "bg-green-50 border-green-100 hover:bg-green-100"
              }`}
            >
              <Coins
                className={`mb-2 ${isDarkMode ? "text-green-400" : "text-green-600"}`}
                size={20}
              />
              <p
                className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
              >
                Currencies
              </p>
              <p className="text-xs text-gray-500 mt-1">Manage currencies</p>
            </button>
          </div>
        </Motion.div>

        {/* System Health */}
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
              System Overview
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-500 uppercase">
                Operational
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}
            >
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                Access Roles
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {rolesLoading ? "..." : roles.length}
                </span>
                <span className="text-[10px] text-purple-500 font-bold">
                  Configured
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(roles.length * 5, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* Registered Users Table */}
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
              <Users size={18} />
            </div>
            <h3
              className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Registered Users
            </h3>
          </div>

          <CustomButton
            title="Add User"
            icon={Redo}
            onClick={() => navigate("/ADM/User/Index")}
          />
        </div>

        <Table
          dataSource={userList.slice(0, 5)}
          pagination={false}
          rowKey="userId"
          bordered
          loading={userListLoading}
          className={`custom-dashboard-table ${isDarkMode ? "dark-table" : ""}`}
          columns={[
            {
              title: "User",
              dataIndex: "appUserName",
              key: "user",
              render: (text, record) => (
                <div className="flex items-center gap-3">
                  <Avatar
                    src={record.userImageURL || null}
                    className="bg-purple-100 text-purple-600 font-bold"
                  >
                    {text?.charAt(0)}
                  </Avatar>
                  <div>
                    <p
                      className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                    >
                      {text}
                    </p>
                    <p className="text-xs text-gray-500">{record.userEmail}</p>
                  </div>
                </div>
              ),
            },
            {
              title: "Login ID",
              dataIndex: "loginId",
              key: "loginId",
              render: (id) => (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-md ${isDarkMode ? "bg-white/5 text-purple-400" : "bg-purple-50 text-purple-600"}`}
                >
                  {id}
                </span>
              ),
            },
            {
              title: "Created On",
              dataIndex: "createdOn",
              key: "createdOn",
              render: (date) => (
                <span className="text-xs text-gray-500 font-medium">
                  {dayjs(date).format("MMM DD, YYYY")}
                </span>
              ),
            },
          ]}
        />
      </Motion.div>
    </div>
  );
};

export default AdminDashboardPage;
