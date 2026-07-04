import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Redo, Edit, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import CustomInput from "../../../../components/CustomInput";
import CustomTable from "../../../../components/CustomTable";
import CustomModal from "../../../../components/CustomModal";
import SuccessModal from "../../../../components/SuccessModal";
import ActionButtons from "../../../../components/ActionButtons";
import SelectDropDown from "../../../../components/SelectDropDown";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import CustomButton from "../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../components/ModalActionButtons";
import PermissionGuard from "../../../../permissions";

import { useTheme } from "../../../../ThemeProvider";
import { handleApiResponse } from "../../../../utils/handleApiResponse";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useGetUnits } from "../../../../hooks/useGetUnits";
import useGlobalFilter from "../../../../hooks/useGlobalFilter";
import { usePagePermissions } from "../../../../permissions";
import { useShortcutManager } from "../../../../hooks/useShortcutManager";
// Imports End------

const UnitPage = () => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const { loginAccessToken } = useGetAuth();

  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    id: null,
    name: "",
  });

  const [newItem, setNewItem] = useState({
    unitId: 0,
    unitTypeId: "",
    unitShortName: "",
    unitName: "",
    seqNo: "",
    rowVersionLong: 0,
  });

  // Data fetching
  const { data: unitsList = [], isLoading: itemIsLoading } = useGetUnits();

  // Fetch Unit Types
  const { data: unitTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["unitTypes", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/DBO/Data/GetCriteriaForUnitType", {
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch Unit Types");
      const result = await res.json();
      return result?.data || [];
    },

    enabled: !!loginAccessToken,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch Single Item by ID For Editing
  const { data: unitDetails, isLoading: isLoadingItem } = useQuery({
    queryKey: ["unitDetails", editingId],
    queryFn: async () => {
      const res = await fetch(`/api/DI/Unit/GetById?Id=${editingId}`, {
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      return handleApiResponse(res, "Failed to fetch unit details");
    },
    enabled: !!editingId,
  });

  useEffect(() => {
    if (unitDetails?.data && editingId) {
      const record = unitDetails.data;
      setNewItem({
        unitId: record.unitId,
        unitTypeId: record.unitTypeId,
        unitShortName: record.unitShortName,
        unitName: record.unitName,
        seqNo: record.seqNo || "",
        rowVersionLong: record.rowVersionLong || 0,
      });
      setAddModal(true);
    }
  }, [unitDetails, editingId]);

  // Save / Update Unit Mutation
  const { mutate: saveItem, isPending: savingIsPending } = useMutation({
    mutationFn: async (data) => {
      console.log(data);

      const res = await fetch("/api/DI/Unit/Save", {
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
      toast.success(result?.message || "Unit saved successfully");
      queryClient.invalidateQueries(["units"]);
      handleCloseModal();
    },

    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleAddItem = () => {
    if (!permission(canAdd, "No permission to add new unit")) return;
    const { unitTypeId, unitName, unitShortName } = newItem;

    if (!(unitName || "").trim() || !unitTypeId) {
      toast.error("Please fill all required fields");
      return;
    }

    const selectedType = unitTypes.find(
      (t) => t.criteriaSubTypeId === Number(unitTypeId),
    );

    const payload = {
      ...newItem,
      unitId: newItem.unitId || 0,
      unitTypeId: Number(unitTypeId),
      unitTypeName: selectedType?.criteriaName || "",
      unitName: (unitName || "").trim(),
      unitShortName: (unitShortName || "").trim(),
      seqNo: Number(newItem.seqNo) || 0,
    };

    saveItem(payload);
  };

  // Delete Unit Mutation
  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/DI/Unit/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });
      return handleApiResponse(res, "Failed to delete record");
    },
    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["units"]);
      setSelectedRowKeys((prev) =>
        prev.filter((key) => key !== confirmModal.id),
      );
    },
    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete
  const { mutate: bulkDelete, isPending: bulkDeleting } = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = unitsList
        .filter((item) => selectedIds.includes(item.unitId))
        .map((item) => ({ ...item }));

      const res = await fetch("/api/DI/Unit/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      return handleApiResponse(res, "Failed to delete units");
    },
    onSuccess: () => {
      setBulkDeleteModal(false);
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["units"]);
    },
    onError: (err) => toast.error(err.message),
  });

  // Handlers
  const handleDeleteClick = (id) => {
    const item = unitsList.find((u) => u.unitId === id);
    setConfirmModal({
      open: true,
      id,
      name: item?.unitName || "this unit",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    if (!permission(canDelete, "No permission to delete unit")) {
      setConfirmModal({ open: false, id: null, name: "" });
      return;
    }
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
    setEditingId(null);
    setNewItem({
      unitId: 0,
      unitTypeId: "",
      unitShortName: "",
      unitName: "",
      seqNo: "",
      rowVersionLong: 0,
    });
  };

  const handleEditLastAdded = () => {
    if (!permission(canEdit, "No permission to edit unit")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      setEditingId(firstItem.unitId);
    }
  };

  const handleDeleteLastAdded = () => {
    if (!permission(canDelete, "No permission to delete unit")) return;
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      handleDeleteClick(firstItem.key);
    }
  };

  // Keyboard Shortcuts Management
  const firstInputRef = useShortcutManager({
    isOpen: addModal,
    onOpen: () => {
      if (!permission(canAdd, "No permission to add new unit")) return;
      setAddModal(true);
    },
    onClose: handleCloseModal,
    onSubmit: handleAddItem,
    onEditLastAdded: handleEditLastAdded,
    onDeleteLastAdded: handleDeleteLastAdded,
    disableScrolling: confirmModal.open || bulkDeleteModal || successModalOpen,
  });

  const filteredData = useGlobalFilter(unitsList, globalSearch, [
    "sr",
    "unitTypeName",
    "unitName",
    "unitShortName",
  ]);

  //  Table Columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 80,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Unit Type",
      dataIndex: "unitTypeName",
      sorter: (a, b) => a.unitTypeName.localeCompare(b.unitTypeName),
    },
    {
      title: "Unit Name",
      dataIndex: "unitName",
      sorter: (a, b) => a.unitName.localeCompare(b.unitName),
    },
    {
      title: "Short Name",
      dataIndex: "unitShortName",
      sorter: (a, b) =>
        (a.unitShortName || "").localeCompare(b.unitShortName || ""),
      render: (val) => val || "N/A",
    },
    {
      title: "Sequence No",
      dataIndex: "seqNo",
      sorter: (a, b) => a.seqNo - b.seqNo,
      width: 150,
      className: "text-center",
      render: (val) => val || "N/A",
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={isLoadingItem && record.unitId === editingId}
          isDeleteLoading={deletingId === record.key}
          darkMode={isDarkMode}
          onEdit={(rec) => setEditingId(rec.unitId)}
          onDelete={(rec) => handleDeleteClick(rec.key)}
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

        <PermissionGuard action="NEW">
          <CustomButton
            onClick={() => setAddModal(true)}
            icon={Redo}
            isDarkMode={isDarkMode}
            title={"Add Unit"}
            disabled={itemIsLoading}
            className={itemIsLoading ? "opacity-50 cursor-not-allowed" : ""}
          />
        </PermissionGuard>
      </div>

      <CustomTable
        loading={itemIsLoading}
        columns={columns}
        dataSource={filteredData}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search unit by name, type or code..."
        isDarkMode={isDarkMode}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <PermissionGuard action="DELETE">
                <CustomButton
                  icon={Trash2}
                  onClick={() => setBulkDeleteModal(true)}
                  disabled={bulkDeleting}
                  isDarkMode={isDarkMode}
                  title={`Delete Selected (${selectedRowKeys.length})`}
                  className="my-2"
                />
              </PermissionGuard>
            </div>
          )
        }
      />

      {/* Forms & Modals */}
      <CustomModal isOpen={addModal} isDarkMode={isDarkMode}>
        <h2
          className={`flex items-center gap-2 text-lg font-semibold mb-4 ${
            isDarkMode ? "text-purple-400" : "text-primary-600"
          }`}
        >
          <Edit size={18} />
          {newItem.unitId ? "Edit Unit" : "Add Unit"}
        </h2>

        <div className="space-y-4">
          <SelectDropDown
            id="unitTypeId"
            ref={firstInputRef}
            label="Unit Type"
            value={newItem.unitTypeId}
            placeholder={typesLoading ? "Loading Types..." : "Select Unit Type"}
            required
            options={unitTypes.map((type) => ({
              label: type.criteriaName,
              value: type.criteriaSubTypeId,
            }))}
            onChange={(value) =>
              setNewItem({
                ...newItem,
                unitTypeId: value,
              })
            }
          />

          <CustomInput
            id="unitName"
            label="Unit Name"
            value={newItem.unitName}
            placeholder="e.g. Kilogram"
            required
            onChange={(e) =>
              setNewItem({
                ...newItem,
                unitName: e.target.value,
              })
            }
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <CustomInput
              id="unitShortName"
              label="Short Name"
              value={newItem.unitShortName}
              placeholder="e.g. KG"
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  unitShortName: e.target.value,
                })
              }
            />

            <CustomInput
              id="seqNo"
              label="Sequence No"
              type="number"
              value={newItem.seqNo}
              placeholder="Display order"
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  seqNo: e.target.value,
                })
              }
            />
          </div>
        </div>

        <ModalActionButtons
          onCancel={handleCloseModal}
          onSubmit={handleAddItem}
          isDarkMode={isDarkMode}
          isSubmitting={savingIsPending}
          submitText={newItem.unitId ? "Update" : "Save"}
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
        title={`${selectedRowKeys.length} selected units`}
        loading={bulkDeleting}
        onConfirm={() => bulkDelete(selectedRowKeys)}
        onCancel={() => setBulkDeleteModal(false)}
      />

      {/* Success Delete Modal */}
      <SuccessModal
        open={successModalOpen}
        message="Unit deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default UnitPage;
