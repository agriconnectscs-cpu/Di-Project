import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { Table, DatePicker, Switch, Checkbox } from "antd";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Redo, FileX2, ChevronLeft, Save, Loader } from "lucide-react";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { useGetCurrency } from "../../../../../hooks/useGetCurrency";
import { useGetLocations } from "../../../../../hooks/useGetLocations";
import { useGetPriceType } from "../../../../../hooks/useGetPriceType";

import ActionButtons from "../../../../../components/ActionButtons";
import SelectDropDown from "../../../../../components/SelectDropDown";
import CustomButton from "../../../../../components/common/CustomButton";
import CustomDeleteModal from "../../../../../components/CustomDeleteModal";

import { handleApiResponse } from "../../../../../utils/handleApiResponse";
// Imports End-----

const BuyerPricingTab = ({ party, location, isDarkMode, productId }) => {
  const queryClient = useQueryClient();
  const { loginAccessToken } = useGetAuth();

  const [selectedClientLocation, setSelectedClientLocation] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingProductPriceId, setEditingProductPriceId] = useState(0);
  const [currentLoadingId, setCurrentLoadingId] = useState(null);
  const [editableRows, setEditableRows] = useState([]);
  const [pricingForm, setPricingForm] = useState({
    priceTypeId: 0,
    currencyId: 0,
    dateFrom: dayjs(),
    dateTo: null,
    isActive: true,
    rowVersionLong: 0,
  });

  const { data: clientLocations = [] } = useGetLocations();
  const { data: currencies = [] } = useGetCurrency();
  const { data: priceTypes = [] } = useGetPriceType();

  // Auto-select location if only one exists
  useEffect(() => {
    if (clientLocations.length === 1 && !selectedClientLocation) {
      setSelectedClientLocation(clientLocations[0].clientLocationId);
    }
  }, [clientLocations, selectedClientLocation]);

  // Auto-set default price type when list loads
  useEffect(() => {
    if (priceTypes.length > 0 && !pricingForm.priceTypeId && isCreateMode) {
      setPricingForm((prev) => ({
        ...prev,
        priceTypeId: priceTypes[0].criteriaSubTypeId,
      }));
    }
  }, [priceTypes, isCreateMode, pricingForm.priceTypeId]);

  // Fetch Price History
  const { data: priceHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: [
      "buyerProductPricingHistory",
      location?.partyLocationId,
      party?.partyId,
      selectedClientLocation,
      productId,
    ],
    queryFn: async () => {
      const url = `/api/CRM/BuyerProductPrice/GetListByPartyLocationId?ClientLocationId=${selectedClientLocation}&PartyLocationId=${location?.partyLocationId}&PartyId=${party?.partyId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });
      const result = await handleApiResponse(
        res,
        "Failed to load pricing history",
      );
      return result?.data || [];
    },
    enabled:
      !!location?.partyLocationId &&
      !!loginAccessToken &&
      !!selectedClientLocation &&
      !isCreateMode,
  });

  // Load Rows for Editing
  const { mutate: loadPricingRows, isPending: isLoadingSeed } = useMutation({
    mutationFn: async (productPriceId = 0) => {
      setCurrentLoadingId(productPriceId);
      const res = await fetch(
        `/api/CRM/BuyerProductPrice/GetProductPriceList?PartyLocationId=${location?.partyLocationId}&ClientLocationId=${selectedClientLocation}&ProductPriceId=${productPriceId}&ProductId=${productId || 0}`,
        { headers: { Authorization: `Bearer ${loginAccessToken}` } },
      );
      const result = await handleApiResponse(res, "Failed to load products");
      return result?.data || [];
    },

    onSuccess: (rows, productPriceId) => {
      setCurrentLoadingId(null);
      const normalized = (rows || []).map((r, idx) => ({
        ...r,
        _key: r.productId || r.productPriceDetailId || idx,
        isChecked: !!r.isChecked,
        isActive: r.isActive !== undefined ? !!r.isActive : true,
        salePrice: Number(r.salePrice) || 0,
        discountPercent: Number(r.discountPercent) || 0,
        discountAmount: Number(r.discountAmount) || 0,
        taxPercent: Number(r.taxPercent) || 0,
        taxAmount: Number(r.taxAmount) || 0,
        netSalePrice: Number(r.netSalePrice) || 0,
        productUnitShortName:
          r.productUnitShortName ||
          r.unitShortName ||
          r.unitShort ||
          r.unit ||
          "",
      }));

      setEditableRows(normalized);
      setEditingProductPriceId(Number(productPriceId) || 0);

      if (productPriceId > 0) {
        const existing = priceHistory.find(
          (h) => h.productPriceId === productPriceId,
        );
        if (existing) {
          setPricingForm({
            priceTypeId: existing.priceTypeId,
            currencyId: existing.currencyId,
            productId: existing.productId,
            dateFrom: existing.dateFrom ? dayjs(existing.dateFrom) : dayjs(),
            dateTo:
              existing.dateTo && !existing.dateTo.startsWith("9999")
                ? dayjs(existing.dateTo)
                : null,
            isActive: !!existing.isActive,
            rowVersionLong: existing.rowVersionLong,
          });
        }
      } else {
        setPricingForm({
          priceTypeId: priceTypes[0]?.criteriaSubTypeId || 0,
          currencyId: 1,
          dateFrom: dayjs(),
          dateTo: null,
          isActive: true,
          rowVersionLong: 0,
        });
      }
      setIsCreateMode(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: savePricing, isPending: isSavingPricing } = useMutation({
    mutationFn: async () => {
      const selectedRows = editableRows.filter((r) => !!r.isChecked);

      const deletedDetails =
        editingProductPriceId > 0
          ? editableRows
              .filter((r) => Number(r.productPriceDetailId) > 0 && !r.isChecked)
              .map((r) => ({
                productPriceDetailId: Number(r.productPriceDetailId),
                productPriceId: Number(editingProductPriceId),
                productId: Number(r.productId),
                rowVersionLong: Number(
                  r.rowVersionDetailLong || r.rowVersionLong || 0,
                ),
              }))
          : [];

      if (selectedRows.length === 0 && deletedDetails.length === 0)
        throw new Error("Please select at least one product price");

      if (!pricingForm.priceTypeId)
        throw new Error("Please select a Price Type");
      if (!pricingForm.currencyId) throw new Error("Please select a Currency");

      const selectedPriceType = priceTypes.find(
        (t) => Number(t.criteriaSubTypeId) === Number(pricingForm.priceTypeId),
      );
      const selectedCurrency = currencies.find(
        (c) => Number(c.currencyId) === Number(pricingForm.currencyId),
      );

      if (!selectedPriceType) throw new Error("Selected Price Type is invalid");
      if (!selectedCurrency) throw new Error("Selected Currency is invalid");

      const priceId = Number(editingProductPriceId) || 0;

      const payload = {
        productPriceId: priceId,
        clientLocationId: Number(selectedClientLocation) || 0,
        priceTypeId: Number(pricingForm.priceTypeId) || 0,
        currencyId: Number(pricingForm.currencyId) || 0,
        productId: null,
        partyLocationId: Number(location?.partyLocationId) || 0,
        dateFrom: dayjs(pricingForm.dateFrom).format("YYYY-MM-DD"),
        dateTo: pricingForm.dateTo
          ? dayjs(pricingForm.dateTo).format("YYYY-MM-DD")
          : null,
        isActive: !!pricingForm.isActive,
        partyLocationName: location?.partyLocationName || "",
        priceTypeName: selectedPriceType?.criteriaName || "",
        currencyName: selectedCurrency?.currencyName || "",
        rowVersionLong: Number(pricingForm.rowVersionLong) || 0,
        productPriceDetailRequests: selectedRows.map((r) => {
          const salePrice = Number(r.salePrice) || 0;
          const discountPercent = Number(r.discountPercent) || 0;
          const discountAmount = salePrice * (discountPercent / 100);
          const afterDiscount = salePrice - discountAmount;
          const taxPercent = Number(r.taxPercent) || 0;
          const taxAmount = afterDiscount * (taxPercent / 100);

          return {
            productPriceDetailId: Number(r.productPriceDetailId) || 0,
            productPriceId: priceId,
            productPackId: Number(r.productPackId) || null,
            productId: Number(r.productId) || 0,
            purchasePrice: 0,
            salePrice: salePrice,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            grossAmount: salePrice,
            taxDetailId: Number(r.taxDetailId) || null,
            taxPercent: taxPercent,
            taxAmount: taxAmount,
            netPurchasePrice: 0,
            netSalePrice: afterDiscount + taxAmount,
            rowVersionLong:
              Number(r.rowVersionDetailLong || r.rowVersionLong) || 0,
          };
        }),
        deletedProductPriceDetailRequests: deletedDetails,
      };

      const res = await fetch("/api/CRM/BuyerProductPrice/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(payload),
      });

      return await handleApiResponse(
        res,
        "Failed to save pricing configuration",
      );
    },
    onSuccess: () => {
      toast.success("Pricing configuration saved successfully");
      setEditingProductPriceId(0);
      setIsCreateMode(false);
      queryClient.invalidateQueries(["buyerProductPricingHistory"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deletePrice, isPending: isDeleting } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(
        `/api/CRM/BuyerProductPrice/DeleteById?Id=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      return await handleApiResponse(res, "Failed to delete pricing");
    },
    onSuccess: () => {
      toast.success("Pricing record deleted");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
      queryClient.invalidateQueries(["buyerProductPricingHistory"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRow = (key, field, value) => {
    setEditableRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        const updated = { ...r, [field]: value };

        const salePrice =
          field === "salePrice" ? Number(value) : Number(r.salePrice);
        const hasValue = salePrice > 0;

        if (hasValue || field === "isChecked") {
          updated.isChecked = field === "isChecked" ? value : true;
        }

        return updated;
      }),
    );
  };

  const locationOptions = clientLocations.map((l) => ({
    label: l.locationName,
    value: l.clientLocationId,
  }));

  const selectedLocObj = clientLocations.find(
    (l) => l.clientLocationId === selectedClientLocation,
  );

  const columns = [
    {
      title: "SR.",
      width: 60,
      align: "center",
      render: (_, __, i) => (
        <span className="text-xs text-gray-400">{i + 1}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "priceTypeName",
      render: (txt) => (
        <span className="text-xs font-semibold">{txt || "Standard"}</span>
      ),
    },
    {
      title: "Currency",
      dataIndex: "currencyName",
      render: (txt) => (
        <span className="text-xs font-bold text-amber-600">{txt}</span>
      ),
    },
    {
      title: "From Date",
      dataIndex: "dateFrom",
      render: (d) => (
        <span className="text-xs font-medium">
          {d ? dayjs(d).format("DD-MMM-YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "To Date",
      dataIndex: "dateTo",
      render: (d) => (
        <span className="text-xs">
          {d && !d.startsWith("9999") ? dayjs(d).format("DD-MMM-YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "Status",
      align: "center",
      render: (_, r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
        >
          {r.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Actions",
      width: 100,
      align: "center",
      render: (_, r) => (
        <ActionButtons
          record={r}
          darkMode={isDarkMode}
          editDisabled={!r.isActive}
          deleteDisabled={!r.isActive}
          isDeleteLoading={
            isDeleting && recordToDelete?.productPriceId === r.productPriceId
          }
          isEditLoading={isLoadingSeed && currentLoadingId === r.productPriceId}
          onEdit={() => loadPricingRows(r.productPriceId)}
          onDelete={() => {
            setRecordToDelete(r);
            setIsDeleteModalOpen(true);
          }}
        />
      ),
    },
  ];

  const pricingColumns = [
    {
      title: "Use",
      width: 60,
      align: "center",
      render: (_, r) => (
        <Checkbox
          checked={!!r.isChecked}
          onChange={(e) => updateRow(r._key, "isChecked", e.target.checked)}
        />
      ),
    },
    {
      title: "Product",
      dataIndex: "productName",
      width: 300,
      render: (txt, r) => (
        <div className="flex flex-col py-1">
          <span
            className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-700"}`}
          >
            {txt}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {r.productCategoryName}
          </span>
        </div>
      ),
    },
    {
      title: "Unit",
      width: 90,
      align: "center",
      render: (_, r) => {
        const unit = r.unitShortName;
        return unit ? (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-xs font-bold uppercase tracking-wider">
            {unit}
          </span>
        ) : (
          <span className="text-gray-400 text-[10px] italic">-</span>
        );
      },
    },
    {
      title: "Sale Price",
      dataIndex: "salePrice",
      width: 150,
      render: (val, r) => (
        <div className="relative group w-30">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
            {
              currencies.find((c) => c.currencyId === pricingForm.currencyId)
                ?.currencySymbol
            }
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={val ? Number(val).toLocaleString() : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*\.?\d*$/.test(raw)) {
                updateRow(r._key, "salePrice", raw);
              }
            }}
            placeholder="00"
            className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-sm font-bold transition-all outline-none border ${
              isDarkMode
                ? "bg-white/3 border-white/10 focus:border-emerald-500/50 text-white focus:bg-white/5"
                : "bg-white border-gray-200 focus:border-emerald-500/50 text-slate-800 focus:shadow-sm"
            }`}
          />
        </div>
      ),
    },
    {
      title: "Disc (%)",
      dataIndex: "discountPercent",
      width: 120,
      render: (val, r) => {
        return (
          <div className="relative group w-22.5">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none group-focus-within:text-amber-500 transition-colors">
              %
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={val || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  if (Number(val) > 100) return;
                  updateRow(r._key, "discountPercent", val);
                }
              }}
              placeholder="0"
              className={`w-full pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold transition-all outline-none border ${
                isDarkMode
                  ? "bg-white/3 border-white/10 focus:border-amber-500/50 text-white focus:bg-white/5"
                  : "bg-white border-gray-200 focus:border-amber-500/50 text-slate-800 focus:shadow-sm"
              }`}
            />
          </div>
        );
      },
    },
    {
      title: "Tax (%)",
      dataIndex: "taxPercent",
      width: 120,
      render: (val, r) => {
        return (
          <div className="relative group w-22.5">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
              %
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={val || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  if (Number(val) > 100) return;
                  updateRow(r._key, "taxPercent", val);
                }
              }}
              placeholder="0"
              className={`w-full pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold transition-all outline-none border ${
                isDarkMode
                  ? "bg-white/3 border-white/10 focus:border-blue-500/50 text-white focus:bg-white/5"
                  : "bg-white border-gray-200 focus:border-blue-500/50 text-slate-800 focus:shadow-sm"
              }`}
            />
          </div>
        );
      },
    },
    {
      title: "Net Price",
      width: 120,
      align: "right",
      render: (_, r) => {
        const salePrice = Number(r.salePrice) || 0;
        const discountPercent = Number(r.discountPercent) || 0;
        const discountAmount = salePrice * (discountPercent / 100);
        const afterDiscount = salePrice - discountAmount;
        const taxPercent = Number(r.taxPercent) || 0;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const netPrice = afterDiscount + taxAmount;

        return (
          <span
            className={`text-sm font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
          >
            {netPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
    },
  ];

  return (
    <div
      className={`flex flex-col h-full overflow-hidden font-['Outfit'] ${isDarkMode ? "bg-[#1A162B]" : "bg-white"}`}
    >
      <AnimatePresence mode="wait">
        {!isCreateMode ? (
          <Motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full"
          >
            {/* Summary Header */}
            <div
              className={`flex flex-col md:flex-row items-start md:items-center justify-between px-3 md:px-4 pb-4 gap-3 md:gap-4 border-b w-full ${isDarkMode ? "border-white/10" : "border-gray-100"}`}
            >
              {/* LEFT: Title (Hidden on Mobile) */}
              <div className="hidden md:flex flex-col shrink-0">
                <h3
                  className={`text-base font-bold m-0 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Buyer Pricing
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Location:
                  </span>
                  <span
                    className={`text-[11px] font-bold ${selectedClientLocation ? "text-emerald-500" : "text-red-400"}`}
                  >
                    {selectedClientLocation
                      ? selectedLocObj?.locationName
                      : "Not Selected"}
                  </span>
                </div>
              </div>

              {/* RIGHT / ACTIONS: Dropdown and Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto md:ml-auto">
                <div className="w-full sm:w-64 shrink-0">
                  <SelectDropDown
                    placeholder="Select Location"
                    value={selectedClientLocation}
                    options={locationOptions}
                    onChange={(val) => setSelectedClientLocation(val)}
                  />
                </div>

                {selectedClientLocation && (
                  <div className="flex justify-center shrink-0">
                    <CustomButton
                      title="New Price"
                      icon={Redo}
                      onClick={() => loadPricingRows(0)}
                      disabled={isLoadingSeed}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-hidden p-4">
              {!selectedClientLocation ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl opacity-40">
                  <MapPin size={48} className="mb-4 text-gray-400" />
                  <p className="text-sm font-medium">
                    Select a location to view pricing
                  </p>
                </div>
              ) : isLoadingHistory || priceHistory.length > 0 ? (
                <div className="overflow-auto max-h-full">
                  <Table
                    dataSource={priceHistory}
                    columns={columns}
                    rowKey="productPriceId"
                    pagination={false}
                    bordered
                    scroll={{ x: true }}
                    loading={isLoadingHistory}
                    rowClassName={() =>
                      "hover:bg-[#1b122b]/30 !h-10 [&>td]:!py-1.5 [&>td]:!px-2"
                    }
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl opacity-60 gap-4">
                  <FileX2 size={40} className="text-amber-500" />
                  <div className="text-center">
                    <h4
                      className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      No Records
                    </h4>
                    <p className="text-xs text-gray-500">
                      Create your first pricing record for this location.
                    </p>
                  </div>
                  <CustomButton
                    title="Create Now"
                    icon={Redo}
                    onClick={() => loadPricingRows(0)}
                  />
                </div>
              )}
            </div>
          </Motion.div>
        ) : (
          <Motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full bg-transparent"
          >
            {/* Editor Header */}
            <div
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-4 py-3 border-b ${isDarkMode ? "border-white/10" : "border-gray-100"}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateMode(false)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h3
                    className={`text-base font-bold m-0 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    {editingProductPriceId ? "Edit Pricing" : "New Pricing"}
                  </h3>
                  <p className="text-[10px] text-gray-500 m-0">
                    Configure products rates for {selectedLocObj?.locationName}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all ${isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    Active
                  </span>
                  <Switch
                    checked={pricingForm.isActive}
                    onChange={(val) =>
                      setPricingForm((f) => ({ ...f, isActive: val }))
                    }
                    size="small"
                    className={pricingForm.isActive ? "bg-emerald-600" : ""}
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <CustomButton
                    title="Cancel"
                    className={`custom-button py-1.5! sm:py-2! ${
                      isDarkMode
                        ? "bg-black/10! border-gray-700! text-white!"
                        : "bg-gray-100/50! border-gray-300! text-gray-900!"
                    }`}
                    onClick={() => setIsCreateMode(false)}
                  />

                  <button
                    onClick={() => savePricing()}
                    disabled={isSavingPricing}
                    className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {isSavingPricing ? (
                      <Loader
                        size={14}
                        className="shrink-0 animate-spin sm:w-4 sm:h-4 w-3.5 h-3.5"
                      />
                    ) : (
                      <Save
                        size={14}
                        className="shrink-0 sm:w-4 sm:h-4 w-3.5 h-3.5"
                      />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto mt-2 sm:mt-0 p-0 sm:p-4 space-y-4">
              <div
                className={`p-3 sm:p-5 rounded-xl border ${isDarkMode ? "bg-white/2 border-white/5" : "bg-gray-50 border-gray-100"}`}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      From Date
                    </label>
                    <DatePicker
                      value={pricingForm.dateFrom}
                      onChange={(d) =>
                        setPricingForm((f) => ({ ...f, dateFrom: d }))
                      }
                      format="DD-MMM-YYYY"
                      className={`custom-datepicker w-full! ${
                        isDarkMode
                          ? "bg-black/10! border-gray-700! text-white!"
                          : "bg-gray-100/50! border-gray-300! text-gray-900!"
                      }`}
                      allowClear={false}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      To Date
                    </label>
                    <DatePicker
                      disabled
                      value={pricingForm.dateTo}
                      onChange={(d) =>
                        setPricingForm((f) => ({ ...f, dateTo: d }))
                      }
                      format="DD-MMM-YYYY"
                      className={`custom-datepicker w-full! ${
                        isDarkMode
                          ? "bg-black/10! border-gray-700! text-white!"
                          : "bg-gray-100/50! border-gray-300! text-gray-900!"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Price Type
                    </label>
                    <SelectDropDown
                      value={pricingForm.priceTypeId}
                      options={priceTypes.map((t) => ({
                        label: t.criteriaName,
                        value: t.criteriaSubTypeId,
                      }))}
                      onChange={(v) =>
                        setPricingForm((f) => ({ ...f, priceTypeId: v }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Currency
                    </label>
                    <SelectDropDown
                      value={pricingForm.currencyId}
                      options={currencies.map((c) => ({
                        label: c.currencyName,
                        value: c.currencyId,
                      }))}
                      onChange={(v) =>
                        setPricingForm((f) => ({ ...f, currencyId: v }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Table
                dataSource={editableRows}
                columns={pricingColumns}
                scroll={{ x: true }}
                rowKey="_key"
                pagination={false}
                bordered
                rowClassName={() =>
                  "hover:bg-[#1b122b]/30 !h-6 [&>td]:!py-1.5 [&>td]:!px-2"
                }
              />
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <CustomDeleteModal
        open={isDeleteModalOpen}
        loading={isDeleting}
        onConfirm={() =>
          recordToDelete && deletePrice(recordToDelete.productPriceId)
        }
        title="Delete Price?"
        description="Are you sure you want to delete this pricing record?"
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
      />

      <style>{`
                .ant-table-cell { background: transparent !important; }
                .ant-picker { background: ${isDarkMode ? "rgba(255,255,255,0.03)" : "#fff"} !important; border-color: ${isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"} !important; border-radius: 8px !important; }
                .ant-picker input { color: ${isDarkMode ? "#fff" : "#000"} !important; font-size: 13px !important; }
                .ant-switch-checked { background-color: #10b981 !important; }
            `}</style>
    </div>
  );
};

export default BuyerPricingTab;
