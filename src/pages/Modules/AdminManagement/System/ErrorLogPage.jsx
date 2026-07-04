import moment from "moment";
import toast from "react-hot-toast";
import { Table, Drawer } from "antd";
import { useEffect, useState } from "react";
import { ExternalLink, X, Calendar, Clock } from "lucide-react";

import { useTheme } from "../../../../ThemeProvider";
import { useGetAuth } from "../../../../hooks/useGetAuth";

import ViewToggle from "../../../../components/ViewToggle";
import Breadcrumb from "../../../../components/common/Breadcrumb";
// Imports End ------------------

const ErrorLogPage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchErrorLogs = async () => {
      try {
        const res = await fetch("/api/DBO/ErrorLog/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
          body: JSON.stringify({}),
        });

        const result = await res.json();

        if (result.data.length > 0) {
          setData(
            result.data.map((item, index) => ({
              key: item.errorLogId || index,
              sr: index + 1,
              actionName: item.actionName || "-",
              controllerName: item.controllerName || "-",
              errorCode: item.errorCode || "-",
              errorMessage: item.errorMessage || "-",
              createdOn: moment(item.createdOn, "DD-MMM-YYYY HH:mmA").format(
                "DD MMM YYYY HH:mmA",
              ),
            })),
          );
        } else {
          setData([]);
          toast.error(result?.message || "No record found.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch error logs");
      } finally {
        setLoading(false);
      }
    };
    fetchErrorLogs();
  }, [loginAccessToken]);

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: 60,
      align: "center",
      className: "text-center font-semibold",
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: "Action Name",
      dataIndex: "actionName",
      key: "actionName",
      className: "font-medium",
      width: 80,
      sorter: (a, b) => a.actionName.localeCompare(b.actionName),
      render: (text) => (
        <span>{text?.length > 13 ? text.substring(0, 13) + "..." : text}</span>
      ),
    },
    {
      title: "Controller Name",
      dataIndex: "controllerName",
      key: "controllerName",
      className: "font-medium",
      width: 90,
      sorter: (a, b) => a.controllerName.localeCompare(b.controllerName),
    },
    {
      title: "Code",
      dataIndex: "errorCode",
      key: "errorCode",
      width: 90,
      className: "text-center",
      sorter: (a, b) => a.errorCode.localeCompare(b.errorCode),
    },
    {
      title: "Error Message",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: true,
      width: 180,
      render: (text) => (
        <span>{text?.length > 45 ? text.substring(0, 45) + "..." : text}</span>
      ),
    },
    {
      title: "Created On",
      dataIndex: "createdOn",
      key: "createdOn",
      width: 140,
      className: "text-center",
      sorter: (a, b) => a.createdOn.localeCompare(b.createdOn),
      render: (text) => {
        const datePart = moment(text, "DD MMM YYYY HH:mmA").format(
          "DD MMM YYYY",
        );
        const timePart = moment(text, "DD MMM YYYY HH:mmA").format("hh:mm A");
        return (
          <div className="flex flex-col items-center justify-center leading-tight py-1">
            <div className="flex items-center gap-1 text-[13px] font-semibold">
              <Calendar size={12} className="text-purple-500" />
              <span>{datePart}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] opacity-60 mt-0.5">
              <Clock size={11} />
              <span>{timePart}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: "center",
      render: (_, record) => (
        <button>
          <ExternalLink
            title="View Details"
            onClick={() => {
              setSelectedLog(record);
              setOpenSidebar(true);
            }}
            className="w-5 h-5 cursor-pointer text-purple-500 hover:text-purple-600 transition"
          />
        </button>
      ),
    },
  ];
  return (
    <>
      <div
        className={`mb-5 flex items-baseline justify-between rounded-lg sm:rounded-full sm:items-center  px-2 sm:px-6 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-50"
        }`}
      >
        <Breadcrumb />
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {viewMode === "table" ? (
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            total: data?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            defaultPageSize: 10,
          }}
          scroll={{ x: true }}
          bordered
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2"
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
          {data.length > 0 ? (
            data.map((item) => (
              <div
                key={item.key}
                className={`relative group rounded-lg p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 border
          ${
            isDarkMode
              ? "bg-gradient-to-br from-[#1a0f24] via-[#221338] to-[#3b1b78] border-[#2e2554]/60 hover:from-[#2a0f46] hover:via-[#3a1e6a] hover:to-[#5423a5]"
              : "bg-white border-gray-200 hover:shadow-lg hover:border-purple-400"
          }
        `}
              >
                <div
                  onClick={() => {
                    setSelectedLog(item);
                    setOpenSidebar(true);
                  }}
                  className={`absolute top-2 right-2 p-2 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ${
                    isDarkMode
                      ? "bg-[#8143ec] text-white hover:bg-[#6a2ddb]"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }
              `}
                >
                  <ExternalLink className="w-4 h-4" />
                </div>

                <div className="mb-1">
                  <h3
                    className={`font-semibold text-lg tracking-wide line-clamp-2 max-w-[350px] ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {item?.actionName}
                  </h3>

                  <h5
                    className={`text-sm mb-2 tracking-wide ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    {item.controllerName}
                  </h5>

                  <p
                    title={item.errorMessage}
                    className={`mb-3 line-clamp-2 max-w-[350px] text-sm ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {item.errorMessage}
                  </p>

                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Code:{" "}
                    <span
                      className={`${
                        isDarkMode ? "text-gray-100" : "text-gray-700"
                      }`}
                    >
                      {item.errorCode}
                    </span>
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-100/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-purple-400" />
                      <span
                        className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {moment(item.createdOn, "DD MMM YYYY HH:mmA").format(
                          "DD MMM YYYY",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-500/10">
                      <Clock size={12} className="text-purple-400" />
                      <span
                        className={`text-[10px] font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {moment(item.createdOn, "DD MMM YYYY HH:mmA").format(
                          "hh:mm A",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10">
              No record found.
            </div>
          )}
        </div>
      )}

      <Drawer
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        placement="right"
        width={400}
        closable={false}
        bodyStyle={{
          backgroundColor: isDarkMode ? "#1a0f24" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
          padding: "0px 16px",
        }}
      >
        <div
          className={`flex justify-between items-center px-2 py-3 ${
            isDarkMode ? "border-[#2e2554]" : "border-gray-200"
          }`}
          style={{
            backgroundColor: isDarkMode ? "#1a0f24" : "#fff",
          }}
        >
          <span
            className={`font-semibold text-lg ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Error Log Details
          </span>
          <button
            onClick={() => setOpenSidebar(false)}
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } hover:text-purple-500 transition`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedLog ? (
          <div className="space-y-5 text-sm mt-3 pl-2">
            <div
              className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              <p className={"font-semibold text-[var(--heading-color)]"}>
                Action Name
              </p>
              <p>{selectedLog.actionName}</p>
            </div>

            <div
              className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              <p className={"font-semibold text-[var(--heading-color)]"}>
                Controller Name
              </p>
              <p>{selectedLog.controllerName}</p>
            </div>

            <div
              className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              <p className={"font-semibold text-[var(--heading-color)]"}>
                Error Code
              </p>
              <p>{selectedLog.errorCode}</p>
            </div>

            <div
              className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              <p className={"font-semibold text-[var(--heading-color)]"}>
                Error Message
              </p>
              <p
                className={`break-words ${
                  isDarkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                {selectedLog?.errorMessage}
              </p>
            </div>

            <div
              className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              <p className={"font-semibold text-[var(--heading-color)] mb-2"}>
                Created On
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}
                >
                  <Calendar size={16} className="text-purple-500" />
                  <span className="font-medium tracking-wide">
                    {moment(selectedLog.createdOn, "DD MMM YYYY HH:mmA").format(
                      "DD MMM YYYY",
                    )}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}
                >
                  <Clock size={16} className="text-purple-500" />
                  <span className="font-medium tracking-wide opacity-80">
                    {moment(selectedLog.createdOn, "DD MMM YYYY HH:mmA").format(
                      "hh:mm A",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No data found.
          </p>
        )}
      </Drawer>
    </>
  );
};

export default ErrorLogPage;
