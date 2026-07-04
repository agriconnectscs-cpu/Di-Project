import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Table, DatePicker, Empty } from "antd";
import { Trash2, Redo, Edit, Calendar } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import SearchBar from "../../../../components/SearchBar";
import CustomInput from "../../../../components/CustomInput";
import SuccessModal from "../../../../components/SuccessModal";
import ActionButtons from "../../../../components/ActionButtons";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../components/SelectDropDown";
import CustomButton from "../../../../components/common/CustomButton";
import GetListError from "../../../../components/common/GetListError";
import CustomDeleteModal from "../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../components/ModalActionButtons";

import { useTheme } from "../../../../ThemeProvider";
import { handleApiResponse } from "../../../../utils/handleApiResponse";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import useGlobalFilter from "../../../../hooks/useGlobalFilter";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";
import { usePagePermissions } from "../../../../permissions";
// Imports End-----

const TaxPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const [editingRecordId, setEditingRecordId] = useState(null);

  const defaultDetailRow = {
    taxDetailId: 0,
    taxId: 0,
    taxName: "",
    taxPercent: 0,
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: "",
    rowVersionLong: 0,
  };

  const initialItem = {
    taxId: 0,
    taxTypeId: null,
    taxDescription: "",
    taxTypeName: "",
    taxDetailRequests: [{ ...defaultDetailRow }],
    deletedTaxDetailRequests: [],
    rowVersionLong: 0,
  };

  const [item, setItem] = useState(initialItem);

  // Fetch Tax Types for dropdown
  const { data: taxTypes = null, isLoading: taxTypesLoading } = useQuery({
    queryKey: ["taxTypeList", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DBO/Data/GetCriteriaForTaxType", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      const result = await handleApiResponse(res, "Failed to load tax types");
      return Array.isArray(result?.data) ? result.data : [];
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch Tax List
  const {
    data: taxList = [],
    isLoading: isLoadingList,
    isError,
    error,
  } = useQuery({
    queryKey: ["taxList", loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch("/api/DI/Tax/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res, "Failed to load taxes");
      return Array.isArray(result?.data) ? result.data : [];
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch Single Record for Edit
  const { data: taxDetails, isFetching: isFetchingDetails } = useQuery({
    queryKey: ["taxDetails", editingRecordId, loginAccessToken],
    enabled: !!editingRecordId && !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch(`/api/DI/Tax/GetById?Id=${editingRecordId}`, {
        method: "GET",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      const result = await handleApiResponse(res, "Failed to fetch details");
      return result?.data;
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (taxDetails && editingRecordId && !isFetchingDetails) {
      if (!permission(canEdit, "No permission to edit tax")) {
        setEditingRecordId(null);
        return;
      }
      setItem({
        ...initialItem,
        ...taxDetails,
        taxDetailRequests: Array.isArray(taxDetails.taxDetailRequests)
          ? taxDetails.taxDetailRequests
          : [],
        deletedTaxDetailRequests: [],
      });
      setAddModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxDetails, editingRecordId, isFetchingDetails]);

  // Save Mutation
  const { mutate: saveItem, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
      console.log(payload);

      const res = await fetch("/api/DI/Tax/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(payload),
      });

      return handleApiResponse(res, "Failed to save tax");
    },
    onSuccess: (result) => {
      toast.success(result?.message || "Tax saved successfully");
      queryClient.invalidateQueries({ queryKey: ["taxList"] });
      queryClient.removeQueries({ queryKey: ["taxDetails"] });
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message || "Error saving tax");
    },
  });

  const handleSave = () => {
    if (!item.taxTypeId || !item.taxDescription) {
      toast.error("Please fill required fields (Tax Type, Description)");
      return;
    }

    const payload = {
      ...item,
      taxId: Number(item.taxId) || 0,
      taxTypeId: Number(item.taxTypeId) || 0,
      taxDetailRequests: (Array.isArray(item.taxDetailRequests)
        ? item.taxDetailRequests
        : []
      ).map((detail) => ({
        ...detail,
        taxDetailId: Number(detail.taxDetailId) || 0,
        taxId: Number(item.taxId) || 0,
        taxPercent: Number(detail.taxPercent) || 0,
        taxName: detail.taxName || "",
        dateFrom:
          detail.dateFrom && detail.dateFrom !== "null"
            ? dayjs(detail.dateFrom).toISOString()
            : "null",
        dateTo:
          detail.dateTo && detail.dateTo !== "null"
            ? dayjs(detail.dateTo).toISOString()
            : null,
      })),
      deletedTaxDetailRequests: (Array.isArray(item.deletedTaxDetailRequests)
        ? item.deletedTaxDetailRequests
        : []
      ).map((detail) => ({
        ...detail,
        taxDetailId: Number(detail.taxDetailId) || 0,
        taxId: Number(item.taxId) || 0,
        taxPercent: Number(detail.taxPercent) || 0,
      })),
    };

    saveItem(payload);
  };

  // Delete Mutation
  const { mutate: deleteTax } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/DI/Tax/DeleteById?Id=${id}`, {
        method: "DELETE",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      return handleApiResponse(res, "Failed to delete tax");
    },
    onSuccess: (result) => {
      toast.success(result?.message || "Tax deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["taxList"] });
      setConfirmModal({ open: false, id: null });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Error deleting tax");
      setDeletingId(null);
    },
  });

  const handleCloseModal = () => {
    setAddModal(false);
    setItem(initialItem);
    setEditingRecordId(null);
    queryClient.removeQueries({ queryKey: ["taxDetails"] });
  };

  const addDetailRow = () => {
    setItem((prev) => ({
      ...prev,
      taxDetailRequests: [
        ...prev.taxDetailRequests,
        { ...defaultDetailRow, taxId: prev.taxId },
      ],
    }));
  };

  const updateDetailRow = (index, field, value) => {
    setItem((prev) => {
      const updated = [...prev.taxDetailRequests];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, taxDetailRequests: updated };
    });
  };

  const removeDetailRow = (index) => {
    setItem((prev) => {
      const updated = [...prev.taxDetailRequests];
      const removed = updated.splice(index, 1)[0];
      const deleted = [...prev.deletedTaxDetailRequests];
      if (removed.taxDetailId > 0) {
        deleted.push(removed);
      }
      return {
        ...prev,
        taxDetailRequests: updated,
        deletedTaxDetailRequests: deleted,
      };
    });
  };

  // Handle body scroll locking
  useEffect(() => {
    const isAnyModalOpen = addModal || confirmModal.open || successModalOpen;
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [addModal, confirmModal.open, successModalOpen]);

  // Filtering
  const filteredData = useGlobalFilter(taxList, globalSearch, [
    "taxTypeName",
    "taxDescription",
  ]);

  // Close modal on Escape
  useCloseOnEscape(addModal, handleCloseModal);

  const columns = [
    {
      title: "Sr.",
      width: 60,
      className: "text-center",
      render: (_, __, i) => i + 1,
    },
    {
      title: "Tax Type",
      dataIndex: "taxTypeName",

      sorter: (a, b) =>
        (a.taxTypeName || "").localeCompare(b.taxTypeName || ""),
    },
    {
      title: "Description",
      dataIndex: "taxDescription",

      sorter: (a, b) =>
        (a.taxDescription || "").localeCompare(b.taxDescription || ""),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          darkMode={isDarkMode}
          isEditLoading={
            editingRecordId === record.taxId ||
            (editingRecordId === record.taxId && isFetchingDetails)
          }
          isDeleteLoading={deletingId === record.taxId}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit tax")) return;
            setEditingRecordId(rec.taxId);
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, "No permission to delete tax")) return;
            setConfirmModal({ open: true, id: rec.taxId });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb title="Tax Configuration" />

        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add new tax")) return;
            setItem(initialItem);
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title={"Add Tax"}
          disabled={isLoadingList}
          className={isLoadingList ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>

      <Table
        loading={isLoadingList}
        columns={columns}
        dataSource={filteredData}
        rowKey="taxId"
        scroll={{ x: true }}
        bordered
        rowClassName={() =>
          "hover:bg-[#1b122b]/30 !h-10 [&>td]:!py-1.5 [&>td]:!px-2"
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
              placeholder="Search taxes..."
            />
          </div>
        )}
        locale={{
          emptyText: isError ? (
            <GetListError isError={isError} message={error?.message} />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "#9ca3af" }}>No data</span>}
            />
          ),
        }}
      />

      <AnimatePresence>
        {addModal && (
          <Motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
              isDarkMode ? "bg-black/50" : "bg-gray/10"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className={`w-full h-full sm:w-[90%] sm:h-auto sm:max-w-3xl sm:rounded-xl sm:max-h-[90vh] shadow-2xl px-4 py-6 sm:px-6 border-0 sm:border overflow-y-auto overflow-x-hidden ${
                isDarkMode
                  ? "bg-[#1A162B] text-white sm:border-purple-600/10"
                  : "bg-white text-gray-800 sm:border-gray-200"
              }`}
              style={{ scrollbarWidth: "none" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`flex items-center gap-2 text-lg font-semibold ${
                    isDarkMode ? "text-purple-400" : "text-primary-600"
                  }`}
                >
                  <Edit size={18} />
                  {item.taxId ? "Edit Tax" : "Add Tax"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectDropDown
                    label="Tax Type"
                    value={item.taxTypeId}
                    placeholder="Choose Tax Type"
                    required
                    loading={taxTypesLoading}
                    options={
                      Array.isArray(taxTypes)
                        ? taxTypes.map((b) => ({
                            label: b.criteriaName,
                            value: b.criteriaSubTypeId,
                          }))
                        : []
                    }
                    onChange={(val) => {
                      const selectedType = Array.isArray(taxTypes)
                        ? taxTypes.find((b) => b.criteriaSubTypeId === val)
                        : null;
                      setItem({
                        ...item,
                        taxTypeId: val,
                        taxTypeName: selectedType?.criteriaName || "",
                      });
                    }}
                  />

                  <CustomInput
                    label="Tax Description"
                    value={item.taxDescription}
                    placeholder="Enter description"
                    required
                    onChange={(e) =>
                      setItem({ ...item, taxDescription: e.target.value })
                    }
                  />
                </div>

                <div
                  className={`p-4 rounded-xl border border-dashed ${
                    isDarkMode
                      ? "bg-white/2 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row items-center justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-2">
                      <Calendar size={14} className="text-purple-500" />
                      Tax Rates Schedule
                    </p>

                    <button
                      onClick={addDetailRow}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all outline-none focus:ring-2 focus:ring-purple-500/40 ${
                        isDarkMode
                          ? "bg-purple-600/10 text-purple-400 hover:bg-purple-600/20"
                          : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                      }`}
                    >
                      <Redo size={12} />
                      Add Tax Rate
                    </button>
                  </div>

                  <div className="space-y-3 pr-1">
                    {(Array.isArray(item.taxDetailRequests)
                      ? item.taxDetailRequests
                      : []
                    ).map((cfg, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 border relative ${
                          isDarkMode
                            ? "bg-black/10 border-white/5"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${
                              isDarkMode
                                ? "text-purple-400/70"
                                : "text-purple-500/70"
                            }`}
                          >
                            Rate Entry #{idx + 1}
                          </span>
                          {item.taxDetailRequests.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDetailRow(idx)}
                              title="Remove row"
                              className={`p-1.5 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                isDarkMode
                                  ? "bg-[#1a1129] border-[#5a1f1f] text-red-400 hover:bg-red-900/30 hover:border-red-500 hover:text-red-300"
                                  : "bg-white border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                              } shadow-sm`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <CustomInput
                            label="Tax Name"
                            value={cfg.taxName || ""}
                            onChange={(e) =>
                              updateDetailRow(idx, "taxName", e.target.value)
                            }
                            placeholder="e.g. GST, WHT"
                          />
                          <CustomInput
                            label="Tax Percent (%)"
                            type="number"
                            value={cfg.taxPercent || ""}
                            onChange={(e) =>
                              updateDetailRow(idx, "taxPercent", e.target.value)
                            }
                            placeholder="e.g. 15"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <p
                              className={`text-[11px] font-medium mb-1 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              From Date
                            </p>
                            <DatePicker
                              format="DD-MM-YYYY"
                              placeholder="From Date"
                              allowClear
                              className={`custom-datepicker w-full! ${
                                isDarkMode
                                  ? "bg-black/10! border-gray-700! text-white!"
                                  : "bg-gray-100/50! border-gray-300! text-gray-900!"
                              }`}
                              value={
                                cfg.dateFrom && cfg.dateFrom !== "null"
                                  ? dayjs(cfg.dateFrom)
                                  : null
                              }
                              onChange={(date) =>
                                updateDetailRow(
                                  idx,
                                  "dateFrom",
                                  date ? date.format("YYYY-MM-DD") : "null",
                                )
                              }
                            />
                          </div>
                          <div>
                            <p
                              className={`text-[11px] font-medium mb-1 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              To Date
                            </p>
                            <DatePicker
                              format="DD-MM-YYYY"
                              placeholder="To Date"
                              allowClear
                              disabled
                              className={`custom-datepicker w-full! ${
                                isDarkMode
                                  ? "bg-black/10! border-gray-700! text-white!"
                                  : "bg-gray-100/50! border-gray-300! text-gray-900!"
                              }`}
                              value={
                                cfg.dateTo && cfg.dateTo !== "null"
                                  ? dayjs(cfg.dateTo)
                                  : null
                              }
                              onChange={(date) =>
                                updateDetailRow(
                                  idx,
                                  "dateTo",
                                  date ? date.format("YYYY-MM-DD") : "",
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <ModalActionButtons
                onCancel={handleCloseModal}
                onSubmit={handleSave}
                isDarkMode={isDarkMode}
                isSubmitting={isSaving}
                submitText={item.taxId ? "Update" : "Save"}
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        onConfirm={() => {
          if (!permission(canDelete, "No permission to delete tax")) {
            setConfirmModal({ open: false, id: null });
            return;
          }
          setDeletingId(confirmModal.id);
          deleteTax(confirmModal.id);
        }}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />

      <SuccessModal
        open={successModalOpen}
        message="Record processed successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default TaxPage;
