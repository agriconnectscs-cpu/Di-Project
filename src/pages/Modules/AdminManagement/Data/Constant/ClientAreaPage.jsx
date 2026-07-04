import { Table } from "antd";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Edit, Redo, Trash2, X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../../../ThemeProvider";

import { handleApiResponse } from "../../../../../utils/handleApiResponse";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../../hooks/useGlobalFilter";
import { useUploadFiles } from "../../../../../hooks/useUploadFiles";
import { useShortcutManager } from "../../../../../hooks/useShortcutManager";

import SearchBar from "../../../../../components/SearchBar";
import CustomInput from "../../../../../components/CustomInput";
import UploadFiles from "../../../../../components/UploadFiles";
import CustomTable from "../../../../../components/CustomTable";
import SuccessModal from "../../../../../components/SuccessModal";
import ActionButtons from "../../../../../components/ActionButtons";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import CustomButton from "../../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../../components/CustomDeleteModal";
import LoadingSpinner from "../../../../../components/common/LoadingSpinner";
import ModalActionButtons from "../../../../../components/ModalActionButtons";
// Imports End --------

const ClientAreaPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [addModal, setAddModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalSelectedItemKeys, setModalSelectedItemKeys] = useState([]);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Edit States
  const [editModal, setEditModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [selectedEditId, setSelectedEditId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // API Call
  const { uploadFiles, isUploading } = useUploadFiles();

  // Fetch Single Record for Edit
  const {
    data: fetchedEditData,
    isFetching: isEditFetching,
    error: editError,
    isError: isEditError,
  } = useQuery({
    queryKey: ["clientArea", selectedEditId],
    enabled: !!selectedEditId,

    queryFn: async () => {
      const res = await fetch(
        `/api/ADM/ClientArea/GetById?Id=${selectedEditId}`,
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      const result = await res.json();
      if (result.statusCode === 200) {
        return result.data;
      }
      throw new Error(result.message || "Failed to fetch record");
    },
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (fetchedEditData && selectedEditId) {
      setEditingData(fetchedEditData);
      setEditModal(true);
    }
  }, [fetchedEditData, selectedEditId]);

  useEffect(() => {
    if (isEditError && editError) {
      toast.error(editError.message || "Failed to fetch record");
      setSelectedEditId(null);
    }
  }, [isEditError, editError]);

  //  Get Data For Table
  const { data: tableList = [], isLoading: tableListIsLoading } = useQuery({
    queryKey: ["clientAreaList", loginAccessToken],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/ClientArea/GetList", {
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
        key: item.clientAreaId || index,
        sr: index + 1,
        clientAreaId: item.clientAreaId,
        clientAreaSettingId: item.clientAreaSettingId,
        clientAreaName: item.clientAreaName,
        clientAreaCode: item.clientAreaCode || "N/A",
        clientAreaPrefix: item.clientAreaPrefix,
        imageURL: item.imageURL,
        thumbImageURL: item.thumbImageURL,
        createdOn: item.createdOn,
        rowVersionLong: item.rowVersionLong || 0,
        clientAreaSeqNo: item.clientAreaSeqNo || 0,
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  //  Get Data For Popup
  const { data: allItems = [], isLoading: allItemsIsLoading } = useQuery({
    queryKey: ["allClientAreas", loginAccessToken],
    enabled: addModal,
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 25;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch("/api/ADM/ClientArea/GetList", {
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

        const result = await handleApiResponse(res, "Client Area List");
        if (!result.data || !Array.isArray(result.data)) break;

        allData.push(...result.data);

        start += pageSize;
        hasMore = result.data.length === pageSize;
      }

      return allData.map((item, index) => ({
        key: item.clientAreaId || index,
        sr: index + 1,
        clientAreaId: item.clientAreaId,
        clientAreaSettingId: item.clientAreaSettingId,
        clientAreaName: item.clientAreaName,
        clientAreaPrefix: item.clientAreaPrefix,
        createdOn: item.createdOn,
        rowVersionLong: item.rowVersionLong || 0,
        clientAreaSeqNo: item.clientAreaSeqNo || 0,
      }));
    },
    onError: (error) => {
      toast.error(error.message);
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  //  Save / Update Mutation
  const { mutate: saveItem, isPending: saveItemisLoading } = useMutation({
    mutationFn: async (selectedItems) => {
      const res = await fetch("/api/ADM/ClientArea/SaveAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({
          lstRequest: selectedItems.map((c) => ({
            clientAreaSettingId: c.clientAreaSettingId || 0,
            clientAreaId: c.clientAreaId || c.key,
            clientAreaName: c.clientAreaName,
            clientAreaPrefix: c.clientAreaPrefix,
            clientAreaSeqNo: c.seqNo || 0,
            rowVersionLong: c.rowVersionLong || 0,
          })),
          lstDeletedRequest: [],
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      return result;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Successfully saved");
      queryClient.invalidateQueries(["clientAreaList"]);
      handleCloseAddModal();
    },
    onError: (err) => toast.error(err.message),
  });

  // Save Single Item Mutation
  const { mutateAsync: saveSingleItem, isPending: saveSingleItemLoading } =
    useMutation({
      mutationFn: async (payload) => {
        const res = await fetch("/api/ADM/ClientArea/Save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result?.message || "Failed to save");
        return result;
      },
      onSuccess: (res) => {
        toast.success(res?.message || "Successfully saved");
        queryClient.invalidateQueries(["clientAreaList"]);
        handleCloseEditModal();
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

      // Prepare payload with only necessary fields
      const payload = selectedIds.map((id) => {
        const row = tableList.find((c) => c.key === Number(id));
        if (!row) throw new Error(`Record not found for ID: ${id}`);

        return {
          clientAreaClientId: row.clientAreaClientId,
          clientAreaSettingId: row.clientAreaSettingId,
          clientAreaId: row.clientAreaId,
          rowVersionLong: row.rowVersionLong,
        };
      });

      const res = await fetch("/api/ADM/ClientArea/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.text();
      if (!res.ok) throw new Error(data || "Failed to delete client areas");

      return selectedIds;
    },

    onMutate: () => setBulkDeleting(true),

    onSuccess: () => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["clientAreaList"] });
    },

    onError: (err) => {
      toast.error(err.message || "Failed to delete client areas");
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

  const handleEdit = (record) => {
    setSelectedEditId(record.clientAreaSettingId);
  };

  const handleDelete = (record) => {
    setSelectedRowKeys([record.key]);
    setBulkDeleteModal(true);
  };

  const handleUpdate = async () => {
    if (!editingData?.clientAreaName) {
      toast.error("Name is required");
      return;
    }

    let currentImageUrl = editingData.imageURL;
    let currentThumbUrl = editingData.thumbImageURL;

    if (selectedFile) {
      try {
        const uploadResult = await uploadFiles({
          file: selectedFile,
          pathUrl: "ClientArea",
        });
        currentImageUrl = uploadResult.fileURL;
        currentThumbUrl = uploadResult.thumbnailURL;
      } catch {
        return;
      }
    }

    try {
      await saveSingleItem({
        clientAreaSettingId: editingData.clientAreaSettingId || 0,
        clientAreaId: editingData.clientAreaId || 0,
        imageURL: currentImageUrl || "",
        thumbImageURL: currentThumbUrl || "",
        seqNo: editingData.seqNo || 0,
        clientAreaName: editingData.clientAreaName || "",
        clientAreaPrefix: editingData.clientAreaPrefix || "",
        rowVersionLong: editingData.rowVersionLong || 0,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleCloseEditModal = () => {
    setEditModal(false);
    setEditingData(null);
    setSelectedEditId(null);
    setSelectedFile(null);
  };

  // Filtered Data for Main Table
  const filteredData = useGlobalFilter(tableList, globalSearch, [
    "sr",
    "clientAreaName",
    "clientAreaPrefix",
  ]);

  // Filtered Data for Popup Table
  const filteredModalData = useGlobalFilter(allItems, modalSearch, [
    "sr",
    "clientAreaName",
    "clientAreaPrefix",
  ]);

  // Shortcut Manager
  useShortcutManager({
    isOpen: addModal,
    onOpen: () => setAddModal(true),
    onClose: () => {
      handleCloseAddModal();
      handleCloseEditModal();
    },
    onSubmit: handleAdd,
    onEditLastAdded: () => {
      if (filteredData.length > 0) {
        handleEdit(filteredData[0]);
      }
    },
    onDeleteLastAdded: () => {
      if (filteredData.length > 0) {
        handleDelete(filteredData[0]);
      }
    },
    disableScrolling: bulkDeleteModal || successModalOpen,
  });

  const popupTableColumns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: 60,
      className: "text-center font-semibold",
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: "Client Area Name",
      dataIndex: "clientAreaName",
      key: "clientAreaName",
      sorter: (a, b) => a.clientAreaName.localeCompare(b.clientAreaName),
    },
    {
      title: "Prefix",
      dataIndex: "clientAreaPrefix",
      key: "clientAreaPrefix",
      width: 120,
      align: "center",
      sorter: (a, b) => a.clientAreaPrefix.localeCompare(b.clientAreaPrefix),
    },
  ];

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
      title: "Image",
      key: "image",
      width: 80,
      className: "text-center",
      render: (_, record) => (
        <div className="flex justify-center">
          {record.thumbImageURL || record.imageURL ? (
            <img
              src={record.thumbImageURL || record.imageURL}
              alt={record.clientAreaName}
              className="size-10 object-cover"
            />
          ) : (
            <div
              className={`size-10 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isDarkMode
                  ? "bg-white/5 text-gray-500"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              N/A
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Client Area Name",
      dataIndex: "clientAreaName",
      key: "clientAreaName",
      sorter: (a, b) => a.clientAreaName.localeCompare(b.clientAreaName),
    },
    {
      title: "Prefix",
      dataIndex: "clientAreaPrefix",
      key: "clientAreaPrefix",
      sorter: (a, b) => a.clientAreaPrefix.localeCompare(b.clientAreaPrefix),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <ActionButtons
          record={record}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isEditLoading={
            selectedEditId === record.clientAreaSettingId && isEditFetching
          }
          isDeleteLoading={selectedRowKeys.includes(record.key) && bulkDeleting}
          darkMode={isDarkMode}
        />
      ),
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
          onClick={() => setAddModal(true)}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add Client Area"
          disabled={tableListIsLoading}
          className={
            (tableListIsLoading ? "opacity-50 cursor-not-allowed" : "",
            "select-none")
          }
        />
      </div>

      <CustomTable
        loading={tableListIsLoading}
        columns={columns}
        dataSource={filteredData}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            name: `item-${record.key}`,
            id: `item-${record.key}`,
          }),
        }}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search Client Area..."
        totalLabel="Total Records"
        isDarkMode={isDarkMode}
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
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2 text-nowrap text-[var(--secondary-color)]">
                  <Edit size={20} /> Add Client Area
                </h2>
                <div className="flex justify-center sm:justify-end w-full">
                  <SearchBar
                    value={modalSearch}
                    onChange={setModalSearch}
                    placeholder="Search Client Area..."
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto sm:overflow-x-hidden">
                <Table
                  dataSource={filteredModalData}
                  bordered
                  loading={allItemsIsLoading}
                  columns={popupTableColumns}
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
              <div className="flex justify-end gap-3 mt-3">
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

      <AnimatePresence>
        {editModal && (
          <Motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className={`w-full max-w-lg p-6 rounded-2xl shadow-xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#0D0C1A] text-gray-200"
                  : "bg-white text-gray-800"
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--secondary-color)]">
                  <Edit size={20} /> Edit Client Area
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className={`p-2 rounded-full transition ${
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <CustomInput
                  label="Client Area Name"
                  placeholder="Enter Name"
                  value={editingData?.clientAreaName || ""}
                  disabled={true}
                  inputClassName="cursor-not-allowed"
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      clientAreaName: e.target.value,
                    }))
                  }
                  isDarkMode={isDarkMode}
                />
                <CustomInput
                  label="Prefix"
                  placeholder="Enter Prefix"
                  value={editingData?.clientAreaPrefix || ""}
                  disabled={true}
                  inputClassName="cursor-not-allowed"
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      clientAreaPrefix: e.target.value,
                    }))
                  }
                  isDarkMode={isDarkMode}
                />

                <UploadFiles
                  label=""
                  value={editingData?.imageURL}
                  thumbnail={editingData?.thumbImageURL}
                  imageUrlKey="imageURL"
                  darkMode={isDarkMode}
                  onChange={(val) => {
                    setEditingData((prev) => ({
                      ...prev,
                      imageURL: val.imageURL,
                      thumbImageURL: val.thumbImageURL,
                    }));
                    setSelectedFile(val.file);
                  }}
                />
              </div>

              <ModalActionButtons
                onCancel={handleCloseEditModal}
                onSubmit={handleUpdate}
                isDarkMode={isDarkMode}
                isSubmitting={saveSingleItemLoading || isUploading}
                loadingText="Saving..."
                submitText="Update"
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
        message="Client area deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default ClientAreaPage;
