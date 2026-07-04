import { Table } from "antd";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Edit, Redo, Trash2 } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../../../ThemeProvider";

import { usePagePermissions } from "../../../../../permissions";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { useCloseOnEscape } from "../../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../../components/SearchBar";
import SuccessModal from "../../../../../components/SuccessModal";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import CustomButton from "../../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../../components/CustomDeleteModal";
// Imports End --------

const AreaPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canAdd, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalSelectedItemKeys, setModalSelectedItemKeys] = useState([]);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  //  Get Data For Table
  const { data: tableList = [], isLoading: tableListIsLoading } = useQuery({
    queryKey: ["tableAreaList", loginAccessToken],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/CityArea/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
          body: JSON.stringify({
            filters: JSON.stringify({ IsAddAllCall: false }),
            start,
            length: pageSize,
          }),
        });

        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) break;

        allData.push(...result.data);
        start += pageSize;
        hasMore = result.data.length === pageSize;
      }

      const uniqueTableData = Array.from(
        new Map(
          allData.map((item) => [String(item.cityAreaId), item]),
        ).values(),
      );

      return uniqueTableData.map((item, index) => ({
        key: `tbl-${index}`,
        sr: index + 1,
        cityAreaClientId: item.cityAreaClientId || 0,
        cityAreaId: item.cityAreaId || 0,
        cityId: item.cityId || 0,
        districtId: item.districtId || 0,
        tehsilId: item.tehsilId || 0,
        provinceName: item.provinceName || "N/A",
        cityName: item.cityName || "N/A",
        districtName: item.districtName || "N/A",
        tehsilName: item.tehsilName || "N/A",
        areaName: item.areaName || "N/A",
        areaCode: item.areaCode || "",
        areaSeqNo: item.areaSeqNo || 0,
        areaPostalCode: item.areaPostalCode || "",
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Get Data For Popup
  const { data: allItems = [], isLoading: allItemsIsLoading } = useQuery({
    queryKey: ["modalAreaList", loginAccessToken],
    enabled: addModal,
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/CityArea/GetList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
          body: JSON.stringify({
            filters: JSON.stringify({ IsAddAllCall: true }),
            start,
            length: pageSize,
          }),
        });

        const result = await res.json();

        if (
          !result.data ||
          !Array.isArray(result.data) ||
          result.data.length === 0
        ) {
          hasMore = false;
          break;
        }

        allData.push(...result.data);
        start += result.data.length;
      }

      const uniqueData = Array.from(
        new Map(
          allData.map((item) => [String(item.cityAreaId), item]),
        ).values(),
      );

      return uniqueData.map((item, index) => ({
        key: `modal-${index}`,
        sr: index + 1,
        cityAreaClientId: item.cityAreaClientId || 0,
        cityAreaId: item.cityAreaId || 0,
        cityId: item.cityId || 0,
        districtId: item.districtId || 0,
        tehsilId: item.tehsilId || 0,
        provinceName: item.provinceName || "N/A",
        cityName: item.cityName || "N/A",
        districtName: item.districtName || "N/A",
        tehsilName: item.tehsilName || "N/A",
        areaName: item.areaName || "N/A",
        areaCode: item.areaCode || "",
        areaSeqNo: item.areaSeqNo || 0,
        areaPostalCode: item.areaPostalCode || "",
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Save / Update Mutation
  const { mutate: saveItem, isPending: saveItemisLoading } = useMutation({
    mutationFn: async (selectedItems) => {
      const res = await fetch("/api/ADM/CityArea/SaveAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({
          lstRequest: selectedItems.map((item) => ({
            cityAreaClientId: Number(item.cityAreaClientId) || 0,
            cityAreaId: Number(item.cityAreaId) || 0,
            cityId: Number(item.cityId) || 0,
            districtId: Number(item.districtId) || 0,
            tehsilId: Number(item.tehsilId) || 0,
            areaName: item.areaName || "",
            areaCode: item.areaCode || "",
            areaSeqNo: Number(item.areaSeqNo) || 0,
            areaPostalCode: item.areaPostalCode || "",
          })),
          lstDeletedRequest: [],
        }),
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorResult = await res.json();
          throw new Error(errorResult?.message || `API Error: ${res.status}`);
        } else {
          const errorText = await res.text();
          throw new Error(errorText || `API Error: ${res.status}`);
        }
      }

      const result = await res.json();
      return result;
    },
    onSuccess: (res) => {
      toast.success(res?.message);
      queryClient.invalidateQueries({ queryKey: ["tableAreaList"] });
      setAddModal(false);
      handleCloseAddModal();
      setSelectedRowKeys([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    const selectedItems = filteredModalData.filter((c) =>
      modalSelectedItemKeys.includes(c.key),
    );
    if (!selectedItems.length) {
      toast.error("Select at least one item");
      return;
    }
    saveItem(selectedItems);
  };

  // Bulk Delete Mutation
  const { mutate: bulkDelete } = useMutation({
    mutationFn: async (selectedIds) => {
      if (!selectedIds || selectedIds.length === 0) {
        throw new Error("No items selected for deletion");
      }

      const payload = selectedIds.map((id) => {
        const row = tableList.find((c) => c.key === id);
        if (!row) throw new Error(`Record not found for ID: ${id}`);

        return {
          cityAreaClientId: row.cityAreaClientId || 0,
          cityAreaId: row.cityAreaId || 0,
          cityId: row.cityId || 0,
          districtId: row.districtId || 0,
          tehsilId: row.tehsilId || 0,
          areaName: row.areaName || "",
          areaCode: row.areaCode || "",
          areaSeqNo: row.areaSeqNo || 0,
          areaPostalCode: row.areaPostalCode || "",
          rowVersionLong: row.rowVersionLong || 0,
        };
      });

      const res = await fetch("/api/ADM/CityArea/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.text();
      if (!res.ok) throw new Error(data);

      return selectedIds;
    },

    onMutate: () => setBulkDeleting(true),

    onSuccess: () => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["tableAreaList"] });
    },

    onError: (err) => {
      toast.error(err.message || "Failed to delete tehsils");
    },

    onSettled: () => setBulkDeleting(false),
  });

  // Trigger delete
  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, "No permission to delete area")) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDelete(selectedRowKeys);
  };

  const handleCloseAddModal = () => {
    setAddModal(false);
    setModalSearch("");
    setModalSelectedItemKeys([]);
  };

  // Remove Scrollbar on Popup
  useEffect(() => {
    if (addModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [addModal]);

  useCloseOnEscape(addModal, handleCloseAddModal);

  // Filtered Data for Main Table
  const filteredData = tableList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.provinceName?.toLowerCase().includes(search) ||
      item.cityName?.toLowerCase().includes(search) ||
      item.districtName?.toLowerCase().includes(search) ||
      item.areaName?.toLowerCase().includes(search)
    );
  });

  // Filtered Data for Main Table
  const filteredModalData = allItems
    .filter((a) => !tableList.some((t) => t.cityAreaId === a.cityAreaId))
    .filter((item) => {
      const search = modalSearch.toLowerCase();
      return (
        item.sr?.toString().includes(search) ||
        item.provinceName?.toLowerCase().includes(search) ||
        item.cityName?.toLowerCase().includes(search) ||
        item.districtName?.toLowerCase().includes(search) ||
        item.areaName?.toLowerCase().includes(search)
      );
    });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: 60,
      align: "center",
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: "Province",
      dataIndex: "provinceName",
      key: "provinceName",
      sorter: (a, b) => a.provinceName.localeCompare(b.provinceName),
    },
    {
      title: "City",
      dataIndex: "cityName",
      key: "cityName",
      sorter: (a, b) => a.cityName.localeCompare(b.cityName),
    },
    {
      title: "Area",
      dataIndex: "areaName",
      key: "areaName",
      sorter: (a, b) => a.areaName.localeCompare(b.areaName),
    },
  ];
  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />

        {/* 2 */}
        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add area")) return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add Area"
          disabled={tableListIsLoading}
          className={
            (tableListIsLoading ? "opacity-50 cursor-not-allowed" : "",
            "select-none")
          }
        />
      </div>

      <Table
        loading={tableListIsLoading}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: true }}
        bordered
        rowClassName={() =>
          "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2 cursor:pointer"
        }
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            name: `item-${record.key}`,
            id: `item-${record.key}`,
          }),
        }}
        onRow={(record) => ({
          onClick: (e) => {
            if (
              e.target.closest(".ant-checkbox-wrapper") ||
              e.target.closest("button") ||
              e.target.closest("a")
            )
              return;

            setSelectedRowKeys((prev) => {
              const key = record.key;
              return prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key];
            });
          },
        })}
        pagination={{
          total: filteredData?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
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
              placeholder="Search Area..."
            />
          </div>
        )}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (!permission(canDelete, "No permission to delete area"))
                    return;
                  setBulkDeleteModal(true);
                }}
                disabled={bulkDeleting}
                isDarkMode={isDarkMode}
                title={`Delete Selected (${selectedRowKeys.length})`}
                className="my-2"
              />
            </div>
          )
        }
      />

      <AnimatePresence>
        {addModal && (
          <Motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-[#05040a]/60 backdrop-blur-md p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Motion.div
              className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${
                isDarkMode
                  ? "bg-[#0d0c1b]/95 border-white/10 shadow-black/80"
                  : "bg-white/95 border-gray-100 shadow-purple-100/30"
              }`}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 35, stiffness: 500 }}
            >
              {/* Sticky Header */}
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-8 border-b ${
                  isDarkMode
                    ? "bg-[#141225]/50 border-white/5"
                    : "bg-gray-50/50 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Edit size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h2
                      className={`text-lg font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Add Area
                    </h2>
                    <p
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Select areas to add to your distribution network
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 sm:max-w-xs">
                  <SearchBar
                    value={modalSearch}
                    onChange={setModalSearch}
                    placeholder="Search Area..."
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:px-8 bg-transparent custom-scrollbar">
                <Table
                  dataSource={filteredModalData}
                  bordered
                  loading={allItemsIsLoading}
                  columns={columns}
                  rowClassName={() =>
                    "hover:bg-purple-500/5 transition-colors cursor-pointer !h-12 [&>td]:!py-2 [&>td]:!px-3"
                  }
                  rowSelection={{
                    selectedRowKeys: modalSelectedItemKeys,
                    onChange: setModalSelectedItemKeys,
                  }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      if (e.target.closest(".ant-checkbox-wrapper")) return;
                      setModalSelectedItemKeys((prev) => {
                        const key = record.key;
                        const exists = prev.includes(key);
                        return exists
                          ? prev.filter((k) => k !== key)
                          : [...prev, key];
                      });
                    },
                  })}
                  pagination={{
                    total: filteredModalData?.length || 0,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100", "500", "1000"],
                    defaultPageSize: 5,
                  }}
                  className="premium-table-modal"
                />
              </div>

              {/*  Footer */}
              <div className={`flex items-center justify-between p-4 sm:px-8 `}>
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {modalSelectedItemKeys.length > 0 ? (
                    <span className="text-purple-500 font-bold">
                      {modalSelectedItemKeys.length} items selected
                    </span>
                  ) : (
                    "No items selected"
                  )}
                </div>

                <div className="flex gap-3">
                  <CustomButton
                    onClick={handleCloseAddModal}
                    title="Cancel"
                    variant="ghost"
                    isDarkMode={isDarkMode}
                    className="px-6!"
                  />
                  <CustomButton
                    onClick={handleAdd}
                    disabled={
                      saveItemisLoading || modalSelectedItemKeys.length === 0
                    }
                    loading={saveItemisLoading}
                    title="Save Changes"
                    isDarkMode={isDarkMode}
                    className="px-8! bg-purple-600 hover:bg-purple-700 text-white border-0"
                  />
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      <SuccessModal
        open={successModalOpen}
        message="Area deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default AreaPage;
