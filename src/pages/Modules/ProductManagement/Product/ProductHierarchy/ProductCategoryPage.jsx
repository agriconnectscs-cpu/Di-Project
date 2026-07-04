import toast from "react-hot-toast";
import { Trash2, Redo, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import CustomInput from "../../../../../components/CustomInput";
import CustomModal from "../../../../../components/CustomModal";
import CustomTable from "../../../../../components/CustomTable";
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
import { usePagePermissions } from "../../../../../permissions";
import { useGetProductTypes } from "../../../../../hooks/useGetProductTypes";
import { useShortcutManager } from "../../../../../hooks/useShortcutManager";
import { useGetProductCategories } from "../../../../../hooks/useGetProductCategories";
// Imports End----------------

const ProductCategoryPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    name: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [newItem, setNewItem] = useState({
    productCategoryId: "",
    productTypeId: "",
    productCategoryName: "",
    productCategoryCode: "",
    seqNo: "",
  });

  const modalScrollRef = useRef(null);

  // Data fetching
  const { productTypes } = useGetProductTypes();
  const {
    data: productCategories = [],
    isLoading,
    isError,
    error,
  } = useGetProductCategories();

  // Auto-select product type and product area if only one option is available
  useEffect(() => {
    if (addModal && !newItem.productCategoryId && productTypes?.length === 1) {
      setNewItem((prev) => ({
        ...prev,
        productTypeId: productTypes[0].criteriaSubTypeId,
      }));
    }
  }, [addModal, productTypes, newItem.productCategoryId]);

  // Fetch Auto Code
  const { data: autoCodeResponse, isLoading: autoCodeIsLoading } = useQuery({
    queryKey: ["productCategoryAutoCode", loginAccessToken],
    enabled: !!loginAccessToken && addModal && !newItem.productCategoryId,

    queryFn: async () => {
      const response = await fetch("/api/DI/ProductCategory/GetAutoCode", {
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      return handleApiResponse(response, "Failed to fetch auto code");
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (autoCodeResponse?.statusCode === 200 && autoCodeResponse?.data) {
      setNewItem((prev) => ({
        ...prev,
        productCategoryCode: autoCodeResponse.data,
      }));
    }
  }, [autoCodeResponse]);

  // Fetch Category By Id (For Edit)
  const { data: categoryDetails, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["categoryDetails", editingId],
    enabled: !!editingId,

    queryFn: async () => {
      const response = await fetch(
        `/api/DI/ProductCategory/GetById?Id=${editingId}`,
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return handleApiResponse(response, "Failed to fetch category details");
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Sync Category Details to State
  useEffect(() => {
    if (
      categoryDetails?.statusCode === 200 &&
      categoryDetails?.data &&
      editingId
    ) {
      if (!permission(canEdit, "No permission to edit category")) {
        setEditingId(null);
        return;
      }
      const data = categoryDetails.data;
      setNewItem((prev) => ({
        ...prev,
        productCategoryId: data.productCategoryId,
        productTypeId: data.productTypeId,
        productCategoryName: data.productCategoryName,
        productCategoryCode: data.productCategoryCode,
        seqNo: data.seqNo || "",
        rowVersionLong: data.rowVersionLong,
      }));
      setAddModal(true);
    }
  }, [categoryDetails, editingId, canEdit]);

  // Save / Update Category Mutation
  const { mutate: saveCategory, isPending } = useMutation({
    mutationFn: async (data) => {
      console.log(data);
      const res = await fetch("/api/DI/ProductCategory/Save", {
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
      toast.success(result?.message || "Product category saved successfully");
      queryClient.invalidateQueries(["productCategories", loginAccessToken]);
      queryClient.invalidateQueries([
        "productCategoryAutoCode",
        loginAccessToken,
      ]);
      handleCloseModal();
    },

    onError: (err) => {
      toast.error(err.message || "Error saving record");
    },
  });

  const handleAddCategory = () => {
    if (!permission(canAdd, "No permission to add new category")) return;
    const {
      productCategoryName,
      productTypeId,
      productCategoryId,
      productCategoryCode,
    } = newItem;

    if (!productCategoryName?.trim() || !productTypeId) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedType = productTypes.find(
      (t) => t.criteriaSubTypeId === Number(productTypeId),
    );

    saveCategory({
      productCategoryId: productCategoryId || 0,
      productTypeId: Number(productTypeId),
      productTypeName: selectedType?.criteriaName || "",
      productCategoryName: productCategoryName.trim(),
      productCategoryCode: productCategoryCode?.trim() || "",
      seqNo: newItem.seqNo || 0,
      rowVersionLong: newItem.rowVersionLong || 0,
    });
  };

  // Delete Category Mutation
  const { mutate: deleteCategory } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/DI/ProductCategory/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      return handleApiResponse(res, "Failed to delete category");
    },

    onSuccess: (_, id) => {
      setSuccessModalOpen(true);
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
      queryClient.setQueryData(
        ["productCategories", loginAccessToken],
        (old) => {
          if (!old) return [];
          const filtered = old.filter((item) => item.productCategoryId !== id);
          return filtered.map((item, index) => ({ ...item, sr: index + 1 }));
        },
      );
    },

    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  // Bulk Delete Category Mutation
  const { mutate: bulkDelete, isPending: bulkDeleting } = useMutation({
    mutationFn: async (selectedIds) => {
      if (!selectedIds.length) throw new Error("No rows selected");

      const payload = selectedIds.map((id) => {
        const item = productCategories.find((p) => p.productCategoryId === id);
        return {
          productCategoryId: item?.productCategoryId || 0,
          productTypeId: item?.productTypeId || 0,
          productTypeName: item?.productTypeName || "",
          productCategoryCode: item?.productCategoryCode || "",
          productCategoryName: item?.productCategoryName || "",
          seqNo: item?.seqNo || 0,
          rowVersionLong: item?.rowVersionLong || 0,
        };
      });

      const res = await fetch("/api/DI/ProductCategory/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      return handleApiResponse(res, "Failed to delete records");
    },

    onSuccess: (_, selectedIds) => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.setQueryData(
        ["productCategories", loginAccessToken],
        (old) => {
          if (!old) return [];
          const filtered = old.filter(
            (item) => !selectedIds.includes(item.productCategoryId),
          );
          return filtered.map((item, index) => ({ ...item, sr: index + 1 }));
        },
      );
    },

    onError: (err) => toast.error(err.message),
  });

  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, "No permission to delete category")) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDelete(selectedRowKeys);
  };

  // Handlers
  const handleDeleteClick = (id) => {
    const item = productCategories.find((cat) => cat.productCategoryId === id);
    setConfirmModal({
      open: true,
      id,
      name: item?.productCategoryName || "",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    if (!permission(canDelete, "No permission to delete category")) {
      setConfirmModal({ open: false, id: null, name: "" });
      return;
    }
    setDeletingId(confirmModal.id);
    deleteCategory(confirmModal.id, {
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
      productCategoryName: "",
      productCategoryCode: "",
      productTypeId: "",
      productCategoryId: "",
      seqNo: "",
    });
    queryClient.removeQueries({ queryKey: ["productCategoryAutoCode"] });
  };

  const handleEditLastAdded = () => {
    if (!permission(canEdit, "No permission to edit category")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      setNewItem({
        ...firstItem,
        productCategoryId: firstItem.key,
        productTypeId: firstItem.productTypeId || 0,
      });
      setAddModal(true);
    }
  };

  const handleDeleteLastAdded = () => {
    if (!permission(canDelete, "No permission to delete category")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      handleDeleteClick(firstItem.key);
    }
  };

  // Shortcut Management
  const firstInputRef = useShortcutManager({
    isOpen: addModal,

    onOpen: () => {
      if (!permission(canAdd, "No permission to add new category")) return;
      setAddModal(true);
    },
    onClose: handleCloseModal,
    onSubmit: handleAddCategory,
    onEditLastAdded: handleEditLastAdded,
    onDeleteLastAdded: handleDeleteLastAdded,
    disableScrolling: confirmModal.open || bulkDeleteModal || successModalOpen,
  });

  const filteredData = useGlobalFilter(productCategories, globalSearch, [
    "sr",
    "productCategoryName",
    "productCategoryCode",
    "seqNo",
    "productTypeName",
  ]);

  //  Table Columns
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
      dataIndex: "productCategoryCode",
      width: 90,
      className: "text-center",
      sorter: (a, b) =>
        (a.productCategoryCode || "").localeCompare(
          b.productCategoryCode || "",
        ),
      render: (text) =>
        text || <span className="text-gray-400 italic">N/A</span>,
    },
    {
      title: "Category Name",
      dataIndex: "productCategoryName",
      width: 350,
      sorter: (a, b) =>
        a.productCategoryName.localeCompare(b.productCategoryName),
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
      width: 120,
      className: "text-center",
      sorter: (a, b) =>
        (a.seqNo || "").toString().localeCompare((b.seqNo || "").toString()),
      render: (val) => val || <span className="text-gray-400 italic">N/A</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          darkMode={isDarkMode}
          isEditLoading={isLoadingCategory && editingId === record.key}
          isDeleteLoading={deletingId === record.key}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit category")) return;
            setEditingId(rec.key);
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, "No permission to delete category"))
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
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        {/* 1 */}
        <Breadcrumb />

        {/* 2 */}
        <CustomButton
          onClick={() => {
            if (
              !permission(
                canAdd,
                "You do not have permission to create new categories",
              )
            )
              return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title={"Add Category"}
          disabled={isLoading}
          className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>

      <CustomTable
        loading={isLoading}
        columns={columns}
        dataSource={filteredData}
        isDarkMode={isDarkMode}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search categories..."
        isError={isError}
        error={error}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (
                    !permission(canDelete, "No permission to delete category")
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
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />

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
          {newItem.productCategoryId ? "Edit Category" : "Add Category"}
        </h2>

        <div
          ref={modalScrollRef}
          className="max-h-[72vh] overflow-y-auto overflow-x-hidden pr-2 no-scrollbar"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <SelectDropDown
                  ref={firstInputRef}
                  id="productType"
                  label="Product Type"
                  value={newItem.productTypeId}
                  placeholder="Select Type"
                  required
                  options={productTypes.map((type) => ({
                    label: type.criteriaName,
                    value: type.criteriaSubTypeId,
                  }))}
                  onChange={(value) =>
                    setNewItem({
                      ...newItem,
                      productTypeId: value,
                    })
                  }
                />
              </div>

              <div>
                <CustomInput
                  id="productCategoryCode"
                  required
                  label="Code"
                  value={newItem.productCategoryCode}
                  placeholder="e.g. 01"
                  isLoading={autoCodeIsLoading}
                  inputClassName="py-0.5"
                  maxLength={3}
                  onChange={(e) => {
                    setNewItem({
                      ...newItem,
                      productCategoryCode: e.target.value,
                    });
                  }}
                />
              </div>

              <div className="col-span-2">
                <CustomInput
                  id="productCategoryName"
                  label="Category Name"
                  value={newItem.productCategoryName}
                  placeholder="Enter category name"
                  required
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      productCategoryName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <CustomInput
                  id="seqNo"
                  label="Seq No"
                  value={newItem.seqNo}
                  placeholder="Order"
                  inputClassName="py-0.5"
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      seqNo: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <ModalActionButtons
          onCancel={handleCloseModal}
          onSubmit={handleAddCategory}
          isDarkMode={isDarkMode}
          isSubmitting={isPending}
          submitText={newItem.productCategoryId ? "Update" : "Save"}
        />
      </CustomModal>

      {/* Single Delete */}
      <CustomDeleteModal
        open={confirmModal.open}
        title={confirmModal.name}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bulk Delete */}
      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        title={`${selectedRowKeys.length} selected categories`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      {/* Success Delete Modal */}
      <SuccessModal
        open={successModalOpen}
        message="Category deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default ProductCategoryPage;
