import { Table } from "antd";
import toast from "react-hot-toast";
import { Edit, Redo } from "lucide-react";
import { useEffect, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../../../ThemeProvider";

import { usePagePermissions } from "../../../../../permissions";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { useGetRoles } from "../../../../../hooks/useGetRoles";
import { useCloseOnEscape } from "../../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../../components/SearchBar";
import CustomInput from "../../../../../components/CustomInput";
import SuccessModal from "../../../../../components/SuccessModal";
import ActionButtons from "../../../../../components/ActionButtons";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import CustomButton from "../../../../../components/common/CustomButton";
import LoadingSpinner from "../../../../../components/common/LoadingSpinner";
import CustomDeleteModal from "../../../../../components/CustomDeleteModal";
// Imports End-----

const RolePage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canAdd, canDelete, canEdit, permission } = usePagePermissions();

  const [globalSearch, setGlobalSearch] = useState("");
  const [modalSearch, setModalSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const [newItem, setNewItem] = useState({
    roleId: "",
    appClientProductTypeId: "",
    roleName: "",
    rowVersionLong: "",
    roleLocationRequests: [
      {
        roleLocationId: "",
        roleId: "",
        clientLocationId: "",
        rowVersionLong: "",
        locationName: "",
        locationAddress: "",
        locationTypeName: "",
      },
    ],
    deletedRoleLocationRequests: [],
  });

  const { data: roleList = [], isLoading: rolesIsLoading } = useGetRoles();

  //  Get Client Location
  const { data: locationList = [], isLoading: isLocationLoading } = useQuery({
    queryKey: ["locationList", loginAccessToken, newItem.roleId],
    queryFn: async () => {
      const res = await fetch(
        `/api/ADM/Role/GetDetailForClientLocations?RoleId=${
          newItem.roleId || 0
        }`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
            accept: "text/plain",
          },
        },
      );

      if (!res.ok) throw new Error("Unauthorized or failed request");

      const result = await res.json();
      return result.data.map((item, index) => ({
        key: String(item.clientLocationId),
        sr: index + 1,
        clientLocationId: item.clientLocationId,
        roleLocationId: item.roleLocationId,
        locationName: item.locationName,
        locationTypeName: item.locationTypeName,
        locationAddress: item.locationAddress,
        isChecked: Boolean(item.isChecked),
      }));
    },
    onError: (err) => toast.error(err.message),

    enabled: addModal,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!addModal || locationList.length === 0) return;

    const selectedKeys = locationList
      .filter((loc) => loc.isChecked)
      .map((loc) => String(loc.clientLocationId));

    setSelectedRowKeys(selectedKeys);
  }, [locationList, addModal]);

  //  Save / Update Item Mutation
  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/Role/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = result?.message || "Failed to save record";
        throw new Error(message);
      }

      return result;
    },

    onSuccess: (result) => {
      toast.success(result?.message);
      queryClient.invalidateQueries(["roleList"]);
      handleCloseModal();
    },

    onError: (err) => {
      toast.error(err.message || "Error saving record");
    },

    retry: false,
  });

  const handleAddItem = () => {
    const { roleId, roleName } = newItem;

    if (!roleName?.trim()) {
      toast.error("Please fill role name");
      return;
    }
    if (selectedRowKeys.length === 0) {
      toast.error("Please select at least one location");
      return;
    }

    const deletedLocationKeys = locationList
      .filter((loc) => loc.isChecked && !selectedRowKeys.includes(loc.key))
      .map((loc) => ({
        roleLocationId: loc.roleLocationId,
        roleId: loc.roleId,
        clientLocationId: loc.clientLocationId,
        rowVersionLong: loc.rowVersionLong,
        locationName: loc.locationName,
        locationAddress: loc.locationAddress,
        locationTypeName: loc.locationTypeName,
      }));

    const selectedLocations = locationList
      .filter((loc) => selectedRowKeys.includes(loc.key))
      .map((loc) => ({
        roleLocationId: loc.roleLocationId || 0,
        roleId: roleId || 0,
        clientLocationId: loc.clientLocationId,
        rowVersionLong: loc.rowVersionLong || 0,
        locationName: loc.locationName,
        locationAddress: loc.locationAddress,
        locationTypeName: loc.locationTypeName,
      }));

    saveItem({
      roleId: roleId || 0,
      roleName: roleName.trim(),
      roleLocationRequests: selectedLocations,
      deletedRoleLocationRequests: roleId ? deletedLocationKeys : [],
    });
  };

  //  Delete Item Mutation
  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/ADM/Role/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = result.message;
        throw new Error(message);
      }

      return id;
    },

    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries(["roleList"]);
    },

    onError: (err) => toast.error(err.message),
  });

  const handleDeleteClick = (id) => setConfirmModal({ open: true, id });
  const handleCancelDelete = () => setConfirmModal({ open: false, id: null });

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    if (!permission(canDelete, "No permission to delete role")) {
      setConfirmModal({ open: false, id: null });
      return;
    }
    setDeletingId(confirmModal.id);
    deleteItem(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({ open: false, id: null });
  };

  const handleCloseModal = () => {
    setAddModal(false);
    setNewItem({
      roleId: "",
      roleName: "",
      roleLocationRequests: [],
    });
    setSelectedRowKeys([]);
  };

  // Close modal on Escape
  useCloseOnEscape(addModal, handleCloseModal);

  // Filtered Data For Table
  const filteredData = roleList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.roleName?.toLowerCase().includes(search)
    );
  });

  const modalData = locationList?.filter((item) => {
    const search = modalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.locationAddress?.toLowerCase().includes(search) ||
      item.locationName?.toString().includes(search) ||
      item.locationTypeName?.toString().includes(search)
    );
  });

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
      title: "Role",
      dataIndex: "roleName",
      sorter: (a, b) => a.roleName.localeCompare(b.roleName),
    },

    {
      title: "Action",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={record.roleId === newItem.roleId}
          isDeleteLoading={deletingId === record.key}
          darkMode={isDarkMode}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit role")) return;
            const record = roleList.find((item) => item.roleId === rec.roleId);

            if (!record) {
              toast.error("Record not found");
              return;
            }

            setNewItem({
              roleId: record.roleId,
              roleName: record.roleName,
              appClientProductTypeId: record.appClientProductTypeId || "",
              rowVersionLong: record.rowVersionLong || "",
              roleLocationRequests: [],
              deletedRoleLocationRequests: [],
            });

            setAddModal(true);
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, "No permission to delete role")) return;
            handleDeleteClick(rec.key);
          }}
        />
      ),
    },
  ];

  const modalColumns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 80,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Location",
      dataIndex: "locationName",
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
    },
    {
      title: "Type",
      dataIndex: "locationTypeName",
      width: 300,
      sorter: (a, b) => a.locationTypeName.localeCompare(b.locationTypeName),
    },
    {
      title: "Address",
      dataIndex: "locationAddress",
      width: 300,
      sorter: (a, b) => a.locationAddress.localeCompare(b.locationAddress),
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
            if (!permission(canAdd, "No permission to add role")) return;
            setNewItem({
              roleId: "",
              roleName: "",
              roleLocationRequests: [],
            });
            setSelectedRowKeys([]);
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title={"Add New Role"}
          disabled={rolesIsLoading}
          className={rolesIsLoading ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>

      <Table
        loading={rolesIsLoading}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: true }}
        bordered
        rowClassName={() =>
          "hover:bg-[#1b122b]/30 !h-11 [&>td]:!py-1.5 [&>td]:!px-2"
        }
        pagination={{
          total: filteredData?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
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
              placeholder="Search Role..."
            />
          </div>
        )}
      />

      <AnimatePresence>
        {addModal && (
          <Motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-sm ${
              isDarkMode ? "bg-black/50" : "bg-gray/10"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className={` text-white w-[90%] max-w-3xl max-h-screen rounded-xl shadow-2xl px-3 py-8 sm:py-6 sm:px-6 border border-purple-500/30 ${
                isDarkMode
                  ? "bg-[#0D0C1A] text-white border border-purple-600/10"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2
                className={`flex items-center gap-2 text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-purple-400" : "text-primary-600"
                }`}
              >
                <Edit size={18} />
                {newItem.roleId ? "Edit Role" : "Add New Role"}
              </h2>

              <div className="space-y-2">
                <div className="mb-2">
                  <CustomInput
                    id="roleName"
                    label="Role"
                    value={newItem.roleName}
                    placeholder="Add Role Name"
                    required
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        roleName: e.target.value,
                      })
                    }
                  />
                </div>

                <Table
                  loading={isLocationLoading}
                  columns={modalColumns}
                  dataSource={modalData}
                  scroll={{ x: true }}
                  bordered
                  rowClassName={() =>
                    "hover:bg-[#1b122b]/30 !h-11 [&>td]:!py-1.5 [&>td]:!px-2"
                  }
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
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
                    total: modalData?.length || 0,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    defaultPageSize: 10,
                  }}
                  title={() => (
                    <div className="flex items-center justify-between">
                      <div
                        className={`text-md mt-2 sm:mt-1 font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Total Records: {modalData?.length || 0}
                      </div>

                      <SearchBar
                        value={modalSearch}
                        onChange={setModalSearch}
                        placeholder="Search Role..."
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={handleCloseModal}
                  className={`px-5 py-1 rounded-full border transition-all duration-300 cursor-pointer ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 hover:bg-[#2a1b3d]"
                      : "border-gray-300 text-gray-700 hover:text-white hover:bg-purple-600 hover:border-purple-500"
                  }`}
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddItem}
                  className={`px-5 py-1 rounded-full text-white transition cursor-pointer ${
                    isPending
                      ? "bg-purple-800 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isPending ? <LoadingSpinner content="Saving..." /> : "Save"}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Single Delete Modal */}
      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <SuccessModal
        open={successModalOpen}
        message="Role deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default RolePage;
