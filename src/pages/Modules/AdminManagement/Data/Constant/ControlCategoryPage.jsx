import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../../hooks/useGlobalFilter";

import { useTheme } from "../../../../../ThemeProvider";
import { handleApiResponse } from "../../../../../utils/handleApiResponse";

import CustomTable from "../../../../../components/CustomTable";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
// Imports End------

const ControlCategoryPage = () => {
  const { isDarkMode } = useTheme();
  const [globalSearch, setGlobalSearch] = useState("");
  const { loginAccessToken } = useGetAuth();

  const {
    data: itemList = [],
    isLoading: listLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["controlCategories"],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/ADM/ControlCategory/GetList", {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(
        res,
        "Failed to fetch control categories",
      );

      return result.data || [];
    },
    select: (data) =>
      data?.map((item, i) => ({
        ...item,
        key: item.controlCategoryId,
        sr: i + 1,
      })) || [],

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
      title: "Control Type",
      dataIndex: "controlTypeName",
      key: "controlTypeName",
      className: "font-medium",
      sorter: (a, b) => a.controlTypeName.localeCompare(b.controlTypeName),
    },
    {
      title: "Control Category",
      dataIndex: "controlCategoryName",
      key: "controlCategoryName",
      className: "font-medium",
      sorter: (a, b) =>
        a.controlCategoryName.localeCompare(b.controlCategoryName),
    },
    {
      title: "Control Prefix",
      dataIndex: "controlCategoryPrefix",
      key: "controlCategoryPrefix",
      className: "font-medium",
      sorter: (a, b) =>
        a.controlCategoryPrefix.localeCompare(b.controlCategoryPrefix),
    },
    {
      title: "Sequence No",
      dataIndex: "controlCategorySeqNo",
      key: "controlCategorySeqNo",
      width: 120,
      className: "text-center",
    },
  ];

  const filteredData = useGlobalFilter(itemList, globalSearch, [
    "controlTypeName",
    "controlCategoryName",
    "controlCategoryPrefix",
  ]);

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      <CustomTable
        loading={listLoading}
        columns={columns}
        dataSource={filteredData}
        isDarkMode={isDarkMode}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search Control Category..."
        isError={isError}
        error={error}
      />
    </>
  );
};

export default ControlCategoryPage;
