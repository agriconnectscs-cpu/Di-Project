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
import ModalActionButtons from "../../../../../components/ModalActionButtons";
// Imports End --------

const DocumentMovementPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canAdd, permission } = usePagePermissions();

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
    queryKey: ["docMovementList", loginAccessToken],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 50;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/DocMovement/GetList", {
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
        key: item.docMovementId,
        sr: index + 1,
        docMovementId: item.docMovementId,
        docMovementClientId: item.docMovementClientId,
        docMovementName: item.docMovementName || "-",
        docPrefix: item.docPrefix || "-",
        docPrefixNo: item.docPrefixNo || "-",
        rowVersionLong: item.rowVersionLong || 0,
        createdOn: item.createdOn,
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Get Data For Popup
  const { data: allItems = [], isLoading: allItemsIsLoading } = useQuery({
    queryKey: ["allDocMovements", loginAccessToken],
    enabled: addModal,
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/DocMovement/GetList", {
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
        key: item.docMovementId,
        sr: index + 1,
        docMovementId: item.docMovementId,
        docMovementClientId: item.docMovementClientId,
        docMovementName: item.docMovementName || "-",
        docPrefix: item.docPrefix || "-",
        docPrefixNo: item.docPrefixNo || "-",
        rowVersionLong: item.rowVersionLong || 0,
        createdOn: item.createdOn,
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  //  Save / Update Mutation
  const { mutate: saveItem, isPending: saveItemisLoading } = useMutation({
    mutationFn: async (selectedItems) => {
      const res = await fetch("/api/ADM/DocMovement/SaveAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({
          lstRequest: selectedItems.map((c) => ({
            docMovementId: c.docMovementId,
            docMovementClientId: c.docMovementClientId,
            docMovementName: c.docMovementName,
            docPrefix: c.docPrefix,
            docPrefixNo: c.docPrefixNo,
            rowVersionLong: c.rowVersionLong,
          })),
          lstDeletedRequest: [],
        }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result?.message || "Failed to save document movements");
      return result;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Document movements saved successfully");
      queryClient.invalidateQueries(["docMovementList"]);
      handleCloseAddModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    const selectedItems = allItems.filter((c) =>
      modalSelectedItemKeys.includes(c.key),
    );
    if (!selectedItems.length) {
      toast.error("Select at least one document movement");
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
          docMovementId: row.docMovementId,
          docMovementClientId: row.docMovementClientId,
          docMovementName: row.docMovementName,
          docPrefix: row.docPrefix,
          docPrefixNo: row.docPrefixNo,
          rowVersionLong: row.rowVersionLong,
        };
      });

      const res = await fetch("/api/ADM/DocMovement/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.text();
      if (!res.ok)
        throw new Error(data || "Failed to delete document movements");

      return selectedIds;
    },

    onMutate: () => setBulkDeleting(true),

    onSuccess: () => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["docMovementList"] });
    },

    onError: (err) => {
      toast.error(err.message || "Failed to delete document movements");
    },

    onSettled: () => setBulkDeleting(false),
  });

  // Trigger delete
  const handleConfirmBulkDelete = () => {
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
      item.docMovementName?.toLowerCase().includes(search) ||
      item.docPrefix?.toLowerCase().includes(search) ||
      item.docPrefixNo?.toLowerCase().includes(search)
    );
  });

  // Filtered Data for Popup Table
  const filteredModalData = allItems
    .filter((a) => !tableList.some((t) => t.key === a.key))
    .filter((item) => {
      const search = modalSearch.toLowerCase();
      return (
        item.sr?.toString().includes(search) ||
        item.docMovementName?.toLowerCase().includes(search) ||
        item.docPrefix?.toLowerCase().includes(search) ||
        item.docPrefixNo?.toLowerCase().includes(search)
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
      title: "Document Movement Name",
      dataIndex: "docMovementName",
      key: "docMovementName",
      sorter: (a, b) =>
        (a.docMovementName || "").localeCompare(b.docMovementName || ""),
    },
    {
      title: "Prefix",
      dataIndex: "docPrefix",
      key: "docPrefix",
      align: "center",
      sorter: (a, b) => (a.docPrefix || "").localeCompare(b.docPrefix || ""),
    },
    {
      title: "Prefix No",
      dataIndex: "docPrefixNo",
      key: "docPrefixNo",
      align: "center",
      sorter: (a, b) =>
        (a.docPrefixNo || "").localeCompare(b.docPrefixNo || ""),
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

        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add document movement"))
              return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add Document Movement"
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
          "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2 cursor-pointer"
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
              placeholder="Search Document Movement..."
            />
          </div>
        )}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => setBulkDeleteModal(true)}
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
                  <Edit size={20} /> Add Document Movement{" "}
                  {filteredModalData.length > 0 &&
                    `(${filteredModalData.length})`}
                </h2>

                <SearchBar
                  value={modalSearch}
                  onChange={setModalSearch}
                  placeholder="Search Document Movement..."
                />
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

              <ModalActionButtons
                onCancel={handleCloseAddModal}
                onSubmit={handleAdd}
                isDarkMode={isDarkMode}
                isSubmitting={saveItemisLoading}
                submitText="Save"
              />
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
        message="Document movement deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default DocumentMovementPage;
