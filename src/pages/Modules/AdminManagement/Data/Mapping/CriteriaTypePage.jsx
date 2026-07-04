import moment from "moment";
import { Table } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "../../../../../ThemeProvider";
import { useGetAuth } from "../../../../../hooks/useGetAuth";

import SearchBar from "../../../../../components/SearchBar";
import ViewToggle from "../../../../../components/ViewToggle";
import Breadcrumb from "../../../../../components/common/Breadcrumb";

const CriteriaTypePage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [viewMode, setViewMode] = useState("table");
  const [globalSearch, setGlobalSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["CriteriaTypeList", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/CriteriaType/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await res.json();

      if (!result.data || !Array.isArray(result.data)) return [];

      return result.data.map((item, index) => ({
        key: item.criteriaTypeId || index,
        sr: index + 1,
        criteriaTypeName: item.criteriaTypeName,
        criteriaTypePrefix: item.criteriaTypePrefix,
        createdOn: moment(item.createdOn, "DD-MMM-YYYY").format("DD MMM YYYY"),
      }));
    },
    onError: () => {
      toast.error("Failed to fetch document movement data");
    },

    refetchOnWindowFocus: false,
  });

  // Search Filter
  const filteredData = data?.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.criteriaTypeName?.toLowerCase().includes(search) ||
      item.criteriaTypePrefix?.toLowerCase().includes(search) ||
      item.createdOn?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: 80,
      className: "text-center font-semibold",
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: "Criteria Type Name",
      dataIndex: "criteriaTypeName",
      key: "criteriaTypeName",
      width: 500,
      sorter: (a, b) => a.criteriaTypeName.localeCompare(b.criteriaTypeName),
    },
    {
      title: "Criteria Type Prefix",
      dataIndex: "criteriaTypePrefix",
      key: "criteriaTypePrefix",
      width: 150,
      sorter: (a, b) =>
        a.criteriaTypePrefix.localeCompare(b.criteriaTypePrefix),
    },
    {
      title: "Created On",
      dataIndex: "createdOn",
      key: "createdOn",
      width: 150,
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
          loading={isLoading}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          bordered
          rowClassName={() => "hover:bg-gray-50"}
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
                placeholder="Search Criteria Type..."
              />
            </div>
          )}
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
                  className={`font-semibold text-md tracking-wide line-clamp-2 max-w-[350px] ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.criteriaTypeName}
                </h3>

                <p
                  className={`text-sm mb-2 tracking-wide ${
                    isDarkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  Prefix: {item.criteriaTypePrefix}
                </p>

                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Created:{" "}
                  <span
                    className={
                      "text-sm font-medium text-[var(--heading-color)] "
                    }
                  >
                    {item.createdOn}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CriteriaTypePage;
