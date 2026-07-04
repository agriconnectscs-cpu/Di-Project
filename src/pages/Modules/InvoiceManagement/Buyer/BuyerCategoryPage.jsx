import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Redo, Edit, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../hooks/useGlobalFilter";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";
import { useShortcutManager } from "../../../../hooks/useShortcutManager";
import { useGetBuyerCategory } from "../../../../hooks/useGetBuyerCategory";
import { useGetControlCategory } from "../../../../hooks/useGetControlCategory";

import { usePagePermissions } from "../../../../permissions";

import { useTheme } from "../../../../ThemeProvider";
import { handleApiResponse } from "../../../../utils/handleApiResponse";

import CustomTable from "../../../../components/CustomTable";
import CustomModal from "../../../../components/CustomModal";
import CustomInput from "../../../../components/CustomInput";
import SuccessModal from "../../../../components/SuccessModal";
import ActionButtons from "../../../../components/ActionButtons";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../components/SelectDropDown";
import CustomButton from "../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../components/ModalActionButtons";
// Imports End----------------

const BuyerCategoryPage = () => {
  const { loginAccessToken } = useGetAuth();
  const queryClient = useQueryClient();
  const { isDarkMode } = useTheme();

  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [item, setNewItem] = useState({
    partyCategoryId: "",
    partyCategoryName: "",
    partyCategoryPrefix: "",
    controlCategoryId: "",
    controlCategoryName: "",
    seqNo: 0,
  });

  //  Fetch Data
  const { data: controlCategory = [] } = useGetControlCategory();
  const {
    data: itemList = [],
    isLoading: listLoading,
    isError,
    error,
  } = useGetBuyerCategory();

  // Fetch single Buyer Category by ID
  const { data: itemById, isLoading: categoryByIdisLoading } = useQuery({
    queryKey: ["itemById", item.partyCategoryId],
    enabled: !!item.partyCategoryId,

    queryFn: async () => {
      const res = await fetch(
        `/api/CRM/BuyerCategory/GetById?Id=${item.partyCategoryId}`,
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return handleApiResponse(res, "Failed to fetch Buyer Category details");
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (itemById?.data) {
      const p = itemById.data;

      setNewItem((prev) => ({
        ...prev,
        partyCategoryName: p.partyCategoryName || "",
        partyCategoryPrefix: p.partyCategoryPrefix || "",
        controlCategoryId: Number(p.controlCategoryId) || "",
        controlCategoryName: p.controlCategoryName || "",
      }));

      setAddModal(true);
    }
  }, [itemById]);

  //  Save / Update Buyer Category Mutation
  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/CRM/BuyerCategory/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, "Failed to save record");
    },

    onSuccess: (result) => {
      toast.success(result?.message || "Buyer Category saved successfully");
      queryClient.invalidateQueries(["buyerCategory"]);
      handleCloseModal();
    },

    onError: (err) => toast.error(err.message || "Error saving record"),
    retry: false,
  });

  //  Delete Buyer Category Mutation
  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/CRM/BuyerCategory/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      return handleApiResponse(res, "Failed to delete Buyer Category");
    },

    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["buyerCategory"]);
    },

    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete Buyer Category Mutation
  const { mutate: bulkDeleteItem, isPending: bulkDeleting } = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = selectedIds.map((id) => ({
        partyCategoryId: id,
        controlCategoryId: 0,
        partyCategoryName: "",
        partyCategoryPrefix: "",
        seqNo: 0,
        rowVersionLong: 0,
      }));

      const res = await fetch("/api/CRM/BuyerCategory/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      return handleApiResponse(res, "Failed to delete Buyer Categories");
    },

    onSuccess: () => {
      setBulkDeleteModal(false);
      queryClient.invalidateQueries(["buyerCategory"]);

      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
    },

    onError: (err) => toast.error(err.message),
  });

  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, "No permission to delete buyer categories")) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDeleteItem(selectedRowKeys);
  };

  const handleAddBuyerCategory = () => {
    const {
      partyCategoryId,
      partyCategoryPrefix,
      partyCategoryName,
      controlCategoryId,
    } = item;

    if (!controlCategoryId || !partyCategoryName || !partyCategoryPrefix) {
      toast.error("Please fill all required fields");
      return;
    }

    saveItem({
      partyCategoryId: partyCategoryId || 0,
      partyCategoryName,
      partyCategoryPrefix,
      controlCategoryId: Number(controlCategoryId),
    });
  };

  /** Handlers */
  const handleDeleteClick = (id) => {
    const itemToDel = itemList.find((cat) => cat.partyCategoryId === id);
    setConfirmModal({
      open: true,
      id,
      name: itemToDel?.partyCategoryName || "",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    setDeletingId(confirmModal.id);
    deleteItem(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({ open: false, id: null, name: "" });
  };

  const handleCancelDelete = () =>
    setConfirmModal({ open: false, id: null, name: "" });

  const handleCloseModal = () => {
    setAddModal(false);
    setNewItem({
      partyCategoryId: "",
      partyCategoryPrefix: "",
      partyCategoryName: "",
      controlCategoryId: "",
      controlCategoryName: "",
      seqNo: 0,
    });
  };

  useCloseOnEscape(addModal, handleCloseModal);

  const handleEditLastAdded = () => {
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      setNewItem((prev) => ({
        ...prev,
        partyCategoryId: firstItem.partyCategoryId,
      }));
    }
  };

  const handleDeleteLastAdded = () => {
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      handleDeleteClick(firstItem.key);
    }
  };

  // Shortcut Management
  const firstInputRef = useShortcutManager({
    isOpen: addModal,
    onOpen: () => setAddModal(true),
    onClose: handleCloseModal,
    onSubmit: handleAddBuyerCategory,
    onEditLastAdded: handleEditLastAdded,
    onDeleteLastAdded: handleDeleteLastAdded,
    disableScrolling: confirmModal.open || bulkDeleteModal || successModalOpen,
  });

  const filteredData = useGlobalFilter(itemList, globalSearch, [
    "sr",
    "partyCategoryName",
    "controlCategoryName",
    "partyCategoryPrefix",
  ]);

  //  Table Columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 70,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Control Category",
      dataIndex: "controlCategoryName",
      sorter: (a, b) =>
        a.controlCategoryName.localeCompare(b.controlCategoryName),
    },
    {
      title: "Buyer Category",
      dataIndex: "partyCategoryName",
      sorter: (a, b) => a.partyCategoryName.localeCompare(b.partyCategoryName),
      render: (text) => (
        <span
          className={`font-medium block ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Prefix",
      dataIndex: "partyCategoryPrefix",
      sorter: (a, b) =>
        a.partyCategoryPrefix.localeCompare(b.partyCategoryPrefix),
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          darkMode={isDarkMode}
          isEditLoading={
            categoryByIdisLoading &&
            item.partyCategoryId === record.partyCategoryId
          }
          isDeleteLoading={deletingId === record.key}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit buyer category"))
              return;
            setNewItem((prev) => ({
              ...prev,
              partyCategoryId: rec.partyCategoryId,
            }));
          }}
          onDelete={(rec) => {
            if (
              !permission(canDelete, "No permission to delete buyer category")
            )
              return;
            handleDeleteClick(rec.key);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />

        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add buyer category"))
              return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add Buyer Category"
          disabled={listLoading}
          className={listLoading ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>

      <CustomTable
        loading={listLoading}
        columns={columns}
        dataSource={filteredData}
        isDarkMode={isDarkMode}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search Buyer Category..."
        isError={isError}
        error={error}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (
                    !permission(
                      canDelete,
                      "No permission to delete buyer categories",
                    )
                  )
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

      {/* Add / Edit Modal */}
      <CustomModal
        isOpen={addModal}
        isDarkMode={isDarkMode}
        className="w-[90%] md:w-[70%] lg:w-[55%] xl:w-[40%] max-h-[85vh] overflow-y-auto"
      >
        <h2
          className={`flex items-center gap-2 text-lg font-semibold mb-5 ${
            isDarkMode ? "text-purple-400" : "text-purple-700"
          }`}
        >
          <Edit size={18} />
          {item.partyCategoryId ? "Edit Buyer Category" : "Add Buyer Category"}
        </h2>

        <div className="space-y-6">
          <SelectDropDown
            ref={firstInputRef}
            allowClear={false}
            id="controlCategoryId"
            label="Control Category"
            value={item.controlCategoryId}
            placeholder="Choose a control categor"
            required
            options={controlCategory
              .filter((cat) => cat.controlCategoryPrefix === "CUSPTY")
              .map((item) => ({
                label: item.controlCategoryName,
                value: item.controlCategoryId,
              }))}
            onChange={(value) =>
              setNewItem({
                ...item,
                controlCategoryId: value,
              })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomInput
                id="partyCategoryName"
                label="Category Name"
                value={item.partyCategoryName}
                placeholder="Enter Buyer category name"
                required
                onChange={(e) =>
                  setNewItem({
                    ...item,
                    partyCategoryName: e.target.value,
                  })
                }
              />
            </div>

            <CustomInput
              id="partyCategoryPrefix"
              label="Category Prefix"
              value={item.partyCategoryPrefix}
              placeholder="Enter Prefix"
              required
              onChange={(e) =>
                setNewItem({
                  ...item,
                  partyCategoryPrefix: e.target.value,
                })
              }
            />
          </div>
        </div>

        <ModalActionButtons
          onCancel={handleCloseModal}
          onSubmit={handleAddBuyerCategory}
          isSubmitting={isPending}
          isDarkMode={isDarkMode}
        />
      </CustomModal>

      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        title={confirmModal.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        title={`${selectedRowKeys.length} items`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      <SuccessModal
        open={successModalOpen}
        message="Buyer Category deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default BuyerCategoryPage;
