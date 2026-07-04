/* eslint-disable react-hooks/exhaustive-deps */
import { Popover } from "antd";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Redo,
  Edit,
  X,
  Search,
  ShieldCheck,
  Loader,
} from "lucide-react";

import { useTheme } from "../../../../ThemeProvider";
import { handleApiResponse } from "../../../../utils/handleApiResponse";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useGetBuyer } from "../../../../hooks/useGetBuyer";
import useGlobalFilter from "../../../../hooks/useGlobalFilter";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";
import { useShortcutManager } from "../../../../hooks/useShortcutManager";

import { usePagePermissions } from "../../../../permissions";

import BuyerSettingsModal from "./BuyerSettingsModal";

import CustomTable from "../../../../components/CustomTable";
import CustomModal from "../../../../components/CustomModal";
import CustomInput from "../../../../components/CustomInput";
import CustomUpload from "../../../../components/CustomUpload";
import SuccessModal from "../../../../components/SuccessModal";
import ActionButtons from "../../../../components/ActionButtons";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../components/SelectDropDown";
import CustomButton from "../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../components/CustomDeleteModal";
import ModalActionButtons from "../../../../components/ModalActionButtons";
// Imports End ----------------

const BuyerRegistrationPage = () => {
  const queryClient = useQueryClient();

  const { loginAccessToken } = useGetAuth();
  const { isDarkMode } = useTheme();

  const { canAdd, canEdit, canDelete, permission } = usePagePermissions();

  const [addModal, setAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [deletingId, setDeletingId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [fbrData, setFbrData] = useState(null);
  const [loadingSettingsId, setLoadingSettingsId] = useState(null);
  const [settingsModal, setSettingsModal] = useState({
    open: false,
    party: null,
  });

  const defaultLocation = {
    partyLocationId: 0,
    partyId: 0,
    locationTypeId: 0,
    partyLocationName: "",
    partyLocationCode: "",
    shortName: "",
    seqNo: 0,
    registeredOn: new Date().toISOString(),
    isActive: true,
    rowVersionLong: 0,
    addressDIRequest: {
      addressId: 0,
      addressTypeId: 0,
      countryId: 0,
      provinceId: 0,
      cityId: 0,
      addressDetail: "",
      areaName: "",
      phoneNo: "",
      rowVersionLong: 0,
    },
  };

  const [item, setNewItem] = useState({
    partyId: 0,
    partyCategoryId: "",
    partyRegistrationTypeId: "",
    currencyId: "",
    partyName: "",
    gst: "",
    ntn: "",
    partyCode: "",
    logoImageURL: "",
    partyLocationDIRequests: [defaultLocation],
    deletedPartyLocationDIRequests: [],
  });

  //  Fetch Data
  const {
    data: itemList = [],
    isLoading: listLoading,
    isError,
    error,
  } = useGetBuyer();

  // Fetch Form data for dropdowns
  const { data: formData } = useQuery({
    queryKey: ["buyerFormData"],
    queryFn: async () => {
      const res = await fetch("/api/CRM/Buyer/GetFormData", {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      return handleApiResponse(res, "Failed to fetch form data");
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch Party Registration Types
  const { data: partyRegistrationTypes } = useQuery({
    queryKey: ["partyRegistrationTypes"],
    queryFn: async () => {
      const res = await fetch(
        "/api/DBO/Data/GetCriteriaForPartyRegistrationType",
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return handleApiResponse(res, "Failed to fetch registration types");
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const partyRegTypes = partyRegistrationTypes?.data || [];
  const selectedRegType = partyRegTypes?.find(
    (t) => t.criteriaSubTypeId === item.partyRegistrationTypeId,
  );
  const regTypeName = selectedRegType?.criteriaName || "";

  const partyCategory =
    formData?.data?.partyCategoryRequests?.filter(
      (c) => c.controlCategoryPrefix === "CUSPTY",
    ) || [];
  const currency = formData?.data?.currencyRequests || [];
  const locationType = formData?.data?.locationTypeRequests || [];
  const country = formData?.data?.countryRequests || [];
  const province = formData?.data?.provinceRequests || [];
  const city = formData?.data?.cityRequests || [];

  // Get Registration Type Mutation
  const {
    mutate: getRegistrationType,
    isPending: isVerifying,
    reset: resetVerification,
  } = useMutation({
    mutationFn: async (registrationNo) => {
      setFbrData(null);
      const res = await fetch("/api/CRM/FBRData/GetRegTypeAndTaxStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({ Registration_No: registrationNo }),
      });

      return handleApiResponse(res, "Failed to fetch registration info");
    },

    onSuccess: (res) => {
      if (res.data) {
        setFbrData(res.data);
        toast.success(res.message || "Record successfully loaded");
      } else {
        setFbrData(null);
        toast.error("No valid record found for this number");
      }
    },
    onError: (err) => {
      setFbrData(null);
      toast.error(err.message || "An error occurred during verification");
    },
  });

  // Fetch single Party by ID
  const { data: itemById, isLoading: itemByIdisLoading } = useQuery({
    queryKey: ["itemById", item.partyId],
    enabled: !!item.partyId,

    queryFn: async () => {
      const res = await fetch(`/api/CRM/Buyer/GetById?Id=${item.partyId}`, {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      return handleApiResponse(res, "Failed to fetch party details");
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const p = itemById?.data;
    if (!p) return;

    const normalizedLocations =
      Array.isArray(p.partyLocationDIRequests) &&
      p.partyLocationDIRequests.length > 0
        ? p.partyLocationDIRequests
            .map((loc) => ({
              ...defaultLocation,
              ...loc,
              partyId: loc.partyId ?? p.partyId,
              addressDIRequest: {
                ...defaultLocation.addressDIRequest,
                ...loc.addressDIRequest,
              },
            }))
            .sort((a, b) => a.partyLocationId - b.partyLocationId)
        : [
            {
              ...defaultLocation,
              addressDIRequest: { ...defaultLocation.addressDIRequest },
            },
          ];

    setNewItem({
      partyId: p.partyId ?? 0,
      partyCategoryId: p.partyCategoryId ?? "",
      partyRegistrationTypeId: p.partyRegistrationTypeId ?? "",
      currencyId: p.currencyId ?? "",
      partyName: p.partyName ?? "",
      partyCode: p.partyCode ?? "",
      gst: p.gst ?? "",
      ntn: p.ntn ?? "",
      cnic: p.cnic ?? "",
      partyLocationDIRequests: normalizedLocations,
      logoImageURL: p.logoImageURL ?? "",
      fileBase64String: "",
      fileName: "",
    });

    setAddModal(true);
  }, [itemById]);

  // Fetch Auto Party Code
  const { data: autoPartyCode } = useQuery({
    queryKey: ["getAutoPartyCode"],
    queryFn: async () => {
      const res = await fetch("/api/CRM/Buyer/GetAutoPartyCode", {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      return handleApiResponse(res, "Failed to fetch auto party code");
    },
    enabled: addModal && item.partyId === 0,
    refetchOnWindowFocus: false,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (addModal && item.partyId === 0 && autoPartyCode?.data) {
      setNewItem((prev) => ({ ...prev, partyCode: autoPartyCode.data }));
    }
  }, [autoPartyCode, addModal, item.partyId]);

  // auto select currency, country in locations, and registration type
  useEffect(() => {
    if (addModal && item.partyId === 0) {
      setNewItem((prev) => {
        let hasUpdates = false;
        const updates = { ...prev };

        // Auto select Unregistered Registration Type
        if (!prev.partyRegistrationTypeId && partyRegTypes?.length > 0) {
          const unregisteredType = partyRegTypes.find(
            (t) => t.criteriaName === "Unregistered",
          );
          if (unregisteredType) {
            updates.partyRegistrationTypeId =
              unregisteredType.criteriaSubTypeId;
            updates.ntn = "0000000000000";
            hasUpdates = true;
          }
        }

        // Auto select Currency
        if (currency?.length === 1 && !prev.currencyId) {
          updates.currencyId = currency[0].currencyId;
          hasUpdates = true;
        }

        // Auto select Country in locations
        if (country?.length === 1) {
          const updatedLocations = prev.partyLocationDIRequests.map((loc) => {
            if (!loc.addressDIRequest.countryId) {
              hasUpdates = true;
              return {
                ...loc,
                addressDIRequest: {
                  ...loc.addressDIRequest,
                  countryId: country[0].countryId,
                },
              };
            }
            return loc;
          });
          if (hasUpdates) updates.partyLocationDIRequests = updatedLocations;
        }

        return hasUpdates ? updates : prev;
      });
    }
  }, [addModal, currency, country, partyRegTypes, item.partyId]);

  //  Save / Update Buyer Mutation
  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/CRM/Buyer/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, "Error saving record");
    },

    onSuccess: (result) => {
      toast.success(result?.message);
      queryClient.invalidateQueries(["buyerList"]);
      handleCloseModal();
    },

    onError: (err) => toast.error(err.message || "Error saving record"),
    retry: false,
  });

  const handleAddBuyer = () => {
    const payload = {
      partyId: Number(item.partyId) || 0,
      partyCategoryId: Number(item.partyCategoryId) || 0,
      partyRegistrationTypeId: Number(item.partyRegistrationTypeId) || 0,
      currencyId: Number(item.currencyId) || 0,
      partyName: item.partyName || "",
      partyCode: item.partyCode || "",
      gst: item.gst || "",
      ntn: item.ntn || "",
      cnic: item.cnic || "",
      logoImageURL: item.logoImageURL || "",
      fileBase64String: item.fileBase64String || "",
      fileName: item.fileName || "",
      partyLocationDIRequests: item.partyLocationDIRequests.map((loc) => ({
        partyLocationId: Number(loc.partyLocationId) || 0,
        partyId: Number(item.partyId) || 0,
        locationTypeId: Number(loc.locationTypeId) || 0,
        partyLocationName: loc.partyLocationName || "",
        partyLocationCode: loc.partyLocationCode || "",
        shortName: loc.shortName || "",
        seqNo: Number(loc.seqNo) || 0,
        registeredOn: loc.registeredOn || new Date().toISOString(),
        isActive: Boolean(loc.isActive),
        rowVersionLong: Number(loc.rowVersionLong) || 0,

        addressDIRequest: {
          addressId: Number(loc.addressDIRequest.addressId) || 0,
          addressTypeId: Number(loc.addressDIRequest.addressTypeId) || 0,
          countryId: Number(loc.addressDIRequest.countryId) || 0,
          provinceId: Number(loc.addressDIRequest.provinceId) || 0,
          cityId: Number(loc.addressDIRequest.cityId) || 0,
          addressDetail: loc.addressDIRequest.addressDetail || "",
          areaName: loc.addressDIRequest.areaName || "",
          phoneNo: loc.addressDIRequest.phoneNo || "",
          rowVersionLong: Number(loc.addressDIRequest.rowVersionLong) || 0,
        },
      })),

      deletedPartyLocationDIRequests: item.deletedPartyLocationDIRequests || [],
    };

    saveItem(payload);
  };

  //  Delete Party Mutation
  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/CRM/Buyer/DeleteById?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });

      await handleApiResponse(res, "Failed to delete party");
      return id;
    },

    onSuccess: () => {
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["buyerList"] });
    },

    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete Party Mutation
  const { mutate: bulkDeleteItem, isPending: bulkDeleting } = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = selectedIds.map((id) => ({
        partyId: id,
        partyCategoryId: 0,
        currencyId: 0,
        partyName: "",
        partyCode: "",
        gst: "",
        ntn: "",
        cnic: "",
        logoImageURL: "",
        webSiteURL: "",
        totalLocations: 0,
        isActive: false,
        fileBase64String: "",
        fileName: "",
        rowVersionLong: 0,
        partyLocationRequests: [],
        deletedPartyLocationRequests: [],
      }));

      const res = await fetch("/api/DI/Buyer/DeleteAll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      await handleApiResponse(res, "Failed to delete buyer List");
      return selectedIds;
    },

    onSuccess: () => {
      setBulkDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ["buyerList"] });
      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
    },

    onError: (err) => toast.error(err.message),
  });

  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, "No permission to delete buyers")) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDeleteItem(selectedRowKeys);
  };

  /** Handlers */
  const handleDeleteClick = (id) => setConfirmModal({ open: true, id });

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    setDeletingId(confirmModal.id);
    deleteItem(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({ open: false, id: null });
  };

  const handleCancelDelete = () => setConfirmModal({ open: false, id: null });

  // Add a new location
  const handleAddLocation = () => {
    setNewItem((prev) => ({
      ...prev,
      partyLocationDIRequests: [
        ...prev.partyLocationDIRequests,
        JSON.parse(JSON.stringify(defaultLocation)),
      ],
    }));
  };

  // Remove a location
  const handleRemoveLocation = (index) => {
    setNewItem((prev) => {
      const updated = [...prev.partyLocationDIRequests];
      const removed = updated.splice(index, 1)[0];
      return {
        ...prev,
        partyLocationDIRequests: updated,
        deletedPartyLocationDIRequests: removed?.partyLocationId
          ? [...prev.deletedPartyLocationDIRequests, removed.partyLocationId]
          : prev.deletedPartyLocationDIRequests,
      };
    });
  };

  const handleCloseModal = () => {
    setAddModal(false);

    setFbrData(null);
    resetVerification();
    setNewItem({
      partyId: 0,
      partyCategoryId: "",
      partyRegistrationTypeId: "",
      currencyId: "",
      partyName: "",
      gst: "",
      ntn: "",
      partyCode: "",
      logoImageURL: "",
      partyLocationDIRequests: [
        {
          ...defaultLocation,
          addressDIRequest: { ...defaultLocation.addressDIRequest },
        },
      ],
      deletedPartyLocationDIRequests: [],
      fileBase64String: "",
      fileName: "",
    });
  };

  useCloseOnEscape(addModal, handleCloseModal);

  // Map party list for table
  const buyerList = itemList
    ? itemList.map((itemValue, i) => {
        let typeName = (
          itemValue.partyRegistrationTypeName ||
          partyRegTypes.find(
            (t) => t.criteriaSubTypeId === itemValue.partyRegistrationTypeId,
          )?.criteriaName ||
          ""
        ).trim();

        let regNo = "-";
        const hasGst =
          itemValue.gst &&
          itemValue.gst !== "N/A" &&
          itemValue.gst.trim() !== "";
        const hasCnic =
          itemValue.cnic &&
          itemValue.cnic !== "N/A" &&
          itemValue.cnic.trim() !== "";
        const hasNtn =
          itemValue.ntn &&
          itemValue.ntn !== "N/A" &&
          itemValue.ntn !== "0000000000000" &&
          itemValue.ntn.trim() !== "";

        const upperType = typeName.toUpperCase();
        const isCnicType = upperType.includes("CNIC");
        const isStnType =
          upperType.includes("STRN") || upperType.includes("GST");

        // Priority: Type Matching first
        if (isStnType && hasGst) {
          regNo = itemValue.gst;
        } else if (isCnicType && hasCnic) {
          regNo = itemValue.cnic;
        } else if (hasCnic) {
          regNo = itemValue.cnic;
          if (!typeName) typeName = "CNIC";
        } else if (hasGst) {
          regNo = itemValue.gst;
          if (!typeName) typeName = "STRN";
        } else if (hasNtn) {
          regNo = itemValue.ntn;
          if (!typeName) typeName = "NTN";
        }

        return {
          key: itemValue.partyId || i,
          sr: i + 1,
          partyId: itemValue.partyId || i,
          partyName: itemValue.partyName || "N/A",
          ntn: itemValue.ntn || "N/A",
          gst: itemValue.gst || "N/A",
          cnic: itemValue.cnic || "N/A",
          logoImage: itemValue.logoImage || "",
          partyCategoryName: itemValue.partyCategoryName || "N/A",
          controlCategoryName: itemValue.controlCategoryName || "N/A",
          partyRegistrationTypeName: typeName || "General",
          registrationNo: regNo,
        };
      })
    : [];

  const handleEditLastAdded = () => {
    if (buyerList.length > 0) {
      const firstItem = buyerList[0];
      setNewItem((prev) => ({ ...prev, partyId: firstItem.partyId }));
    }
  };

  const handleDeleteLastAdded = () => {
    if (buyerList.length > 0) {
      const firstItem = buyerList[0];
      handleDeleteClick(firstItem.key);
    }
  };

  const firstInputRef = useShortcutManager({
    isOpen: addModal,
    onOpen: () => setAddModal(true),
    onClose: handleCloseModal,
    onSubmit: handleAddBuyer,
    onEditLastAdded: handleEditLastAdded,
    onDeleteLastAdded: handleDeleteLastAdded,
    disableScrolling:
      confirmModal.open ||
      bulkDeleteModal ||
      successModalOpen ||
      settingsModal.open,
  });

  const filteredData = useGlobalFilter(buyerList, globalSearch, [
    "sr",
    "partyName",
    "partyCategoryName",
    "controlCategoryName",
    "ntn",
    "gst",
    "cnic",
    "partyRegistrationTypeName",
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
      title: "Logo",
      dataIndex: "logoImage",
      width: 80,
      align: "center",
      render: (url) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt="SubCategory"
              className="w-24 h-10 object-contain rounded cursor-zoom-in"
            />
          </a>
        ) : (
          <span className="text-gray-500 italic text-xs">No Image</span>
        ),
    },
    {
      title: "Buyer Name",
      dataIndex: "partyName",
      width: 220,
      ellipsis: true,
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
      render: (text) => (
        <span className="font-medium max-w-55 truncate" title={text}>
          {text}
        </span>
      ),
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
    },
    {
      title: "Registration Info",
      key: "registration_info",
      width: 135,
      render: (_, record) =>
        record.registrationNo !== "-" ? (
          <div className="flex flex-col">
            <span className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">
              {record.partyRegistrationTypeName || "Type Not Set"}
            </span>
            <span className="font-medium text-purple-600 dark:text-purple-400 truncate max-w-30 -mt-1">
              {record.registrationNo}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-[11px]">
            Not Registered
          </span>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={itemByIdisLoading && item.partyId === record.partyId}
          isDeleteLoading={deletingId === record.key}
          isSettingsLoading={loadingSettingsId === record.partyId}
          darkMode={isDarkMode}
          onEdit={(rec) => {
            if (!permission(canEdit, "No permission to edit buyer")) return;
            setNewItem((prev) => ({ ...prev, partyId: rec.partyId }));
          }}
          onDelete={(rec) => {
            if (!permission(canDelete, "No permission to delete buyer")) return;
            handleDeleteClick(rec.key);
          }}
          onSettings={(rec) => {
            if (!permission(canEdit, "No permission to edit buyer settings"))
              return;
            setLoadingSettingsId(rec.partyId);
            setTimeout(() => {
              setSettingsModal({ open: true, party: rec });
              setLoadingSettingsId(null);
            }, 500);
          }}
        />
      ),
    },
  ];

  const isFormValid = () => {
    if (
      !item.partyCategoryId ||
      !item.currencyId ||
      !item.partyName ||
      !item.partyCode ||
      !item.partyRegistrationTypeId
    )
      return false;

    if (regTypeName === "STRN" && !item.gst) return false;
    if (["NTN", "Unregistered"].includes(regTypeName)) {
      if (!item.ntn) return false;
      if (regTypeName === "NTN" && item.ntn?.length !== 7) return false;
    }
    if (regTypeName === "CNIC" && (!item.cnic || item.cnic?.length !== 13))
      return false;

    for (const loc of item.partyLocationDIRequests) {
      if (
        !loc.locationTypeId ||
        !loc.partyLocationName ||
        !loc.shortName ||
        !loc.addressDIRequest.countryId ||
        !loc.addressDIRequest.provinceId ||
        !loc.addressDIRequest.cityId ||
        !loc.addressDIRequest.addressDetail ||
        !loc.addressDIRequest.areaName ||
        !loc.addressDIRequest.phoneNo
      )
        return false;
    }

    return true;
  };

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        {/* 1 */}
        <Breadcrumb />

        {/* 2 */}
        <CustomButton
          onClick={() => {
            if (!permission(canAdd, "No permission to add buyer")) return;
            setAddModal(true);
          }}
          icon={Redo}
          isDarkMode={isDarkMode}
          title="Add Buyer"
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
        isError={isError}
        error={error}
        searchPlaceholder="Search Buyer..."
        isDarkMode={isDarkMode}
        rowKey="key"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            name: `party-${record.key}`,
            id: `party-${record.key}`,
          }),
        }}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end pr-2">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (!permission(canDelete, "No permission to delete buyers"))
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

      <CustomModal
        isOpen={addModal}
        isDarkMode={isDarkMode}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-6 right-6 text-gray-400 hover:text-purple-500 transition-transform duration-150 hover:rotate-180 cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2
          className={`flex items-center gap-2 text-2xl font-bold mb-6 ${
            isDarkMode ? "text-purple-400" : "text-(--primary-color)"
          }`}
        >
          <Edit size={22} />
          {item.partyId ? "Edit Buyer" : "Add Buyer"}
        </h2>

        {/* FORM SECTION */}
        <div className="space-y-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              {/* Basic Info */}
              <div
                className={` rounded-xl p-4 border space-y-4 shadow-md ${
                  isDarkMode
                    ? " bg-black/5 border-white/10"
                    : " border-black/10"
                }`}
              >
                <h2 className="text-xl font-semibold text-(--secondary-color)">
                  Basic Information
                </h2>

                <div className="grid grid-cols-2 gap-2">
                  <SelectDropDown
                    ref={firstInputRef}
                    id="partyCategory"
                    label="Buyer Category"
                    value={item.partyCategoryId}
                    placeholder="Select Category"
                    required
                    options={partyCategory?.map((type) => ({
                      label: type.partyCategoryName,
                      value: type.partyCategoryId,
                    }))}
                    onChange={(value) =>
                      setNewItem({ ...item, partyCategoryId: value })
                    }
                  />

                  <SelectDropDown
                    id="currencyId"
                    label="Currency"
                    className="col-span-1"
                    value={item.currencyId}
                    placeholder="Select Currency"
                    required
                    options={currency?.map((type) => ({
                      label: type.currencyName,
                      value: type.currencyId,
                    }))}
                    onChange={(value) =>
                      setNewItem({ ...item, currencyId: value })
                    }
                  />

                  <CustomInput
                    id="partyName"
                    label="Buyer Name"
                    placeholder="Enter Buyer Name"
                    required
                    value={item.partyName}
                    onChange={(e) =>
                      setNewItem({
                        ...item,
                        partyName: e.target.value,
                      })
                    }
                  />
                  <CustomInput
                    id="partyCode"
                    label="Party Code"
                    placeholder="e.g. PC-001"
                    required
                    value={item.partyCode}
                    onChange={(e) =>
                      setNewItem({
                        ...item,
                        partyCode: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 space-y-0">
                  <SelectDropDown
                    id="partyRegistrationTypeId"
                    label="Registration Type"
                    value={item.partyRegistrationTypeId}
                    placeholder="Select Type"
                    required
                    options={partyRegTypes?.map((type) => ({
                      label: type.criteriaName,
                      value: type.criteriaSubTypeId,
                    }))}
                    onChange={(value) => {
                      const type = partyRegTypes?.find(
                        (t) => t.criteriaSubTypeId === value,
                      );
                      const name = type?.criteriaName || "";
                      setNewItem({
                        ...item,
                        partyRegistrationTypeId: value,
                        ntn: name === "Unregistered" ? "0000000000000" : "",
                        gst: "",
                        cnic: "",
                      });
                    }}
                  />

                  {/* Conditional Inputs based on Registration Type */}
                  {regTypeName === "STRN" && (
                    <div className="relative group col-span-2 sm:col-span-1">
                      <CustomInput
                        id="gst"
                        label="STRN"
                        required
                        placeholder="e.g. 1234567"
                        value={item.gst}
                        isLoading={false}
                        onChange={(e) =>
                          setNewItem({
                            ...item,
                            gst: e.target.value,
                          })
                        }
                        inputClassName="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!item.gst) {
                            toast.error("Please enter STRN first");
                            return;
                          }
                          getRegistrationType(item.gst);
                        }}
                        disabled={isVerifying}
                        className={`absolute right-1 top-7 h-8 w-8 rounded-lg transition-all duration-300 flex items-center justify-center
                              ${
                                isVerifying
                                  ? "cursor-not-allowed"
                                  : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 cursor-pointer active:scale-95"
                              }
                            `}
                        title={
                          fbrData
                            ? "Verified - Click to re-verify"
                            : "Verify from FBR"
                        }
                      >
                        {isVerifying ? (
                          <Loader
                            size={16}
                            className={`shrink-0 animate-spin ${
                              isDarkMode ? "text-white" : "text-black"
                            }`}
                          />
                        ) : (
                          <Search size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  {(regTypeName === "NTN" ||
                    regTypeName === "Unregistered") && (
                    <div className="relative group col-span-2 sm:col-span-1">
                      <CustomInput
                        id="ntn"
                        required
                        label={
                          regTypeName === "Unregistered" ? "NTN / CNIC" : "NTN"
                        }
                        placeholder={
                          regTypeName === "Unregistered"
                            ? "0000000000000"
                            : "e.g. G123456"
                        }
                        value={item.ntn}
                        readOnly={regTypeName === "Unregistered"}
                        isLoading={false}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .slice(0, 13);
                          setNewItem({
                            ...item,
                            ntn: val,
                          });
                        }}
                        inputClassName="pr-12"
                      />

                      {regTypeName !== "Unregistered" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!item.ntn) {
                              toast.error("Please enter NTN first");
                              return;
                            }
                            getRegistrationType(item.ntn);
                          }}
                          disabled={isVerifying}
                          className={`absolute right-1 top-7 h-8 w-8 rounded-lg transition-all duration-300 flex items-center justify-center
                                ${
                                  isVerifying
                                    ? "cursor-not-allowed"
                                    : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 cursor-pointer active:scale-95"
                                }
                              `}
                          title="Verify from FBR"
                        >
                          {isVerifying ? (
                            <Loader
                              size={16}
                              className={`shrink-0 animate-spin ${
                                isDarkMode ? "text-white" : "text-black"
                              }`}
                            />
                          ) : (
                            <Search size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {regTypeName === "CNIC" && (
                    <div className="relative group col-span-2 sm:col-span-1">
                      <CustomInput
                        id="cnic"
                        required
                        label="CNIC"
                        placeholder="e.g. 4210112345671 (13 digits)"
                        value={item.cnic}
                        isLoading={false}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 13);
                          setNewItem({
                            ...item,
                            cnic: val,
                          });
                        }}
                        inputClassName="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!item.cnic) {
                            toast.error("Please enter CNIC first");
                            return;
                          }
                          getRegistrationType(item.cnic);
                        }}
                        disabled={isVerifying}
                        className={`absolute right-1 top-7 h-8 w-8 rounded-lg transition-all duration-300 flex items-center justify-center
                              ${
                                isVerifying
                                  ? "cursor-not-allowed"
                                  : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 cursor-pointer active:scale-95"
                              }
                            `}
                        title="Verify from FBR"
                      >
                        {isVerifying ? (
                          <Loader
                            size={16}
                            className={`shrink-0 animate-spin ${
                              isDarkMode ? "text-white" : "text-black"
                            }`}
                          />
                        ) : (
                          <Search size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* FBR Data Display */}
                  {fbrData && (
                    <div className="flex items-center gap-2 mt-1 px-1 col-span-2">
                      {(() => {
                        const status =
                          fbrData.statusInquiry?.status ||
                          (fbrData.registrationType?.statuscode === "01"
                            ? "Active"
                            : "In-Active");
                        const isActive = status?.toLowerCase() === "active";
                        const colorClass = isActive
                          ? "text-emerald-500"
                          : "text-rose-500";
                        const bgClass = isActive
                          ? "bg-emerald-500"
                          : "bg-rose-500";

                        return (
                          <Popover
                            placement="bottomLeft"
                            trigger="click"
                            overlayInnerStyle={{
                              padding: 0,
                              borderRadius: "16px",
                              overflow: "hidden",
                              border: isDarkMode
                                ? "1px solid rgba(255,255,255,0.1)"
                                : "1px solid rgba(0,0,0,0.06)",
                              boxShadow:
                                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            }}
                            content={
                              <div
                                className={`w-72 font-sans ${
                                  isDarkMode
                                    ? "bg-[#1f1b2e] text-gray-100"
                                    : "bg-white text-gray-800"
                                }`}
                              >
                                {/* Header */}
                                <div
                                  className={`flex items-center justify-between px-5 py-3 border-b ${
                                    isDarkMode
                                      ? "border-white/5 bg-white/5"
                                      : "border-gray-100 bg-gray-50/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck
                                      size={16}
                                      className={colorClass}
                                    />
                                    <span className="text-sm font-semibold tracking-wide">
                                      FBR Verification
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setFbrData(null)}
                                    className={`p-1 rounded-full transition-colors ${
                                      isDarkMode
                                        ? "hover:bg-white/10 text-gray-400 hover:text-white"
                                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                    }`}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4">
                                  {/* Status Badge */}
                                  <div className="flex justify-center">
                                    <div
                                      className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${
                                        isActive
                                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                      }`}
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full ${bgClass} ${isActive ? "animate-pulse" : ""}`}
                                      ></div>
                                      <span className="text-xs font-bold uppercase tracking-wider">
                                        {status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Grid Details */}
                                  <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Reg. Type
                                      </p>
                                      <p className="text-xs font-semibold wrap-break-word">
                                        {fbrData.registrationType
                                          ?.REGISTRATION_TYPE || "---"}
                                      </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                      <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                                        Reg. Number
                                      </p>
                                      <p className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 break-all">
                                        {fbrData.registrationType
                                          ?.REGISTRATION_NO || "---"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            }
                          >
                            <div className="flex items-center gap-2 cursor-pointer group bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                              <div
                                className={`w-2 h-2 rounded-full ${bgClass} ${isActive ? "animate-pulse" : ""}`}
                              ></div>
                              <span
                                className={`text-xs font-bold ${colorClass}`}
                              >
                                FBR Verified: {status}
                              </span>
                              <ShieldCheck size={14} className={colorClass} />
                            </div>
                          </Popover>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="lg:col-span-1">
              <CustomUpload
                label=""
                value={item.logoImageURL}
                onChange={(data) =>
                  setNewItem((prev) => ({ ...prev, ...data }))
                }
                darkMode={isDarkMode}
                imageUrlKey="logoImageURL"
                previewHeight={225}
                description="Upload a single logo for this buyer"
              />
            </div>
          </div>

          {/* Party Location */}
          <div
            className={` rounded-xl p-4 border shadow-sm ${
              isDarkMode ? " bg-black/5 border-white/10" : "border-black/10"
            }`}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-(--secondary-color) mb-3">
                Buyer Locations
              </h3>

              {item.partyLocationDIRequests.map((loc, index) => {
                const filteredProvinces = province.filter(
                  (p) => p.countryId === loc.addressDIRequest.countryId,
                );
                const filteredCities = city.filter(
                  (c) => c.provinceId === loc.addressDIRequest.provinceId,
                );
                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border space-y-3 relative ${
                      isDarkMode
                        ? " bg-black/5 border-white/10"
                        : "bg-white/5 border-black/10"
                    } `}
                  >
                    <h3 className="text-lg font-semibold text-(--secondary-color) mb-3">
                      <h3>Location {index + 1}</h3>
                    </h3>

                    {item.partyLocationDIRequests.length > 1 && (
                      <button
                        title="Remove location"
                        onClick={() => handleRemoveLocation(index)}
                        className={`absolute top-2.5 right-3 p-1.5 rounded-full border transition-colors duration-200 shadow-sm flex items-center justify-center outline-none ${
                          isDarkMode
                            ? "bg-[#1a1129] border-[#5a1f1f] text-red-500 hover:text-red-400"
                            : "bg-white border-gray-300 text-red-600 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <SelectDropDown
                        required
                        id={`locationType-${index}`}
                        label="Location Type"
                        value={loc.locationTypeId || ""}
                        placeholder="Select Location Type"
                        options={locationType?.map((type) => ({
                          label: type.locationTypeName,
                          value: type.locationTypeId,
                        }))}
                        onChange={(value) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].locationTypeId = value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <CustomInput
                        id={`partyLocationName-${index}`}
                        label="Location Name"
                        required
                        value={loc.partyLocationName}
                        placeholder="Enter Buyer Location Name"
                        onChange={(e) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].partyLocationName = e.target.value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <CustomInput
                        id={`shortName-${index}`}
                        label="Short Name"
                        required
                        value={loc.shortName}
                        placeholder="Enter Short Name"
                        onChange={(e) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].shortName = e.target.value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <SelectDropDown
                        id={`country-${index}`}
                        label="Country"
                        required
                        placeholder="Select Country"
                        value={loc.addressDIRequest.countryId || ""}
                        options={country?.map((c) => ({
                          label: c.countryName,
                          value: c.countryId,
                        }))}
                        onChange={(value) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.countryId = value;
                            updated[index].addressDIRequest.provinceId = 0;
                            updated[index].addressDIRequest.cityId = 0;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <SelectDropDown
                        id={`province-${index}`}
                        label="Province"
                        required
                        placeholder="Select Province"
                        value={loc.addressDIRequest.provinceId || ""}
                        options={filteredProvinces.map((p) => ({
                          label: p.provinceName,
                          value: p.provinceId,
                        }))}
                        onChange={(value) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.provinceId = value;
                            updated[index].addressDIRequest.cityId = 0;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <SelectDropDown
                        id={`city-${index}`}
                        label="City"
                        required
                        placeholder="Select City"
                        value={loc.addressDIRequest.cityId || ""}
                        options={filteredCities.map((c) => ({
                          label: c.cityName,
                          value: c.cityId,
                        }))}
                        onChange={(value) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.cityId = value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <CustomInput
                        id={`areaName-${index}`}
                        label="Area Name"
                        required
                        placeholder="Enter area or locality"
                        value={loc.addressDIRequest.areaName || ""}
                        onChange={(e) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.areaName =
                              e.target.value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <CustomInput
                        id={`addressDetail-${index}`}
                        label="Address"
                        required
                        placeholder="Street, City, State, ZIP"
                        value={loc.addressDIRequest.addressDetail || ""}
                        onChange={(e) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.addressDetail =
                              e.target.value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />

                      <CustomInput
                        id={`phoneNo-${index}`}
                        label="Phone No"
                        required
                        inputMode="tel"
                        placeholder="03xx-xxxxxxx"
                        value={loc.addressDIRequest.phoneNo || ""}
                        onChange={(e) =>
                          setNewItem((prev) => {
                            const updated = [...prev.partyLocationDIRequests];
                            updated[index].addressDIRequest.phoneNo =
                              e.target.value;
                            return {
                              ...prev,
                              partyLocationDIRequests: updated,
                            };
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddLocation}
                className={`w-full py-2.5 mt-2 rounded-full border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 outline-none ${
                  isDarkMode
                    ? "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/50"
                    : "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100/80 hover:border-purple-400"
                }`}
              >
                <Redo size={16} />
                Add Location {item.partyLocationDIRequests.length + 1}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`sticky -bottom-6 z-20 pt-0.5 pb-4 -mx-3 sm:-mx-6 px-3 sm:px-6  mt-6 -mb-6   ${isDarkMode ? "bg-[#1A162B]" : "bg-white"}`}
        >
          <ModalActionButtons
            onCancel={handleCloseModal}
            onSubmit={handleAddBuyer}
            isDarkMode={isDarkMode}
            isSubmitting={isPending}
            isDisabled={!isFormValid()}
          />
        </div>
      </CustomModal>

      {/* Single Delete Modal */}
      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        title={itemList.find((i) => i.partyId === confirmModal.id)?.partyName}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bulk Delete Modal */}
      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        title={`${selectedRowKeys.length} items`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      <SuccessModal
        open={successModalOpen}
        message="Party deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />

      <BuyerSettingsModal
        isOpen={settingsModal.open}
        onClose={() => setSettingsModal({ open: false, party: null })}
        party={settingsModal.party}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default BuyerRegistrationPage;
