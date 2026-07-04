import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice";

import { useGetAuth } from "../../hooks/useGetAuth";
import { useSidebar } from "../../context/SidebarContext";
import { handleApiResponse } from "../../utils/handleApiResponse";
// Imports End-----

const NotificationDropdown = ({ isOpen, onClose, onToggle, isDarkMode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const { loginAccessToken } = useGetAuth();

  const authData = useSelector(selectUser);
  const receiverUserId = authData?.data?.loginAppUserId || "";

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["unread_notifications", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      if (!receiverUserId) return [];

      const res = await fetch(
        `/api/ADM/NotificationQueue/GetUnreadByReceiverUserId?ReceiverUserId=${receiverUserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );

      const result = await handleApiResponse(res);
      return result?.data || [];
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 15000, // Auto fetch every 15 seconds
  });

  const {
    mutate: markAsRead,
    isPending: isMarkingRead,
    variables: markingReadId,
  } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(
        `/api/ADM/NotificationQueue/UpdateReadById?Id=${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return await handleApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all_notifications"]);
      queryClient.invalidateQueries(["unread_notifications"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark as read");
    },
  });

  const { mutateAsync: markAllRead, isPending: isMarkingAllRead } = useMutation(
    {
      mutationFn: async () => {
        if (!receiverUserId) throw new Error("User ID not found");

        const res = await fetch(
          `/api/ADM/NotificationQueue/UpdateReadAllByReceiverUserId?ReceiverUserId=${receiverUserId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${loginAccessToken}`,
            },
          },
        );
        return await handleApiResponse(res);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["all_notifications"]);
        queryClient.invalidateQueries(["unread_notifications"]);
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to mark all as read");
      },
    },
  );

  const handleMarkAllRead = async () => {
    if (!notifications.length) return;
    try {
      await markAllRead();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.notificationQueueId);
    if (notif.actionUrl) {
      const baseUrl = window.location.origin;
      const targetUrl = notif.actionUrl.startsWith("/")
        ? `${baseUrl}${notif.actionUrl}`
        : `${baseUrl}/${notif.actionUrl}`;
      window.location.href = targetUrl;
    }
  };

  const sortedNotifications = Array.isArray(notifications)
    ? [...notifications].sort(
        (a, b) => dayjs(b.createdOn).unix() - dayjs(a.createdOn).unix(),
      )
    : [];

  const preview = sortedNotifications.slice(0, 3);
  const totalCount = sortedNotifications.length;

  return (
    <div className="relative notif-dropdown-container">
      {/* Bell Button */}
      <button
        onClick={() => {
          if (isMobile) {
            navigate("/Notification");
          } else {
            onToggle();
          }
        }}
        aria-label="Notifications"
        title="Notifications"
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
          isOpen
            ? "bg-purple-500/20 text-purple-400"
            : isDarkMode
              ? "text-gray-400 hover:bg-white/10 hover:text-purple-400"
              : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
        }`}
      >
        <Bell size={18} />
        {totalCount > 0 && (
          <span
            className={`absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white border-2 transform translate-x-1/2 -translate-y-1/2 ${
              isDarkMode ? "border-[#1a1428]" : "border-white"
            }`}
          >
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown - Desktop Only */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={onClose} />

              <Motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className={`absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 rounded-xl shadow-2xl z-50 border overflow-hidden ${
                  isDarkMode
                    ? "bg-[#1a1428] border-white/10 shadow-black/50"
                    : "bg-white border-gray-200 shadow-gray-200/50"
                }`}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDarkMode ? "border-white/5" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-purple-400" />
                    <p
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Notifications
                    </p>

                    {totalCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {totalCount}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleMarkAllRead}
                    disabled={notifications.length === 0 || isMarkingAllRead}
                    className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-purple-400"
                        : "text-gray-500 hover:text-purple-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <CheckCheck size={12} />
                    {isMarkingAllRead ? "Marking..." : "Mark all read"}
                  </button>
                </div>

                {/* Body */}
                <div
                  className="overflow-y-auto max-h-[320px]"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {isLoading ? (
                    <div
                      className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-gray-100"}`}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-3 px-4 py-3">
                          <div className="shrink-0 mt-0.5">
                            <div
                              className={`w-8 h-8 rounded-full animate-pulse ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5 mt-1">
                            <div
                              className={`h-3 w-3/4 rounded animate-pulse ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}
                            />
                            <div
                              className={`h-2.5 w-full rounded animate-pulse ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}
                            />
                            <div
                              className={`h-2.5 w-5/6 rounded animate-pulse ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : preview.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell
                        size={28}
                        className={`${
                          isDarkMode ? "text-gray-600" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        No notifications
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`divide-y ${
                        isDarkMode ? "divide-white/5" : "divide-gray-100"
                      }`}
                    >
                      {preview.map((notif) => (
                        <div
                          key={notif.notificationQueueId}
                          className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isDarkMode
                              ? "hover:bg-purple-500/5"
                              : "hover:bg-purple-50/50"
                          }`}
                        >
                          {/* Avatar icon */}
                          <div className="shrink-0 mt-0.5">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                                isDarkMode
                                  ? "bg-purple-500/15"
                                  : "bg-purple-100"
                              }`}
                            >
                              {notif.senderUserImageURL ? (
                                <img
                                  src={notif.senderUserImageURL}
                                  alt="Sender"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }
                                  }}
                                />
                              ) : null}
                              <Bell
                                size={14}
                                className="text-purple-400"
                                style={{
                                  display: notif.senderUserImageURL
                                    ? "none"
                                    : "block",
                                }}
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => {
                              handleNotificationClick(notif);
                            }}
                          >
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                              >
                                {notif.senderUserName ||
                                  notif.senderUserId ||
                                  "System"}
                              </span>

                              {notif.createdOn && (
                                <span
                                  className={`text-[9px] opacity-60 ml-auto whitespace-nowrap ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {dayjs(notif.createdOn).fromNow()}
                                </span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.notificationQueueId);
                                }}
                                disabled={
                                  isMarkingRead &&
                                  markingReadId === notif.notificationQueueId
                                }
                                className={`shrink-0 text-[10px] font-medium flex items-center gap-1 transition-colors ${
                                  isDarkMode
                                    ? "text-gray-400 hover:text-purple-400"
                                    : "text-gray-500 hover:text-purple-600"
                                } ${isMarkingRead && markingReadId === notif.notificationQueueId ? "opacity-50 cursor-not-allowed" : ""}`}
                                title="Mark as read"
                              >
                                <CheckCheck size={12} />
                                {isMarkingRead &&
                                markingReadId === notif.notificationQueueId
                                  ? "Marking..."
                                  : "Mark read"}
                              </button>
                            </div>

                            <p
                              className={`text-xs font-semibold truncate ${
                                isDarkMode ? "text-gray-100" : "text-gray-800"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 line-clamp-2 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {notif.messageText}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View All */}
                <div
                  className={`px-4 py-3 border-t ${
                    isDarkMode ? "border-white/5" : "border-gray-100"
                  }`}
                >
                  <button
                    onClick={() => {
                      navigate("/Notification");
                      onClose();
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isDarkMode
                        ? "bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 border border-purple-500/20"
                        : "bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
                    }`}
                  >
                    View All Notifications
                    {totalCount > 4 && (
                      <span className="ml-1 opacity-60">
                        (+{totalCount - 4} more)
                      </span>
                    )}
                  </button>
                </div>
              </Motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default NotificationDropdown;
