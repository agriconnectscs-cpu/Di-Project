/* eslint-disable react-hooks/exhaustive-deps */
import toast from "react-hot-toast";
import { Table, Checkbox } from "antd";
import { useState, useEffect } from "react";
import { Save, Loader } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import SearchBar from "../../../../../components/SearchBar";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { handleApiResponse } from "../../../../../utils/handleApiResponse";
// Imports End---

const BuyerProductsTab = ({ location, isDarkMode, isActive }) => {
  const queryClient = useQueryClient();
  const { loginAccessToken } = useGetAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [editableRows, setEditableRows] = useState([]);

  // Fetch Products for this Location
  const { data: productsResult, isLoading: productsLoading } = useQuery({
    queryKey: ["buyerLocationProducts", location?.partyLocationId, isActive],
    queryFn: async () => {
      const res = await fetch(
        `/api/CRM/BuyerLocation/GetDetailForProduct?PartyLocationId=${location?.partyLocationId}`,
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return await handleApiResponse(res);
    },
    enabled: isActive && !!location?.partyLocationId && !!loginAccessToken,
    onSuccess: (res) => {
      setEditableRows(res?.data || []);
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const productsData = productsResult?.data || [];

  // Sync table rows when data loads
  useEffect(() => {
    if (productsData.length > 0) {
      setEditableRows(productsData.map((r) => ({ ...r, _key: r.productId })));
    }
  }, [productsData]);

  const { mutate: saveProducts, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/CRM/BuyerLocationProduct/SaveAll`, {
        method: "POST",
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(payload),
      });

      return await handleApiResponse(res, "Failed to save products");
    },

    onSuccess: (res) => {
      toast.success(res?.message || "Products updated successfully");
      queryClient.invalidateQueries([
        "buyerLocationProducts",
        location?.partyLocationId,
      ]);
    },

    onError: (error) => toast.error(error.message),
  });

  const handleSave = () => {
    const checkedRows = editableRows.filter((r) => r.isChecked);
    const unCheckedRows = editableRows.filter(
      (r) => !r.isChecked && (r.partyLocationProductId || 0) > 0,
    );

    const mapRow = (r, activeStatus) => ({
      partyLocationProductId: r.partyLocationProductId || 0,
      partyLocationId: r.partyLocationId || location?.partyLocationId,
      productId: r.productId,
      isActive: activeStatus,
      productName: r.productName || "",
      productCategoryName: r.productCategoryName || "",
      productSubCategoryName: r.productSubCategoryName || "",
      productUnitShortName: r.productUnitShortName || "",
      rowVersionLong: r.rowVersionLong || 0,
    });

    const payload = {
      lstRequest: checkedRows.map((r) => mapRow(r, true)),
      lstDeletedRequest: unCheckedRows.map((r) => mapRow(r, false)),
    };

    if (
      payload.lstRequest.length === 0 &&
      payload.lstDeletedRequest.length === 0
    ) {
      toast.error("No changes to save");
      return;
    }

    saveProducts(payload);
  };

  const toggleRow = (productId) => {
    setEditableRows((prev) =>
      prev.map((r) =>
        r.productId === productId ? { ...r, isChecked: !r.isChecked } : r,
      ),
    );
  };

  const handleSelectAll = (checked) => {
    setEditableRows((prev) => prev.map((r) => ({ ...r, isChecked: checked })));
  };

  const isAllSelected =
    editableRows.length > 0 && editableRows.every((r) => r.isChecked);
  const isIndeterminate =
    editableRows.some((r) => r.isChecked) && !isAllSelected;

  const filteredRows = editableRows.filter((item) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      item.productName?.toLowerCase().includes(searchLow) ||
      item.productCategoryName?.toLowerCase().includes(searchLow) ||
      item.productSubCategoryName?.toLowerCase().includes(searchLow)
    );
  });

  const columns = [
    {
      title: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(e) => handleSelectAll(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      dataIndex: "isChecked",
      width: 60,
      align: "center",
      render: (val, r) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={!!val}
            onChange={() => toggleRow(r.productId)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      render: (text) => (
        <span
          className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Category",
      dataIndex: "productCategoryName",
      render: (text) => (
        <span className="text-xs font-semibold text-green-600 bg-green-500/5 px-2 py-0.5 rounded">
          {text}
        </span>
      ),
    },
    {
      title: "Sub Category",
      dataIndex: "productSubCategoryName",
      render: (text) => <span className="text-xs text-gray-500">{text}</span>,
    },
  ];
  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
        <div className="flex flex-col">
          <h3
            className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            Buyer Products
          </h3>
          <p className="text-xs text-gray-500">
            Enable products available at {location?.partyLocationName}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || productsLoading}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader size={14} className="shrink-0 animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Apply Selections
        </button>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1">
        <Table
          dataSource={filteredRows}
          columns={columns}
          rowKey="productId"
          pagination={false}
          bordered
          scroll={{ x: true }}
          loading={productsLoading}
          className="custom-table"
          title={() => (
            <div className="flex items-center justify-between">
              <div
                className={`text-md mt-2 sm:mt-1 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Total Records: {filteredRows.length || 0}
              </div>

              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search Products..."
              />
            </div>
          )}
          rowClassName={(r) =>
            `group cursor-pointer ${r.isChecked ? (isDarkMode ? "bg-green-500/5" : "bg-green-50/30") : ""} hover:bg-gray-50 dark:hover:bg-white/5 transition-all !h-10 [&>td]:!py-1.5 [&>td]:!px-2`
          }
          onRow={(r) => ({
            onClick: () => toggleRow(r.productId),
          })}
        />
      </div>

      <style>{`
                .custom-table .ant-table {
                    background: transparent !important;
                }
                .custom-table .ant-table-thead > tr > th {
                    background: ${isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"} !important;
                    color: ${isDarkMode ? "#9ca3af" : "#64748b"} !important;
                    font-size: 10px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    border-bottom: 1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} !important;
                }
                .custom-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} !important;
                    color: ${isDarkMode ? "#e5e7eb" : "#1e293b"} !important;
                }
                .ant-checkbox-inner {
                    border-radius: 6px !important;
                    width: 17px !important;
                    height: 17px !important;
                    transition: all 0.2s ease !important;
                }
                .ant-checkbox-checked .ant-checkbox-inner {
                    background-color: #16a34a !important;
                    border-color: #16a34a !important;
                }
            `}</style>
    </div>
  );
};

export default BuyerProductsTab;
