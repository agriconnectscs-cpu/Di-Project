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
import LoadingSpinner from "../../../../../components/common/LoadingSpinner";
// Imports End --------

const CityPage = () => {
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
    queryKey: ["tableCityList", loginAccessToken],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/City/GetList", {
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

      return allData.map((item, index) => ({
        key: item.cityId || index,
        sr: index + 1,
        cityClientId: item.cityClientId || "N/A",
        cityId: item.cityId || "N/A",
        provinceId: item.provinceId || "N/A",
        countryName: item.countryName || "N/A",
        provinceName: item.provinceName || "N/A",
        cityName: item.cityName || "N/A",
        cityCode: item.cityCode || "N/A",
        citySeqNo: item.citySeqNo || "N/A",
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Get Data For Popup
  const { data: allItems = [], isLoading: allItemsIsLoading } = useQuery({
    queryKey: ["modalCityList", loginAccessToken],
    enabled: addModal,
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/City/GetList", {
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
        if (!result.data || !Array.isArray(result.data)) break;

        allData.push(...result.data);

        start += pageSize;
        hasMore = result.data.length === pageSize;
      }

      return allData.map((item, index) => ({
        key: item.cityId || index,
        sr: index + 1,
        cityClientId: item.cityClientId || "N/A",
        cityId: item.cityId || "N/A",
        provinceId: item.provinceId || "N/A",
        countryName: item.countryName || "N/A",
        provinceName: item.provinceName || "N/A",
        cityName: item.cityName || "N/A",
        cityCode: item.cityCode || "N/A",
        citySeqNo: item.citySeqNo || "N/A",
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Save / Update Mutation
  const { mutate: saveItem, isPending: saveItemisLoading } = useMutation({
    mutationFn: async (selectedItems) => {
      const res = await fetch("/api/ADM/City/SaveAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({
          lstRequest: selectedItems.map((item) => ({
            cityClientId: 0,
            cityId: item.key,
            cityName: item.cityName,
            cityCode: item.cityCode,
            citySeqNo: 0,
            rowVersionLong: 0,
          })),
          lstDeletedRequest: [],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      return result;
    },
    onSuccess: (res) => {
      toast.success(res?.message);
      queryClient.invalidateQueries(["tableCityList"]);
      setAddModal(false);
      handleCloseAddModal();
      setSelectedRowKeys([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    const selectedItems = allItems.filter((c) =>
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
        const row = tableList.find((c) => c.key === Number(id));
        if (!row) throw new Error(`Record not found for ID: ${id}`);

        return {
          cityClientId: row.cityClientId,
          rowVersionLong: row.rowVersionLong,
        };
      });

      const res = await fetch("/api/ADM/City/DeleteAll", {
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
      queryClient.invalidateQueries({ queryKey: ["tableCityList"] });
    },

    onError: (err) => {
      toast.error(err.message || "Failed to delete cities");
    },

    onSettled: () => setBulkDeleting(false),
  });

  // Trigger delete
  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, "No permission to delete city")) {
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
      item.cityName?.toLowerCase().includes(search) ||
      item.cityCode?.toString().includes(search)
    );
  });

  // Filtered Data for Main Table
  const filteredModalData = allItems.filter((item) => {
    const search = modalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.cityName?.toLowerCase().includes(search) ||
      item.cityCode?.toString().includes(search)
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
      title: "Country",
      dataIndex: "countryName",
      key: "countryName",
      className: "font-medium",
      sorter: (a, b) => a.countryName.localeCompare(b.countryName),
    },
    {
      title: "Province",
      dataIndex: "provinceName",
      key: "provinceName",
      className: "font-medium",
      sorter: (a, b) => a.provinceName.localeCompare(b.provinceName),
    },
    {
      title: "City",
      dataIndex: "cityName",
      key: "cityName",
      className: "font-medium",
      sorter: (a, b) => a.cityName.localeCompare(b.cityName),
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
            if (!permission(canAdd, "No permission to add city")) return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add City"
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
              placeholder="Search City..."
            />
          </div>
        )}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (!permission(canDelete, "No permission to delete city"))
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto py-5 px-6 rounded-2xl shadow-xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#0D0C1A] text-gray-200"
                  : "bg-white text-gray-800"
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2 text-nowrap text-(--secondary-color)">
                  <Edit size={20} /> Add City
                </h2>
                <div className="flex justify-center sm:justify-end w-full">
                  <SearchBar
                    value={modalSearch}
                    onChange={setModalSearch}
                    placeholder="Search City..."
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto sm:overflow-x-hidden">
                <Table
                  dataSource={filteredModalData}
                  bordered
                  loading={allItemsIsLoading}
                  columns={columns}
                  rowClassName={() =>
                    "hover:bg-[#1b122b]/30 !h-11 [&>td]:!py-1.5 [&>td]:!px-2"
                  }
                  rowSelection={{
                    selectedRowKeys: modalSelectedItemKeys,
                    onChange: setModalSelectedItemKeys,
                  }}
                  onRow={(record) => ({
                    onClick: () => {
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
                    pageSizeOptions: ["10", "20", "50", "100", "500"],
                    defaultPageSize: 5,
                  }}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-3 select-none">
                <button
                  onClick={handleCloseAddModal}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saveItemisLoading}
                  className="px-5 py-1 rounded-full text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveItemisLoading ? (
                    <LoadingSpinner content="Saving..." />
                  ) : (
                    "Save"
                  )}
                </button>
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
        message="City deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default CityPage;
