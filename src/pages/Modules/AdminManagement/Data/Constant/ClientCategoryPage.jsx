import moment from "moment";
import { Table } from "antd";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { useTheme } from "../../../../../ThemeProvider";
import { useGetAuth } from "../../../../../hooks/useGetAuth";
import ViewToggle from "../../../../../components/ViewToggle";
import Breadcrumb from "../../../../../components/common/Breadcrumb";

const ClientCategoryPage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    const fetchControlCategories = async () => {
      try {
        const res = await fetch("/api/ADM/ClientCategory/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
          body: JSON.stringify({}),
        });

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const result = await res.json();

        if (result?.data) {
          setData(
            result.data.map((item, index) => ({
              key: item.clientCategoryId,
              sr: index + 1,
              clientCategoryName: item.clientCategoryName,
              clientCategoryPrefix: item.clientCategoryPrefix,
              createdOn: moment(item.createdOn, "DD-MMM-YYYY").format(
                "DD MMM YYYY",
              ),
            })),
          );
        } else {
          toast.error(result?.message || "No data found");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch control categories");
      } finally {
        setLoading(false);
      }
    };

    fetchControlCategories();
  }, [loginAccessToken]);

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
      title: "Control Category Name",
      dataIndex: "clientCategoryName",
      key: "clientCategoryName",
      width: 500,
      sorter: (a, b) =>
        a.clientCategoryName.localeCompare(b.clientCategoryName),
    },
    {
      title: "Control Category Prefix",
      dataIndex: "clientCategoryPrefix",
      key: "clientCategoryPrefix",
      className: "font-medium",
      width: 200,
      sorter: (a, b) =>
        a.clientCategoryPrefix.localeCompare(b.clientCategoryPrefix),
    },
    {
      title: "Created On",
      dataIndex: "createdOn",
      key: "createdOn",
      width: 120,
      className: "text-center",
      sorter: (a, b) => a.createdOn.localeCompare(b.createdOn),
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
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          rowClassName={() => "hover:bg-gray-50"}
          bordered
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-2">
          {data.map((item) => (
            <div
              key={item.key}
              className={`group rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 border  ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#1a0f24] via-[#221338] to-[#3b1b78] border-[#2e2554]/60 hover:from-[#2a0f46] hover:via-[#3a1e6a] hover:to-[#5423a5]"
                  : "bg-white border-gray-200 hover:shadow-lg hover:border-purple-400"
              }`}
            >
              <div>
                <h3
                  className={`font-semibold text-lg tracking-wide line-clamp-2 max-w-[350px] ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.clientCategoryName}
                </h3>

                <p
                  className={`text-sm mb-2 tracking-wide ${
                    isDarkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  {item.clientCategoryPrefix}
                </p>

                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Created: {item.createdOn}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ClientCategoryPage;
