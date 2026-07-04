import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Redo, Edit, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import CustomInput from "../../../../../components/CustomInput";
import CustomTable from "../../../../../components/CustomTable";
import CustomModal from "../../../../../components/CustomModal";
import SuccessModal from "../../../../../components/SuccessModal";
import ActionButtons from "../../../../../components/ActionButtons";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../../components/SelectDropDown";
import CustomButton from "../../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../../components/ModalActionButtons";

import { useTheme } from "../../../../../ThemeProvider";
import { handleApiResponse } from "../../../../../utils/handleApiResponse";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../../hooks/useGlobalFilter";
import { useShortcutManager } from "../../../../../hooks/useShortcutManager";
import { usePagePermissions } from "../../../../../permissions";
import { useGetProductCategories } from "../../../../../hooks/useGetProductCategories";
import { useGetProductSubCategories } from "../../../../../hooks/useGetProductSubCategories";
// Imports End-------

const ProductSubCategoryPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    name: "",
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [newItem, setNewItem] = useState({
    productSubCategoryId: 0,
    productCategoryId: "",
    productSubCategoryName: "",
    productSubCategoryCode: "",
    seqNo: "",
    rowVersionLong: 0,
  });

  // Data Fetching
  const { data: productCategories = [] } = useGetProductCategories();
  const { data: subCategoriesList = [], isLoading: listLoading } =
    useGetProductSubCategories();

  // Fetch Auto Code
  const { data: autoCodeResponse, isLoading: autoCodeIsLoading } = useQuery({
    queryKey: [
      "subCategoryAutoCode",
      newItem.productCategoryId,
      loginAccessToken,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/DI/ProductSubCategory/GetAutoCode?ProductCategoryId=${newItem.productCategoryId}`,
        { headers: { Authorization: `Bearer ${loginAccessToken}` } },
      );
      return handleApiResponse(response, "Failed to fetch auto code");
    },
    enabled: !!(
      loginAccessToken &&
      addModal &&
      newItem.productCategoryId &&
      !newItem.productSubCategoryId
    ),
  });

  useEffect(() => {
    if (autoCodeResponse?.data) {
      setNewItem((prev) => ({
        ...prev,
        productSubCategoryCode: autoCodeResponse.data,
      }));
    }
  }, [autoCodeResponse]);

  // Fetch Single Record For Editing
  const { data: subCategoryDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["subCategoryDetails", editingId, loginAccessToken],
    queryFn: async () => {
      const response = await fetch(
        `/api/DI/ProductSubCategory/GetById?Id=${editingId}`,
        { headers: { Authorization: `Bearer ${loginAccessToken}` } },
      );
      return handleApiResponse(
        response,
        "Failed to fetch sub-category details",
      );
    },
    enabled: !!(editingId && loginAccessToken),
  });

  useEffect(() => {
    if (subCategoryDetails?.data && editingId) {
      if (!permission(canEdit, "No permission to edit sub category")) {
        setEditingId(null);
        return;
      }
      const data = subCategoryDetails.data;
      setNewItem({
        productSubCategoryId: data.productSubCategoryId,
        productCategoryId: data.productCategoryId,
        productSubCategoryName: data.productSubCategoryName,
        productSubCategoryCode: data.productSubCategoryCode,
        seqNo: data.seqNo || "",
        rowVersionLong: data.rowVersionLong,
      });
      setAddModal(true);
    }
  }, [subCategoryDetails, editingId, canEdit]);

  // Save / Update Mutation
  const { mutate: saveSubCategory, isPending: savingIsPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/DI/ProductSubCategory/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(payload),
      });
      return handleApiResponse(res, "Failed to save record");
    },
    onSuccess: (res) => {
      toast.success(res.message || "Sub Category saved successfully");
      queryClient.invalidateQueries(["productSubCategories"]);
      handleCloseModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddItem = () => {
    if (!permission(canAdd, "No permission to add new sub category")) return;
    if (!newItem.productCategoryId || !newItem.productSubCategoryName?.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    const category = productCategories.find(
      (cat) => cat.productCategoryId === newItem.productCategoryId,
    );

    const payload = {
      ...newItem,
      productSubCategoryId: newItem.productSubCategoryId || 0,
      productCategoryName: category?.productCategoryName || "",
      productSubCategoryName: newItem.productSubCategoryName.trim(),
      productSubCategoryCode: newItem.productSubCategoryCode?.trim() || "",
      seqNo: Number(newItem.seqNo) || 0,
    };

    saveSubCategory(payload);
  };

  // Delete Mutation
  const { mutate: deleteSubCategory } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(
        `/api/DI/ProductSubCategory/DeleteById?id=${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${loginAccessToken}` },
        },
      );
      return handleApiResponse(res, "Failed to delete record");
    },
    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["productSubCategories"]);
      setSelectedRowKeys((prev) =>
        prev.filter((key) => key !== confirmModal.id),
      );
    },
    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete
  const { mutate: bulkDelete, isPending: bulkDeleting } = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = subCategoriesList
        .filter((item) => selectedIds.includes(item.productSubCategoryId))
        .map((item) => ({ ...item }));

      const res = await fetch("/api/DI/ProductSubCategory/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });
      return handleApiResponse(res, "Failed to delete sub-categories");
    },
    onSuccess: () => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["productSubCategories"]);
    },
    onError: (err) => toast.error(err.message),
  });

  // Handlers
  const handleDeleteClick = (id) => {
    const item = subCategoriesList.find((s) => s.productSubCategoryId === id);
    setConfirmModal({
      open: true,
      id,
      name: item?.productSubCategoryName || "this sub-category",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    if (!permission(canDelete, "No permission to delete sub category")) {
      setConfirmModal({ open: false, id: null, name: "" });
      return;
    }
    setDeletingId(confirmModal.id);
    deleteSubCategory(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({ open: false, id: null, name: "" });
  };

  const handleCancelDelete = () =>
    setConfirmModal({ open: false, id: null, name: "" });

  const handleCloseModal = () => {
    setAddModal(false);
    setEditingId(null);
    setNewItem({
      productSubCategoryId: 0,
      productCategoryId: "",
      productSubCategoryName: "",
      productSubCategoryCode: "",
      seqNo: "",
      rowVersionLong: 0,
    });
    queryClient.removeQueries({ queryKey: ["subCategoryAutoCode"] });
  };

  const handleEditLastAdded = () => {
    if (!permission(canEdit, "No permission to edit sub category")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      setEditingId(firstItem.productSubCategoryId);
    }
  };

  const handleDeleteLastAdded = () => {
    if (!permission(canDelete, "No permission to delete sub category")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      handleDeleteClick(firstItem.key);
    }
  };

  // Keyboard Shortcuts Management
  const firstInputRef = useShortcutManager({
    isOpen: addModal,
    onOpen: () => {
      if (!permission(canAdd, "No permission to add new sub category")) return;
      setAddModal(true);
    },
    onClose: handleCloseModal,
    onSubmit: handleAddItem,
    onEditLastAdded: handleEditLastAdded,
    onDeleteLastAdded: handleDeleteLastAdded,
    disableScrolling: confirmModal.open || bulkDeleteModal || successModalOpen,
  });

  const filteredData = useGlobalFilter(subCategoriesList, globalSearch, [
    "sr",
    "productCategoryName",
    "productSubCategoryName",
    "productSubCategoryCode",
    "seqNo",
  ]);

  // Table Columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 60,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Code",
      dataIndex: "productSubCategoryCode",
      width: 100,
      className: "text-center",
      sorter: (a, b) =>
        (a.productSubCategoryCode || "").localeCompare(
          b.productSubCategoryCode || "",
        ),
      render: (text) => text || "N/A",
    },
    {
      title: "Category",
      dataIndex: "productCategoryName",
      sorter: (a, b) =>
        a.productCategoryName.localeCompare(b.productCategoryName),
      render: (text) => <span>{text}</span>,
    },
    {
      title: "Sub Category",
      dataIndex: "productSubCategoryName",
      sorter: (a, b) =>
        a.productSubCategoryName.localeCompare(b.productSubCategoryName),
      render: (text) => (
        <span
          className={`font-medium block ${
            isDarkMode ? "text-purple-400" : "text-purple-600"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Seq No",
      dataIndex: "seqNo",
      width: 100,
      className: "text-center",
      sorter: (a, b) =>
        (a.seqNo || "").toString().localeCompare((b.seqNo || "").toString()),
      render: (val) => val || <span className="text-gray-400 italic">N/A</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={
            detailsLoading && record.productSubCategoryId === editingId
          }
          isDeleteLoading={deletingId === record.key}
          darkMode={isDarkMode}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit sub category"))
              return;
            setEditingId(rec.productSubCategoryId);
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, "No permission to delete sub category"))
              return;
            handleDeleteClick(rec.productSubCategoryId);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 ${
          isDarkMode ? "bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />

        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add new records")) return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title={"Add Sub Category"}
          disabled={listLoading}
          className={listLoading ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>

      <CustomTable
        loading={listLoading}
        columns={columns}
        dataSource={filteredData}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search sub categories..."
        isDarkMode={isDarkMode}
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
                      "No permission to delete sub category",
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

      {/* Forms & Modals */}
      <CustomModal
        isOpen={addModal}
        isDarkMode={isDarkMode}
        className="w-full h-full sm:w-[95%] max-w-xl sm:h-auto"
      >
        <h2
          className={`flex items-center gap-2 text-lg font-semibold mb-4 ${
            isDarkMode ? "text-purple-400" : "text-primary-600"
          }`}
        >
          <Edit size={18} />
          {newItem.productSubCategoryId
            ? "Edit Sub Category"
            : "Add Sub Category"}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <SelectDropDown
                ref={firstInputRef}
                id="productCategoryId"
                label="Category"
                value={newItem.productCategoryId}
                placeholder="Select Category"
                required
                options={productCategories.map((cat) => ({
                  label: cat.productCategoryName,
                  value: cat.productCategoryId,
                }))}
                onChange={(value) =>
                  setNewItem({
                    ...newItem,
                    productCategoryId: value,
                  })
                }
              />
            </div>

            <div className="col-span-1">
              <CustomInput
                id="seqNo"
                label="Sequence No"
                type="number"
                value={newItem.seqNo}
                placeholder="Display Order"
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    seqNo: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-2">
              <CustomInput
                id="productSubCategoryName"
                label="Sub Category Name"
                value={newItem.productSubCategoryName}
                placeholder="Enter sub category name"
                required
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    productSubCategoryName: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-1">
              <CustomInput
                id="productSubCategoryCode"
                required
                label="Code"
                isLoading={autoCodeIsLoading}
                value={newItem.productSubCategoryCode}
                placeholder="e.g. 00-001"
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    productSubCategoryCode: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <ModalActionButtons
          onCancel={handleCloseModal}
          onSubmit={handleAddItem}
          isDarkMode={isDarkMode}
          isSubmitting={savingIsPending}
          submitText={newItem.productSubCategoryId ? "Update" : "Save"}
        />
      </CustomModal>

      {/* Delete Modals */}
      <CustomDeleteModal
        open={confirmModal.open}
        title={confirmModal.name}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <CustomDeleteModal
        open={bulkDeleteModal}
        title={`${selectedRowKeys.length} selected sub categories`}
        loading={bulkDeleting}
        onConfirm={() => bulkDelete(selectedRowKeys)}
        onCancel={() => setBulkDeleteModal(false)}
      />

      {/* Success Delete Modal */}
      <SuccessModal
        open={successModalOpen}
        message="Sub category deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default ProductSubCategoryPage;
