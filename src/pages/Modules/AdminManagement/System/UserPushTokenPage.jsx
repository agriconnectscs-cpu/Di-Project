import dayjs from "dayjs";
import { Table } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import { Send, Bell } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../../../../ThemeProvider";
import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../components/SearchBar";
import CustomInput from "../../../../components/CustomInput";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import ModalActionButtons from "../../../../components/ModalActionButtons";
// Imports End----

const UserPushTokenPage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [globalSearch, setGlobalSearch] = useState("");

  const [sendMessageModal, setSendMessageModal] = useState(false);
  const [msgData, setMsgData] = useState({ token: "", title: "", body: "" });

  // Get User Push Token List
  const {
    data: userPushTokenList = [],
    isLoading: userPushTokenListIsLoading,
  } = useQuery({
    queryKey: ["userPushTokenList", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/UserPushToken/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result?.message || "Failed to fetch push tokens");

      return (result.data || []).map((item, index) => ({
        ...item,
        key: item.userPushTokenId,
        sr: index + 1,
      }));
    },

    onError: (error) => {
      toast.error(error.message);
    },

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Send Message Mutation
  const { mutate: sendMessage, isPending: isSendingMessage } = useMutation({
    mutationFn: async (payload) => {
      const params = new URLSearchParams({
        token: payload.token,
        title: payload.title,
        body: payload.body,
      });
      const res = await fetch(
        `/api/ADM/UserPushToken/SendMessage?${params.toString()}`,
        {
          method: "POST",
          headers: {
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
    onSuccess: () => {
      toast.success("Message sent successfully");
      handleCloseMsgModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleOpenMsgModal = (token) => {
    setMsgData({ token, title: "", body: "" });
    setSendMessageModal(true);
  };

  const handleCloseMsgModal = () => {
    setSendMessageModal(false);
    setMsgData({ token: "", title: "", body: "" });
  };

  useCloseOnEscape(sendMessageModal, handleCloseMsgModal);

  // Filtered Data
  const filteredData = userPushTokenList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.appUserName?.toLowerCase().includes(search) ||
      item.loginId?.toLowerCase().includes(search) ||
      item.deviceId?.toLowerCase().includes(search) ||
      item.token?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: 60,
      className: "text-center font-semibold",
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: "User",
      dataIndex: "appUserName",
      key: "appUserName",
      width: 150,
      sorter: (a, b) =>
        (a.appUserName || "").localeCompare(b.appUserName || ""),
    },
    {
      title: "Login ID",
      dataIndex: "loginId",
      key: "loginId",
      width: 120,
      sorter: (a, b) => (a.loginId || "").localeCompare(b.loginId || ""),
    },
    {
      title: "Device ID",
      dataIndex: "deviceId",
      key: "deviceId",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 100,
      render: (platform) => {
        const configs = {
          web: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            color: "text-blue-400",
          },
          ios: {
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            color: "text-purple-400",
          },
          android: {
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            color: "text-emerald-400",
          },
          default: {
            bg: "bg-gray-500/10",
            border: "border-gray-500/20",
            color: "text-gray-400",
          },
        };
        const style = configs[platform?.toLowerCase()] || configs.default;
        return (
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold border ${style.bg} ${style.border} ${style.color} uppercase tracking-wider`}
            >
              {platform}
            </div>
          </div>
        );
      },
      sorter: (a, b) => (a.platform || "").localeCompare(b.platform || ""),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      render: (isActive) => (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-300 ${
            isActive
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          ></span>
          {isActive ? "Active" : "Inactive"}
        </div>
      ),
      sorter: (a, b) => a.isActive - b.isActive,
    },
    {
      title: "Last Modified On",
      dataIndex: "lastModifiedOn",
      key: "lastModifiedOn",
      width: 150,
      render: (date) =>
        date ? dayjs(date).format("DD MMM, YYYY hh:mm a") : "-",
      sorter: (a, b) =>
        dayjs(a.lastModifiedOn).unix() - dayjs(b.lastModifiedOn).unix(),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <button
          onClick={() => handleOpenMsgModal(record.token)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
            isDarkMode
              ? "bg-[#1b122b] border-[#8143ec]/30 text-[#c084fc] hover:bg-[#8143ec] hover:text-white"
              : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white"
          }`}
        >
          <Send size={14} />
          Send Message
        </button>
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      <Table
        loading={userPushTokenListIsLoading}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: true }}
        bordered
        rowClassName={() =>
          "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2 cursor-pointer"
        }
        pagination={{
          total: filteredData?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "500"],
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
              placeholder="Search Tokens..."
            />
          </div>
        )}
      />

      <AnimatePresence>
        {sendMessageModal && (
          <Motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Motion.div
              className={`w-full max-w-xl max-h-[90vh] overflow-y-auto py-6 px-7 rounded-2xl shadow-xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#0D0C1A] text-gray-200"
                  : "bg-white text-gray-800"
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <h2 className="text-xl font-bold flex items-center gap-3 mb-6 text-[var(--secondary-color)]">
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? "bg-purple-500/10" : "bg-purple-50"}`}
                >
                  <Bell size={22} className="text-[var(--secondary-color)]" />
                </div>
                Send Push Notification
              </h2>

              {/* Form */}
              <div className="flex flex-col gap-5">
                <CustomInput
                  id="msgTitle"
                  label="Notification Title"
                  required
                  placeholder="Enter catch title..."
                  value={msgData.title}
                  onChange={(e) =>
                    setMsgData({ ...msgData, title: e.target.value })
                  }
                />

                <CustomInput
                  id="msgBody"
                  label="Notification Body"
                  type="textarea"
                  placeholder="Type your message here..."
                  rows={4}
                  required
                  value={msgData.body}
                  onChange={(e) =>
                    setMsgData({ ...msgData, body: e.target.value })
                  }
                />
              </div>

              {/* Info text */}
              <p
                className={`mt-4 text-[11px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Recipient Token:{" "}
                <span className="font-mono opacity-80">
                  {msgData.token?.substring(0, 30)}...
                </span>
              </p>

              <ModalActionButtons
                onCancel={handleCloseMsgModal}
                onSubmit={() => sendMessage(msgData)}
                isDarkMode={isDarkMode}
                isSubmitting={isSendingMessage}
                isDisabled={!msgData.title?.trim() || !msgData.body?.trim()}
                submitText="Send Notification"
                icon={<Send size={18} />}
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserPushTokenPage;
