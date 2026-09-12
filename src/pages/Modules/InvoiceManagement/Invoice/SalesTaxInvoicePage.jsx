import dayjs from 'dayjs';
import {DatePicker} from 'antd';
import toast from 'react-hot-toast';
import {useEffect, useState, useMemo} from 'react';
import {motion as Motion, AnimatePresence} from 'framer-motion';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  Trash2,
  Redo,
  Edit,
  Loader,
  FileText,
  Eye,
  X,
  FilePieChart,
  Filter,
  AlertCircle,
} from 'lucide-react';

import {useTheme} from '../../../../ThemeProvider';
import {handleApiResponse} from '../../../../utils/handleApiResponse';

import {usePagePermissions} from '../../../../permissions';

import {useGetAuth} from '../../../../hooks/useGetAuth';
import {useGetUnits} from '../../../../hooks/useGetUnits';
import useGlobalFilter from '../../../../hooks/useGlobalFilter';
import {useGetCurrency} from '../../../../hooks/useGetCurrency';
import {useGetInvoices} from '../../../../hooks/useGetInvoices';
import {useCloseOnEscape} from '../../../../hooks/useCloseOnEscape';
import {useGetProductScenarios} from '../../../../hooks/useGetProductScenarios';

import CustomModal from '../../../../components/CustomModal';
import CustomTable from '../../../../components/CustomTable';
import CustomInput from '../../../../components/CustomInput';
import SuccessModal from '../../../../components/SuccessModal';
import ActionButtons from '../../../../components/ActionButtons';
import Breadcrumb from '../../../../components/common/Breadcrumb';
import AdvancedFilter from '../../../../components/AdvancedFilter';
import InvoiceFilters from '../../../../components/InvoiceFilters';
import SelectDropDown from '../../../../components/SelectDropDown';
import CustomButton from '../../../../components/common/CustomButton';
import CustomDeleteModal from '../../../../components/CustomDeleteModal';
import ValidationErrorsModal from '../../../../components/ValidationErrorsModal';

import pdfIcon from '../../../../assets/pdf.webp';
// Imports End ----------------

const SalesTaxInvoicePage = () => {
  const {isDarkMode} = useTheme();
  const queryClient = useQueryClient();
  const {loginAccessToken} = useGetAuth();

  const {canAdd, canEdit, canDelete, canView, permission} =
    usePagePermissions();

  // UI State
  const [addModal, setAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({open: false, id: null});
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [shouldPreviewFlag, setShouldPreviewFlag] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  // Date Filter Helpers
  const getAcademicYearDates = () => {
    const today = dayjs();
    return {
      FromDate: today.startOf('month').format('YYYY-MM-DD'),
      ToDate: today.endOf('month').format('YYYY-MM-DD'),
    };
  };

  // Page State
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advFilters, setAdvFilters] = useState([]);
  const [advFilterRows, setAdvFilterRows] = useState(null);
  const [dateFilters, setDateFilters] = useState(getAcademicYearDates);

  // Get available report layouts from local storage
  const reports = useMemo(() => {
    try {
      const stored = localStorage.getItem('LoggedInUser');
      if (!stored) return [];

      const loggedInUser = JSON.parse(stored);

      const userData =
        loggedInUser?.data ||
        (Array.isArray(loggedInUser) ? loggedInUser[0] : loggedInUser);

      if (userData) {
        const userReports = userData.loginUserReports || [];
        let filtered = userReports.filter(
          (r) =>
            Number(r.appProductMenuId) === 60133 ||
            Number(r.parentAppMenuId) === 60133
        );

        // Fallback: Check clientLocationReports if userReports didn't yield matches
        if (filtered.length === 0 && userData.clientLocationReports) {
          filtered = userData.clientLocationReports
            .filter(
              (item) =>
                Number(item.appProductMenuId) === 60133 ||
                Number(item.loginReport?.parentAppMenuId) === 60133
            )
            .map((item) => item.loginReport)
            .filter(Boolean);
        }
        return filtered;
      }
    } catch (error) {
      console.error('Failed to parse LoggedInUser from local storage', error);
    }
    return [];
  }, []);

  const [reportModal, setReportModal] = useState({
    open: false,
    invoiceId: null,
  });
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  // Loading States
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    invoiceId: 0,
    partyId: null,
    partyLocationId: null,
    currencyId: null,
    scenarioId: null,
    invoiceOn: dayjs().endOf('day').toISOString(),
    invoiceRefNo: '',
    invoiceNo: '',
    invoiceRemarks: '',
    totalAmount: 0,
    totalGross: 0,
    totalTax: 0,
    totalReceivable: 0,
    partyRegistrationTypeName: '',
    cnic: '',
    invoiceDetailDIRequests: [
      {
        invoiceDetailId: 0,
        invoiceId: 0,
        lineId: 0,
        productId: 0,
        quantity: 0,
        orderUnitId: 0,
        price: 0,
        orderAmount: 0,
        discPercent: 0,
        discountAmount: 0,
        grossAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        receivableAmount: 0,
        lineDescription: '',
        sroSaleType: '',
        sroScheduleNo: '',
        sroItemSerialNo: '',
      },
    ],
    deletedInvoiceDetailDIRequests: [],
  });

  //  Fetch Data List
  const {data: products = []} = useQuery({
    queryKey: ['products', loginAccessToken],
    enabled: !!loginAccessToken,

    queryFn: async () => {
      const res = await fetch('/api/DI/Product/GetList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          accept: 'text/plain',
        },
        body: JSON.stringify({}),
      });
      const result = await handleApiResponse(
        res,
        'Failed to fetch DI products'
      );
      return result?.data || [];
    },

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const {data: units = []} = useGetUnits();
  const {data: currency = []} = useGetCurrency();
  const {data: invoiceList = [], isLoading: isListLoading} = useGetInvoices(
    dateFilters,
    advFilters
  );

  const {data: productPriceList = [], isFetching: isPricingLoading} = useQuery({
    queryKey: [
      'activeProductPriceList',
      newInvoice.partyLocationId,
      loginAccessToken,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/BuyerProductPrice/GetActiveProductPriceList?PartyLocationId=${newInvoice.partyLocationId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
            accept: 'text/plain',
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const result = await res.json();
      return result?.data || [];
    },
    onError: (err) =>
      toast.error('Failed to load product pricing: ' + err.message),

    enabled:
      !!loginAccessToken &&
      !!newInvoice.partyLocationId &&
      newInvoice.partyLocationId !== 0,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const {data: autoInvoiceNo} = useQuery({
    queryKey: ['autoInvoiceNo', loginAccessToken],
    queryFn: async () => {
      const res = await fetch('/api/DI/Invoice/GetAutoInvoiceNo', {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      const result = await handleApiResponse(
        res,
        'Failed to fetch auto invoice number'
      );
      return result?.data ?? '';
    },

    onError: (err) => toast.error(err.message),

    enabled: !!loginAccessToken && addModal && newInvoice.invoiceId === 0,

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Scenarios Query
  const {data: scenarios = []} = useQuery({
    queryKey: ['getScenarios', loginAccessToken],
    queryFn: async () => {
      const res = await fetch('/api/DBO/Data/GetCriteriaForInvoiceScenario', {
        headers: {
          accept: 'text/plain',
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      const result = await handleApiResponse(res, 'Failed to fetch scenarios');
      return Array.isArray(result?.data) ? result.data : [];
    },
    enabled: !!loginAccessToken && addModal,

    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const scenarioOptions = (Array.isArray(scenarios) ? scenarios : []).map(
    (s) => ({
      label: `${s.criteriaCode} - ${s.criteriaName}`,
      value: s.criteriaSubTypeId,
    })
  );

  const {data: productScenarios = []} = useGetProductScenarios({
    enabled: !!loginAccessToken && addModal,
  });

  const findProductScenario = (productId, scenarioId) => {
    if (!productId || !scenarioId || !Array.isArray(productScenarios))
      return null;
    return productScenarios.find(
      (ps) =>
        Number(ps.productId) === Number(productId) &&
        Number(ps.scenarioId) === Number(scenarioId)
    );
  };

  useEffect(() => {
    if (
      !addModal ||
      newInvoice.invoiceId !== 0 ||
      !newInvoice.scenarioId ||
      !productScenarios?.length
    )
      return;

    setNewInvoice((prev) => {
      let hasChanges = false;
      const updatedDetails = (prev.invoiceDetailDIRequests || []).map(
        (item) => {
          if (!item.productId) return item;
          const matched = findProductScenario(item.productId, prev.scenarioId);
          if (!matched) return item;

          const newTax = matched.taxPercent ?? 0;
          const newSaleType = matched.sroSaleType || '';
          const newScheduleNo = matched.sroScheduleNo || '';
          const newSerialNo = matched.sroItemSerialNo || '';

          if (
            Number(item.taxPercent) === Number(newTax) &&
            item.sroSaleType === newSaleType &&
            item.sroScheduleNo === newScheduleNo &&
            item.sroItemSerialNo === newSerialNo
          ) {
            return item;
          }

          hasChanges = true;
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const dPer = Number(item.discPercent) || 0;
          const tPer = Number(newTax) || 0;

          const orderAmount = Number((qty * price).toFixed(2));
          const discAmt = Number(((orderAmount * dPer) / 100).toFixed(2));
          const grossAmount = Number((orderAmount - discAmt).toFixed(2));
          const taxAmt = Number(((grossAmount * tPer) / 100).toFixed(2));
          const receivableAmount = Number((grossAmount + taxAmt).toFixed(2));

          return {
            ...item,
            taxPercent: newTax,
            taxAmount: taxAmt,
            grossAmount,
            orderAmount,
            discountAmount: discAmt,
            receivableAmount,
            sroSaleType: newSaleType,
            sroScheduleNo: newScheduleNo,
            sroItemSerialNo: newSerialNo,
          };
        }
      );

      if (!hasChanges) return prev;
      return {...prev, invoiceDetailDIRequests: updatedDetails};
    });
  }, [productScenarios, newInvoice.scenarioId, addModal]);

  useEffect(() => {
    if (autoInvoiceNo && addModal && newInvoice.invoiceId === 0) {
      setNewInvoice((prev) => ({...prev, invoiceNo: autoInvoiceNo}));
    }
  }, [autoInvoiceNo, addModal, newInvoice.invoiceId]);

  // Fetch Party Data
  const {data: buyerData, isLoading: buyerDataIsLoading} = useQuery({
    queryKey: ['buyerData', loginAccessToken],
    queryFn: async () => {
      const res = await fetch('/api/CRM/Buyer/GetAll', {
        headers: {Authorization: `Bearer ${loginAccessToken}`},
      });
      const result = await handleApiResponse(res, 'Failed to fetch party data');
      return Array.isArray(result?.data) ? result.data : [];
    },
    onError: () => toast.error('Failed to fetch party data'),
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // View Report Mutation
  const {mutate: viewReport, isPending: isReportLoading} = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/RPT/DI/GetSalesTaxInvoiceDetail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          accept: 'text/plain',
        },
        body: JSON.stringify({
          appProductReportId: 0,
          exportProcedureName: 'invoice',
          targetSource: 'SalesTaxInvoice',
          filters: JSON.stringify({
            FromDate: dateFilters.FromDate,
            ToDate: dateFilters.ToDate,
          }),
          outputResultType: 'PDF',
          dataExportType: 'PDF',
        }),
      });

      return handleApiResponse(res, 'Failed to fetch report');
    },
    onSuccess: (result) => {
      if (result?.data) {
        window.open(result.data, '_blank');
      } else {
        toast.error('Report URL not found');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error generating report');
    },
  });

  // Print Single Invoice Mutation
  const {mutate: printInvoice, isPending: isPrinting} = useMutation({
    mutationFn: async ({invoiceId, report}) => {
      if (!report?.appProductReportId) {
        throw new Error('No report layout selected.');
      }

      const payload = {
        AppProductReportId: report.appProductReportId,
        ExportProcedureName: report.exportProcedureName ?? '',
        TargetSource: report.targetSource,
        Filters: JSON.stringify({
          InvoiceId: invoiceId,
          DataExportType: 'DEFAULT',
          OutputResultType: 'PDF',
        }),
        OutputResultType: 'PDF',
        DataExportType: 'DEFAULT',
      };

      const res = await fetch('/api/RPT/PDF/GetFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          accept: 'text/plain',
        },
        body: JSON.stringify(payload),
      });
      return handleApiResponse(res, 'Failed to fetch invoice PDF');
    },
    onSuccess: (result) => {
      const url = result?.data;
      if (url) {
        window.open(url, '_blank');
        setReportModal({open: false, invoiceId: null});
      } else {
        toast.error('PDF URL not returned by server.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error generating PDF');
    },
  });

  //  Fetch Single Invoice
  const {data: invoiceById, isLoading: invoiceIdIsLoading} = useQuery({
    queryKey: ['invoiceById', newInvoice.invoiceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/Invoice/GetById?Id=${newInvoice.invoiceId}`,
        {
          headers: {
            accept: 'text/plain',
            Authorization: `Bearer ${loginAccessToken}`,
          },
        }
      );
      return handleApiResponse(res, 'Failed to fetch Invoice details');
    },
    enabled: !!newInvoice.invoiceId,
  });

  useEffect(() => {
    const p = invoiceById?.data;
    if (!p) return;

    setNewInvoice((prev) => ({
      ...prev,
      invoiceId: p.invoiceId ?? 0,
      partyId: p.partyId ?? 0,
      partyLocationId: p.partyLocationId ?? 0,
      currencyId: p.currencyId ?? 0,
      scenarioId: p.scenarioId ?? 0,
      ntn: p.ntn ?? '',
      gst: p.gst ?? '',
      cnic: p.cnic ?? '',
      invoiceOn: p.invoiceOn ?? '',
      invoiceRefNo: p.invoiceRefNo ?? '',
      invoiceNo: p.invoiceNo ?? '',
      invoiceRemarks: p.invoiceRemarks ?? '',
      totalAmount: p.totalAmount ?? 0,
      totalGross: p.totalGross ?? 0,
      totalTax: p.totalTax ?? 0,
      totalReceivable: p.totalReceivable ?? 0,
      rowVersionLong: p.rowVersionLong ?? 0,
      invoiceDetailDIRequests: (p.invoiceDetailDIRequests || []).map(
        (detail) => ({
          ...detail,
          invoiceDetailId: detail.invoiceDetailId || 0,
          invoiceId: detail.invoiceId || p.invoiceId || 0,
          productId: detail.productId || 0,
          quantity: detail.quantity ?? 0,
          orderUnitId: detail.orderUnitId || 0,
          price: detail.price ?? 0,
          orderAmount: detail.orderAmount ?? 0,
          discPercent: detail.discPercent ?? 0,
          discountAmount: detail.discountAmount ?? 0,
          grossAmount: detail.grossAmount ?? 0,
          taxPercent: detail.taxPercent ?? 0,
          taxAmount: detail.taxAmount ?? 0,
          receivableAmount: detail.receivableAmount ?? 0,
          lineDescription: detail.lineDescription || '',
          sroSaleType: detail.sroSaleType || '',
          sroScheduleNo: detail.sroScheduleNo || '',
          sroItemSerialNo: detail.sroItemSerialNo || '',
          productRefNo: detail.productRefNo || '',
          productName: detail.productName || '',
          unitShortName: detail.unitShortName || '',
        })
      ),

      partyRegistrationTypeName:
        p.partyRegistrationTypeName ||
        buyerData?.find((item) => item.partyId === p.partyId)
          ?.partyRegistrationTypeName ||
        '',
    }));

    setAddModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceById]);

  //  Save / Update Invoice Mutation
  const {mutate: saveInvoice, isPending} = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/DI/Invoice/Save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(res, 'Failed to save invoice');
    },

    onSuccess: (result) => {
      toast.success(result?.message);
      const savedId =
        result?.id ||
        result?.data?.invoiceId ||
        result?.data ||
        newInvoice.invoiceId;

      if (shouldPreviewFlag && savedId) {
        setReportModal({open: true, invoiceId: savedId});
      }

      queryClient.invalidateQueries(['partyList']);
      queryClient.invalidateQueries(['invoiceList']);
      handleCloseModal();
      setShouldPreviewFlag(false);
    },

    onError: (err) => {
      toast.error(err.message);
      setShouldPreviewFlag(false);
    },
    retry: false,
  });

  // Handle Add Invoice Function

  const getValidationErrors = () => {
    const errors = {};

    const addErr = (section, msg) => {
      if (!errors[section]) errors[section] = [];
      errors[section].push(msg);
    };

    if (!newInvoice.partyId || Number(newInvoice.partyId) <= 0) {
      addErr('Buyer Information', 'Buyer Name is a required field.');
    }
    if (
      !newInvoice.partyLocationId ||
      Number(newInvoice.partyLocationId) <= 0
    ) {
      addErr('Buyer Information', 'Buyer Location is a required field.');
    }

    if (!newInvoice.invoiceOn) {
      addErr('Basic Information', 'Invoice Date is a required field.');
    }
    if (!newInvoice.currencyId || Number(newInvoice.currencyId) <= 0) {
      addErr('Basic Information', 'Currency is a required field.');
    }
    if (!newInvoice.scenarioId || Number(newInvoice.scenarioId) <= 0) {
      addErr('Basic Information', 'Scenario is a required field.');
    }

    const details = newInvoice.invoiceDetailDIRequests || [];

    const itemsWithProduct = details.filter(
      (item) => Boolean(item.productId) && Number(item.productId) > 0
    );

    if (details.length === 0 || itemsWithProduct.length === 0) {
      addErr(
        'Product Details',
        'Please select a Product for at least one line item.'
      );
    }

    details.forEach((item, index) => {
      const lineIdx = index + 1;
      const hasProd = Boolean(item.productId) && Number(item.productId) > 0;
      const productObj = products.find((p) => p.productId === item.productId);
      const prodName =
        productObj?.productName ||
        productObj?.productRefNo ||
        `Product #${item.productId}`;

      if (!hasProd && details.length > 1) {
        addErr(
          'Product Details',
          `Line ${lineIdx}: Product Description is a required field.`
        );
      }

      if (hasProd) {
        if (!item.quantity || Number(item.quantity) <= 0) {
          addErr(
            'Product Details',
            `Line ${lineIdx} (${prodName}): Quantity must be greater than 0.`
          );
        }
        if (!item.price || Number(item.price) <= 0) {
          addErr(
            'Product Details',
            `Line ${lineIdx} (${prodName}): Rate must be greater than 0.`
          );
        }

        if (newInvoice.scenarioId) {
          const matched = findProductScenario(
            item.productId,
            newInvoice.scenarioId
          );
          if (!matched) {
            const scenarioObj = scenarioOptions.find(
              (s) => Number(s.value) === Number(newInvoice.scenarioId)
            );
            const scenarioName = scenarioObj?.label || 'the selected scenario';
            addErr(
              'Product Details',
              `Line ${lineIdx} (${prodName}): Scenario "${scenarioName}" is not configured for this product.`
            );
          }
        }
      }
    });

    return errors;
  };

  const handleAddInvoice = (preview = false) => {
    setShouldPreviewFlag(preview);

    const errors = getValidationErrors();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setValidationModalOpen(true);
      return;
    }

    const details = newInvoice.invoiceDetailDIRequests || [];
    const totals = calculateTotals();

    const cleanInvoice = {...newInvoice};

    const payload = {
      ...cleanInvoice,
      partyId: newInvoice.partyId || null,
      partyLocationId: newInvoice.partyLocationId || null,
      currencyId: newInvoice.currencyId || null,
      scenarioId: newInvoice.scenarioId || null,
      totalAmount: Number((totals.totalAmount || 0).toFixed(2)),
      totalDiscount: Number((totals.totalDiscount || 0).toFixed(2)),
      totalTax: Number((totals.totalTax || 0).toFixed(2)),
      totalReceivable: Number((totals.totalReceivable || 0).toFixed(2)),
      totalGross: Number((totals.totalGross || 0).toFixed(2)),

      invoiceDetailDIRequests: details.map((item) => {
        const product = products.find((p) => p.productId === item.productId);

        const resolvedUnitId =
          product?.orderUnitId ||
          product?.unitId ||
          item.orderUnitId ||
          (product?.unitShortName &&
            units.find((u) => u.unitShortName === product.unitShortName)
              ?.unitId) ||
          (item.unitShortName &&
            units.find((u) => u.unitShortName === item.unitShortName)
              ?.unitId) ||
          (product?.orderUnitName &&
            units.find((u) => u.unitName === product.orderUnitName)?.unitId) ||
          0;

        return {
          ...item,
          invoiceId: newInvoice.invoiceId || 0,
          orderUnitId: resolvedUnitId,
          sroSaleType: item.sroSaleType
            ? String(item.sroSaleType).trim()
            : null,
          sroScheduleNo: item.sroScheduleNo
            ? String(item.sroScheduleNo).trim()
            : null,
          sroItemSerialNo: item.sroItemSerialNo
            ? String(item.sroItemSerialNo).trim()
            : null,
          taxPercent: Number(item.taxPercent) || 0,
        };
      }),

      deletedInvoiceDetailDIRequests:
        newInvoice.deletedInvoiceDetailDIRequests?.map((item) => ({
          ...item,
          invoiceId: newInvoice.invoiceId || 0,
        })) || [],
    };

    saveInvoice(payload);
  };

  //  Delete Invoice Mutation
  const {mutate: deleteInvoice} = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/DI/Invoice/DeleteById?id=${id}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${loginAccessToken}`},
      });

      return handleApiResponse(res, 'Failed to delete invoice');
    },

    onSuccess: (deletedId) => {
      setSuccessModalOpen(true);
      queryClient.setQueryData(['invoiceList'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((invoice) => invoice.invoiceId !== deletedId);
      });
    },

    onError: (err) => toast.error(err.message),
  });

  // Bulk Delete Invoice Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (selectedIds) => {
      const payload = selectedIds.map((id) => ({
        invoiceId: id,
        partyId: null,
        partyLocationId: null,
        currencyId: null,
        invoiceOn: new Date().toISOString(),
        invoiceNo: '',
        invoiceRemarks: '',
        totalAmount: 0,
        totalGross: 0,
        totalTax: 0,
        totalReceivable: 0,
        rowVersionLong: 0,
        invoiceDetailDIRequests: [],
        deletedInvoiceDetailDIRequests: [],
      }));

      const res = await fetch('/api/DI/Invoice/DeleteAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      return handleApiResponse(res, 'Failed to delete invoices');
    },

    onMutate: () => setBulkDeleting(true),

    onSuccess: (deletedIds) => {
      setBulkDeleteModal(false);
      queryClient.setQueryData(['invoiceList'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(
          (invoice) => !deletedIds.includes(invoice.invoiceId)
        );
      });

      setSelectedRowKeys([]);
      setSuccessModalOpen(true);
    },

    onError: (err) => toast.error(err.message),
    onSettled: () => setBulkDeleting(false),
  });

  const handleConfirmBulkDelete = () => {
    if (!permission(canDelete, 'No permission to delete invoices')) {
      setBulkDeleteModal(false);
      return;
    }
    bulkDeleteMutation.mutate(selectedRowKeys);
  };

  // Handlers
  const handleDeleteClick = (id) => setConfirmModal({open: true, id});

  const handleConfirmDelete = () => {
    if (!confirmModal.id) return;
    setDeletingId(confirmModal.id);
    deleteInvoice(confirmModal.id, {
      onSettled: () => setDeletingId(null),
    });
    setConfirmModal({open: false, id: null});
  };

  const handleCancelDelete = () => setConfirmModal({open: false, id: null});

  // auto select currency if only one currency is available
  useEffect(() => {
    if (currency?.length === 1 && addModal && newInvoice.invoiceId === 0) {
      setNewInvoice((prev) => ({
        ...prev,
        currencyId: currency[0].currencyId,
      }));
    }
  }, [currency, addModal, newInvoice.invoiceId]);

  const handleCloseModal = () => {
    setAddModal(false);
    setNewInvoice({
      invoiceId: 0,
      partyId: null,
      partyLocationId: null,
      currencyId: null,
      scenarioId: null,
      invoiceOn: dayjs().endOf('day').toISOString(),
      invoiceRefNo: '',
      invoiceNo: '',
      invoiceRemarks: '',
      totalAmount: 0,
      totalGross: 0,
      totalTax: 0,
      totalReceivable: 0,
      partyRegistrationTypeName: '',
      cnic: '',
      invoiceDetailDIRequests: [
        {
          invoiceDetailId: 0,
          invoiceId: 0,
          lineId: 0,
          productId: 0,
          quantity: 0,
          orderUnitId: 0,
          price: 0,
          orderAmount: 0,
          discPercent: 0,
          discountAmount: 0,
          grossAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          receivableAmount: 0,
          lineDescription: '',
          sroSaleType: '',
          sroScheduleNo: '',
          sroItemSerialNo: '',
        },
      ],
      deletedInvoiceDetailDIRequests: [],
    });
  };

  useCloseOnEscape(addModal, handleCloseModal);

  // Remove Scrollbar on Popup
  useEffect(() => {
    if (addModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [addModal]);

  const calculateTotals = () => {
    const details = newInvoice.invoiceDetailDIRequests || [];

    const totalAmount = details.reduce(
      (sum, item) => sum + (item.orderAmount || 0),
      0
    );
    const totalDiscount = details.reduce(
      (sum, item) => sum + (item.discountAmount || 0),
      0
    );
    const totalGross = details.reduce(
      (sum, item) => sum + (item.grossAmount || 0),
      0
    );
    const totalTax = details.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0
    );
    const totalReceivable = details.reduce(
      (sum, item) => sum + (item.receivableAmount || 0),
      0
    );

    return {
      totalAmount,
      totalDiscount,
      totalGross,
      totalTax,
      totalReceivable,
    };
  };

  const handleScenarioChange = (selectedScenarioId) => {
    setNewInvoice((prev) => {
      const updatedDetails = (prev.invoiceDetailDIRequests || []).map(
        (item) => {
          let taxPercent = 0;
          let sroSaleType = '';
          let sroScheduleNo = '';
          let sroItemSerialNo = '';

          if (item.productId && selectedScenarioId) {
            const matched = findProductScenario(
              item.productId,
              selectedScenarioId
            );
            if (matched) {
              taxPercent = matched.taxPercent ?? 0;
              sroSaleType = matched.sroSaleType || '';
              sroScheduleNo = matched.sroScheduleNo || '';
              sroItemSerialNo = matched.sroItemSerialNo || '';
            }
          }

          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const dPer = Number(item.discPercent) || 0;
          const tPer = Number(taxPercent) || 0;

          const orderAmount = Number((qty * price).toFixed(2));
          const discAmt = Number(((orderAmount * dPer) / 100).toFixed(2));
          const grossAmount = Number((orderAmount - discAmt).toFixed(2));
          const taxAmt = Number(((grossAmount * tPer) / 100).toFixed(2));
          const receivableAmount = Number((grossAmount + taxAmt).toFixed(2));

          return {
            ...item,
            taxPercent,
            taxAmount: taxAmt,
            grossAmount,
            orderAmount,
            discountAmount: discAmt,
            receivableAmount,
            sroSaleType,
            sroScheduleNo,
            sroItemSerialNo,
          };
        }
      );

      return {
        ...prev,
        scenarioId: selectedScenarioId,
        invoiceDetailDIRequests: updatedDetails,
      };
    });
  };

  const handleLineItemChange = (index, field, value) => {
    setNewInvoice((prev) => {
      const updated = [...prev.invoiceDetailDIRequests];
      let finalValue = value;

      if (typeof finalValue === 'string' && finalValue.includes('.')) {
        const [int, dec] = finalValue.split('.');
        if (dec.length > 2) {
          finalValue = `${int}.${dec.slice(0, 2)}`;
        }
      }

      if (
        (field === 'taxPercent' || field === 'discPercent') &&
        Number(finalValue) > 100
      ) {
        finalValue = 100;
      }
      updated[index] = {...updated[index], [field]: finalValue};

      const item = updated[index];

      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discPer = Number(item.discPercent) || 0;
      const taxPer = Number(item.taxPercent) || 0;

      const orderAmount = Number((qty * price).toFixed(2));
      const discAmount = Number(((orderAmount * discPer) / 100).toFixed(2));
      const grossAmount = Number((orderAmount - discAmount).toFixed(2));
      const taxAmt = Number(((grossAmount * taxPer) / 100).toFixed(2));
      const total = Number((grossAmount + taxAmt).toFixed(2));

      updated[index].orderAmount = orderAmount;
      updated[index].discountAmount = discAmount;
      updated[index].grossAmount = grossAmount;
      updated[index].taxAmount = taxAmt;
      updated[index].receivableAmount = total;

      return {...prev, invoiceDetailDIRequests: updated};
    });
  };

  const isFormValid = () => {
    const details = newInvoice.invoiceDetailDIRequests || [];
    const itemsWithProduct = details.filter(
      (item) => Boolean(item.productId) && Number(item.productId) > 0
    );

    if (itemsWithProduct.length === 0) return false;

    const allValidItems = itemsWithProduct.every(
      (item) => Number(item.quantity) > 0 && Number(item.price) > 0
    );
    if (!allValidItems) return false;

    if (newInvoice.scenarioId) {
      const allScenariosConfigured = itemsWithProduct.every((item) => {
        const matched = findProductScenario(
          item.productId,
          newInvoice.scenarioId
        );
        return Boolean(matched);
      });
      if (!allScenariosConfigured) return false;
    }

    return Boolean(
      newInvoice.partyId &&
      newInvoice.partyLocationId &&
      newInvoice.currencyId &&
      newInvoice.scenarioId &&
      newInvoice.invoiceOn &&
      newInvoice.invoiceNo?.trim()
    );
  };

  const buyerTaxField = useMemo(() => {
    const regType = (newInvoice.partyRegistrationTypeName || '').toUpperCase();

    if (regType.includes('UNREGISTERED')) {
      return {
        id: 'ntn',
        label: 'NTN / CNIC',
        value: newInvoice.ntn || '0000000000000',
        placeholder: '0000000000000',
      };
    }

    if (regType.includes('STRN') || regType.includes('GST')) {
      return {
        id: 'gst',
        label: 'STRN',
        value: newInvoice.gst || '',
        placeholder: 'STRN value...',
      };
    }

    if (regType.includes('CNIC')) {
      return {
        id: 'cnic',
        label: 'CNIC',
        value: newInvoice.cnic || newInvoice.ntn || '',
        placeholder: 'CNIC value...',
      };
    }

    return {
      id: 'ntn',
      label: 'NTN',
      value: newInvoice.ntn || '',
      placeholder: 'NTN value...',
    };
  }, [
    newInvoice.partyRegistrationTypeName,
    newInvoice.ntn,
    newInvoice.gst,
    newInvoice.cnic,
  ]);

  // Search Filter
  const filteredData = useGlobalFilter(invoiceList, globalSearch, [
    'sr',
    'invoiceOn',
    'partyName',
    'partyLocationName',
    'ntn',
    'gst',
    'cnic',
    'totalTax',
    'invoiceNo',
    'totalAmount',
    'totalReceivable',
  ]);

  //  Table Columns
  const columns = [
    {
      title: 'SR.',
      dataIndex: 'sr',
      width: 60,
      sorter: (a, b) => a.sr - b.sr,
      align: 'center',
    },
    {
      title: 'DATE',
      dataIndex: 'invoiceOn',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.invoiceOn.localeCompare(b.invoiceOn),
      render: (value) => {
        const formatted = value ? dayjs(value).format('DD-MM-YYYY') : 'N/A';
        return <span className="text-center block">{formatted}</span>;
      },
    },
    {
      title: 'INV NO.',
      dataIndex: 'invoiceNo',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.invoiceNo.localeCompare(b.invoiceNo),
    },
    {
      title: 'BUYER',
      dataIndex: 'partyName',
      width: 215,
      ellipsis: true,
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
      render: (_, record) => (
        <div className="flex flex-col">
          <span
            className="font-medium text-left truncate max-w-50"
            title={record.partyName}
          >
            {record.partyName || 'N/A'}
          </span>
          <span
            className="text-xs text-gray-500 text-left truncate max-w-50 -mt-1"
            title={record.partyLocationName}
          >
            {record.partyLocationName || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'REG INFO',
      key: 'regInfo',
      width: 120,
      ellipsis: true,
      align: 'right',
      sorter: (a, b) => {
        const valA =
          a.cnic !== 'N/A' ? a.cnic : a.ntn !== 'N/A' ? a.ntn : a.gst;
        const valB =
          b.cnic !== 'N/A' ? b.cnic : b.ntn !== 'N/A' ? b.ntn : b.gst;
        return valA.localeCompare(valB);
      },
      render: (_, record) => {
        let label = '';
        let value = '';

        const isInvalid = (val) => !val || val === 'N/A';
        const regType = (record.partyRegistrationTypeName || '').toUpperCase();

        if (regType.includes('UNREGISTERED')) {
          label = 'NTN / CNIC';
          value = !isInvalid(record.ntn)
            ? record.ntn
            : !isInvalid(record.cnic)
              ? record.cnic
              : '0000000000000';
        } else if (!isInvalid(record.cnic)) {
          label = 'CNIC';
          value = record.cnic;
        } else if (!isInvalid(record.ntn)) {
          label =
            record.ntn.replace(/[-]/g, '').length === 13 ? 'NTN / CNIC' : 'NTN';
          value = record.ntn;
        } else if (!isInvalid(record.gst)) {
          label = 'STRN';
          value = record.gst;
        }

        return (
          <div className="flex flex-col items-end w-full">
            {value ? (
              <>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-400 opacity-80' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`truncate max-w-27.5 font-semibold -mt-0.5 ${
                    isDarkMode ? 'text-purple-400' : 'text-[#4c1d95]'
                  }`}
                >
                  {value}
                </span>
              </>
            ) : (
              <span className="text-gray-400 italic text-[11px]">
                Unregistered
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'TOTAL TAX',
      dataIndex: 'totalTax',
      width: 125,
      sorter: (a, b) => a.totalTax - b.totalTax,
      render: (value) => (
        <span className="text-right block">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'TOTAL REC...',
      dataIndex: 'totalReceivable',
      width: 130,
      align: 'left',
      sorter: (a, b) => a.totalReceivable - b.totalReceivable,
      render: (value) => (
        <span className="text-right block">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'ACTION',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <ActionButtons
            record={record}
            isEditLoading={
              invoiceIdIsLoading && newInvoice.invoiceId === record.invoiceId
            }
            isDeleteLoading={deletingId === record.key}
            darkMode={isDarkMode}
            editDisabled={record.integrationStatus === 'Success'}
            deleteDisabled={record.integrationStatus === 'Success'}
            onEdit={(rec) => {
              if (!permission(canEdit, 'No permission to edit invoice')) return;
              setNewInvoice((prev) => ({...prev, invoiceId: rec.invoiceId}));
            }}
            onDelete={(rec) => {
              if (!permission(canDelete, 'No permission to delete invoice'))
                return;
              handleDeleteClick(rec.key);
            }}
          />

          {isPrinting && reportModal.invoiceId === record.invoiceId ? (
            <div
              className={`h-8 w-8 rounded-xl border transition-colors duration-200 shadow-sm flex items-center justify-center ${
                isDarkMode
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  : 'bg-white border-gray-300 text-sky-600'
              }`}
            >
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <button
              onClick={() => {
                if (!permission(canView, 'No permission to view invoice PDF'))
                  return;
                if (reports.length === 1) {
                  setReportModal({open: false, invoiceId: record.invoiceId});
                  printInvoice({
                    invoiceId: record.invoiceId,
                    report: reports[0],
                  });
                } else {
                  setReportModal({open: true, invoiceId: record.invoiceId});
                }
              }}
              className={`flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ${
                isDarkMode
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/25 hover:text-sky-300 hover:border-sky-500/40'
                  : 'bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 hover:border-sky-200'
              } shadow-sm active:scale-90 group`}
              title="Preview PDF"
            >
              <img
                src={pdfIcon}
                alt="PDF"
                className="w-4 h-4 transition-transform group-hover:scale-105"
              />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200  ${
          isDarkMode ? ' bg-[#141025]' : 'bg-gray-50'
        }`}
      >
        {/* 1 */}
        <Breadcrumb />

        {/* 2 */}
        <div className="flex flex-row items-center gap-2">
          <CustomButton
            onClick={() => setShowAdvancedFilter(true)}
            icon={Filter}
            isDarkMode={isDarkMode}
            title="Filter"
          />

          <CustomButton
            onClick={() => {
              if (!permission(canView, 'No permission to view report')) return;
              viewReport();
            }}
            icon={isReportLoading ? Loader : FilePieChart}
            isDarkMode={isDarkMode}
            title={isReportLoading ? 'Generating...' : 'View Report'}
            disabled={isReportLoading}
            className={`${isReportLoading ? '[&>svg]:animate-spin shrink-0' : ''} 
              ${
                isDarkMode
                  ? 'text-emerald-400! border-emerald-500/30! bg-emerald-500/5! hover:bg-emerald-500/20! hover:text-emerald-300! hover:border-emerald-500/50!'
                  : 'text-emerald-600! border-emerald-200! bg-emerald-50! hover:bg-emerald-600! hover:text-white! hover:border-emerald-600!'
              } shadow-sm transition-all duration-300`}
          />

          <CustomButton
            onClick={() => {
              if (!permission(canAdd, 'No permission to add invoice')) return;
              setAddModal(true);
              setShowFilters(false);
            }}
            icon={Redo}
            isDarkMode={isDarkMode}
            title="Add Invoice"
            disabled={buyerDataIsLoading}
            className={
              buyerDataIsLoading ? 'opacity-50 cursor-not-allowed' : ''
            }
          />
        </div>
      </div>

      {showAdvancedFilter && (
        <div className="mb-3">
          <AdvancedFilter
            onClose={() => setShowAdvancedFilter(false)}
            initialRows={advFilterRows}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
            getAcademicYearDates={getAcademicYearDates}
            onApply={(filters, rows) => {
              setAdvFilters(filters);
              setAdvFilterRows(rows);
              setShowAdvancedFilter(false);
            }}
          />
        </div>
      )}

      <div className="mb-3">
        <div className="flex flex-col gap-2">
          <InvoiceFilters
            showFilters={showFilters}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
            getAcademicYearDates={getAcademicYearDates}
          />
        </div>
      </div>

      <div className="mb-2 px-1">
        <p
          className={`text-xs sm:text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Data loaded from{' '}
          <span className="font-semibold">
            {dayjs(dateFilters.FromDate).format('DD-MM-YYYY')}
          </span>{' '}
          to{' '}
          <span className="font-semibold">
            {dayjs(dateFilters.ToDate).format('DD-MM-YYYY')}
          </span>
        </p>
      </div>

      <CustomTable
        loading={isListLoading}
        columns={columns}
        dataSource={filteredData}
        isDarkMode={isDarkMode}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search Invoice..."
        totalLabel="Total Records"
        rowKey="key"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            name: `party-${record.key}`,
            id: `party-${record.key}`,
            disabled: record.integrationStatus === 'Success',
          }),
        }}
        footer={() =>
          selectedRowKeys.length > 0 && (
            <div className="flex justify-end">
              <CustomButton
                icon={Trash2}
                onClick={() => {
                  if (
                    !permission(canDelete, 'No permission to delete invoices')
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

      <CustomModal isOpen={addModal} isDarkMode={isDarkMode} fullScreen>
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className={`absolute top-4 right-4 sm:top-6 sm:right-8 z-60 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 group ${
            isDarkMode
              ? 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30'
              : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200'
          } shadow-sm backdrop-blur-md cursor-pointer `}
          title="Close (Esc)"
        >
          <X
            size={20}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>

        {/* Header */}
        <h2
          className={`flex items-center gap-2 text-xl font-semibold mb-6 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-700'
          }`}
        >
          <Edit size={20} />
          {newInvoice.invoiceId
            ? 'Edit Sales Tax Invoice'
            : 'Add Sales Tax Invoice'}
        </h2>

        {/* FORM SECTION */}
        <div className="space-y-6 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Party Info */}
            <div
              className={`rounded-xl p-4 border space-y-3 shadow-md ${
                isDarkMode ? ' bg-black/5 border-white/10' : ' border-black/10'
              }`}
            >
              <h2 className="text-xl font-semibold text-(--secondary-color)">
                Buyer Information
              </h2>

              <div className="grid grid-cols-2 gap-2">
                <SelectDropDown
                  id="partyId"
                  label="Name"
                  className="col-span-2 sm:col-span-1"
                  value={newInvoice.partyId}
                  placeholder="Select Buyer Name"
                  required
                  options={buyerData?.map((item) => ({
                    label: item.partyName,
                    value: item.partyId,
                  }))}
                  onChange={(value) => {
                    const selectedParty = buyerData.find(
                      (p) => p.partyId === value
                    );

                    const locations =
                      selectedParty?.partyLocationDIRequests || [];
                    const autoLocId =
                      locations.length === 1
                        ? locations[0].partyLocationId
                        : '';

                    setNewInvoice({
                      ...newInvoice,
                      partyId: value,
                      partyLocationId: autoLocId,
                      ntn: selectedParty?.ntn || '',
                      gst: selectedParty?.gst || '',
                      cnic: selectedParty?.cnic || '',
                      partyRegistrationTypeName:
                        selectedParty?.partyRegistrationTypeName || '',
                    });
                  }}
                />

                <SelectDropDown
                  id="loc"
                  label="Location"
                  className="col-span-2 sm:col-span-1"
                  value={newInvoice.partyLocationId}
                  placeholder="Select Buyer Location"
                  required
                  options={
                    buyerData
                      ?.find((item) => item.partyId === newInvoice.partyId)
                      ?.partyLocationDIRequests?.map((loc) => ({
                        label: loc.partyLocationName,
                        value: loc.partyLocationId,
                      })) || []
                  }
                  onChange={(value) =>
                    setNewInvoice({
                      ...newInvoice,
                      partyLocationId: value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <CustomInput
                  id="partyRegType"
                  label="Registration Type"
                  className="col-span-1"
                  placeholder="Registration Type..."
                  value={newInvoice.partyRegistrationTypeName || ''}
                  disabled
                />

                <CustomInput
                  id={buyerTaxField.id}
                  label={buyerTaxField.label}
                  className="col-span-1"
                  placeholder={buyerTaxField.placeholder}
                  value={buyerTaxField.value}
                  disabled
                />
              </div>
            </div>

            {/* Basic Info */}
            <div
              className={` rounded-xl p-4 border space-y-3 shadow-md ${
                isDarkMode ? ' bg-black/5 border-white/10' : ' border-black/10'
              }`}
            >
              <h2 className="text-xl font-semibold text-(--secondary-color)">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CustomInput
                  id="invoiceNo"
                  label="Invoice No"
                  placeholder="e.g. INV-0001"
                  required
                  value={newInvoice.invoiceNo}
                  onChange={(e) =>
                    setNewInvoice({
                      ...newInvoice,
                      invoiceNo: e.target.value,
                    })
                  }
                />

                <SelectDropDown
                  id="currencyId"
                  label="Currency"
                  value={newInvoice.currencyId}
                  placeholder="Select Currency"
                  required
                  options={currency.map((c) => ({
                    label: c.currencyName,
                    value: c.currencyId,
                  }))}
                  onChange={(value) =>
                    setNewInvoice({
                      ...newInvoice,
                      currencyId: value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Invoice Date{' '}
                    <span className="text-red-500 font-semibold">*</span>
                  </label>

                  <DatePicker
                    format="DD-MM-YYYY"
                    className={`custom-datepicker w-full! ${
                      isDarkMode
                        ? 'bg-black/10! border-gray-700! text-white!'
                        : 'bg-gray-100/50! border-gray-300! text-gray-900!'
                    }`}
                    value={
                      newInvoice.invoiceOn ? dayjs(newInvoice.invoiceOn) : null
                    }
                    onChange={(date) =>
                      setNewInvoice((prev) => ({
                        ...prev,
                        invoiceOn: date
                          ? dayjs(date).endOf('day').toISOString()
                          : '',
                      }))
                    }
                  />
                </div>

                <SelectDropDown
                  id="scenarioId"
                  label="Scenario"
                  value={newInvoice.scenarioId}
                  placeholder="Select Scenario"
                  required
                  options={scenarioOptions}
                  onChange={(value) => handleScenarioChange(value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="space-y-3">
          <div
            className={`rounded-xl border ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div
              className="w-full overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 custom-scrollbar"
              style={{WebkitOverflowScrolling: 'touch'}}
            >
              <div className="min-w-0">
                <div
                  className={`hidden lg:grid grid-cols-[35px_minmax(180px,3.5fr)_60px_70px_85px_95px_60px_85px_60px_85px_105px_35px] gap-2 p-4 lg:px-3 lg:py-2.5 text-[10px] xl:text-[11px] font-bold uppercase tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-[#1f1a36] border-white/10 text-purple-300'
                      : 'bg-gray-200/50 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-center">Sr.</div>
                  <div className="pl-2">Product Description</div>
                  <div className="text-center">Unit</div>
                  <div className="text-right pr-2">Qty</div>
                  <div className="text-right pr-2">Rate</div>
                  <div className="text-left">Total Amount</div>
                  <div className="text-right pr-1">Disc%</div>
                  <div className="text-right pr-1">Disc Amt</div>
                  <div className="text-right pr-1">Tax%</div>
                  <div className="text-right pr-1">Tax Amt</div>
                  <div className="text-right pr-4">Net Total</div>
                  <div className="text-center"></div>
                </div>

                {/* --- Table Row (Input) --- */}
                {newInvoice.invoiceDetailDIRequests.map((item, index) => {
                  const hasProduct = Boolean(item.productId);
                  const matchedScenario =
                    hasProduct && newInvoice.scenarioId
                      ? findProductScenario(
                          item.productId,
                          newInvoice.scenarioId
                        )
                      : null;
                  const isScenarioMissing =
                    hasProduct &&
                    Boolean(newInvoice.scenarioId) &&
                    !matchedScenario;

                  return (
                    <div
                      key={index}
                      className={`
                          flex flex-col lg:grid lg:grid-cols-[35px_minmax(180px,3.5fr)_60px_70px_85px_95px_60px_85px_60px_85px_105px_35px] 
                          gap-3 lg:gap-2 p-4 lg:px-3 lg:py-2 items-stretch lg:items-center 
                          hover:bg-purple-500/5 transition-all duration-300 border-b last:border-b-0 rounded-xl lg:rounded-none mb-4 lg:mb-0
                          ${
                            isScenarioMissing
                              ? isDarkMode
                                ? 'bg-rose-950/20 lg:bg-rose-950/10 border-rose-500/30'
                                : 'bg-rose-50/60 lg:bg-rose-50/30 border-rose-200'
                              : isDarkMode
                                ? 'bg-black/5 lg:bg-transparent border-white/5'
                                : 'bg-white lg:bg-transparent border-gray-100 shadow-sm lg:shadow-none'
                          } 
                          
                        `}
                    >
                      {/* Mobile Head: Sr and Delete */}
                      <div className="flex items-center justify-between lg:justify-center border-b lg:border-none border-purple-500/10 dark:border-white/5 pb-2 lg:pb-0 mb-2 lg:mb-0">
                        <div className="flex items-center gap-2">
                          <span className="lg:hidden text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                            Line Item
                          </span>
                          <span
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              isScenarioMissing
                                ? 'bg-rose-500 text-white'
                                : isDarkMode
                                  ? 'bg-white/10 text-gray-400'
                                  : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>

                        <button
                          type="button"
                          title="Delete Line Item"
                          className={`lg:hidden p-2 rounded-xl transition-all duration-200 active:scale-95 transform ${
                            isDarkMode
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          onClick={() => {
                            const updated = [
                              ...newInvoice.invoiceDetailDIRequests,
                            ];
                            updated.splice(index, 1);
                            setNewInvoice({
                              ...newInvoice,
                              invoiceDetailDIRequests: updated,
                            });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Product Selection */}
                      <div className="flex flex-col lg:block gap-1.5">
                        <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50">
                          Product Description
                        </label>
                        <div
                          className={
                            isScenarioMissing
                              ? 'rounded-xl ring-2 ring-rose-500/70 p-0.5'
                              : ''
                          }
                        >
                          <SelectDropDown
                            value={item.productId}
                            placeholder="Select Product"
                            loading={isPricingLoading}
                            options={products?.map((p) => ({
                              label: `${p.productRefNo || ''} - ${p.productName}`,
                              value: p.productId,
                            }))}
                            onChange={(value) => {
                              const selectedProduct = products.find(
                                (p) => p.productId === value
                              );

                              const updated = [
                                ...newInvoice.invoiceDetailDIRequests,
                              ];

                              updated[index].productId = value;

                              if (selectedProduct) {
                                const partySpecificPrice =
                                  productPriceList?.find(
                                    (p) => p.productId === value
                                  );

                                updated[index].orderUnitId =
                                  selectedProduct.orderUnitId ||
                                  selectedProduct.unitId ||
                                  0;

                                if (partySpecificPrice) {
                                  updated[index].price =
                                    partySpecificPrice.salePrice || 0;
                                  updated[index].discPercent =
                                    partySpecificPrice.discountPercent || 0;
                                } else {
                                  updated[index].price = 0;
                                  updated[index].discPercent = 0;
                                }
                                if (newInvoice.scenarioId) {
                                  const matched = findProductScenario(
                                    value,
                                    newInvoice.scenarioId
                                  );
                                  if (matched) {
                                    updated[index].taxPercent =
                                      matched.taxPercent ?? 0;
                                    updated[index].sroSaleType =
                                      matched.sroSaleType || '';
                                    updated[index].sroScheduleNo =
                                      matched.sroScheduleNo || '';
                                    updated[index].sroItemSerialNo =
                                      matched.sroItemSerialNo || '';
                                  } else {
                                    updated[index].taxPercent = 0;
                                    updated[index].sroSaleType = '';
                                    updated[index].sroScheduleNo = '';
                                    updated[index].sroItemSerialNo = '';
                                  }
                                } else {
                                  updated[index].taxPercent = 0;
                                  updated[index].sroSaleType = '';
                                  updated[index].sroScheduleNo = '';
                                  updated[index].sroItemSerialNo = '';
                                }

                                const qty =
                                  Number(updated[index].quantity) || 0;
                                const price = Number(updated[index].price) || 0;
                                const dPer =
                                  Number(updated[index].discPercent) || 0;
                                const tPer =
                                  Number(updated[index].taxPercent) || 0;

                                const orderAmount = Number(
                                  (qty * price).toFixed(2)
                                );
                                const discAmt = Number(
                                  ((orderAmount * dPer) / 100).toFixed(2)
                                );
                                const grossAmount = Number(
                                  (orderAmount - discAmt).toFixed(2)
                                );
                                const taxAmt = Number(
                                  ((grossAmount * tPer) / 100).toFixed(2)
                                );

                                updated[index].orderAmount = orderAmount;
                                updated[index].discountAmount = discAmt;
                                updated[index].grossAmount = grossAmount;
                                updated[index].taxAmount = taxAmt;
                                updated[index].receivableAmount = Number(
                                  (grossAmount + taxAmt).toFixed(2)
                                );
                              }

                              setNewInvoice({
                                ...newInvoice,
                                invoiceDetailDIRequests: updated,
                              });
                            }}
                          />
                        </div>
                        {isScenarioMissing && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400 mt-1">
                            <AlertCircle
                              size={13}
                              className="shrink-0 animate-pulse"
                            />
                            <span>
                              Scenario not configured for this product
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Unit and Qty */}
                      <div className="grid grid-cols-2 lg:contents gap-3">
                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50">
                            Unit
                          </label>
                          <div
                            className={`h-10 flex items-center justify-center px-2 rounded-lg border-none font-medium text-sm transition-all duration-300 ${
                              isDarkMode
                                ? 'bg-white/5 text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/10'
                                : 'bg-purple-50 text-purple-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] hover:bg-purple-100'
                            }`}
                          >
                            {products.find(
                              (p) => p.productId === item.productId
                            )?.unitShortName ||
                              products.find(
                                (p) => p.productId === item.productId
                              )?.orderUnitName ||
                              item.unitShortName ||
                              '-'}
                          </div>
                        </div>

                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Qty
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right font-medium"
                            placeholder="0"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'quantity',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Rate and Amount */}
                      <div className="grid grid-cols-2 lg:contents gap-3">
                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Rate
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right font-medium"
                            placeholder="0.00"
                            value={item.price || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'price',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Amount
                          </label>
                          <div
                            className={`h-10 flex items-center justify-end px-3 rounded-lg border-none font-semibold text-xs transition-all duration-300 ${
                              isDarkMode
                                ? 'bg-white/5 text-gray-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {Number(item.orderAmount).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Discount Info */}
                      <div className="grid grid-cols-2 lg:contents gap-3">
                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Disc %
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right"
                            placeholder="0"
                            value={item.discPercent || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'discPercent',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Disc Amt
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right"
                            placeholder="0.00"
                            value={item.discountAmount ?? ''}
                            onChange={(e) => {
                              let discAmountVal = e.target.value;
                              if (discAmountVal.includes('.')) {
                                const [int, dec] = discAmountVal.split('.');
                                if (dec.length > 2) {
                                  discAmountVal = `${int}.${dec.slice(0, 2)}`;
                                }
                              }
                              const discAmount = Number(discAmountVal) || 0;
                              const updated = [
                                ...newInvoice.invoiceDetailDIRequests,
                              ];
                              const orderAmount = updated[index].orderAmount;
                              updated[index].discountAmount = discAmountVal;
                              updated[index].discPercent = orderAmount
                                ? Math.min(
                                    (discAmount / orderAmount) * 100,
                                    100
                                  )
                                : 0;

                              // Recalculate based on new discount
                              const grossAmount = Number(
                                (orderAmount - discAmount).toFixed(2)
                              );
                              const taxPer = updated[index].taxPercent;
                              const taxAmt = Number(
                                ((grossAmount * taxPer) / 100).toFixed(2)
                              );

                              updated[index].grossAmount = grossAmount;
                              updated[index].taxAmount = taxAmt;
                              updated[index].receivableAmount = Number(
                                (grossAmount + taxAmt).toFixed(2)
                              );

                              setNewInvoice({
                                ...newInvoice,
                                invoiceDetailDIRequests: updated,
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Tax Info */}
                      <div className="grid grid-cols-2 lg:contents gap-3">
                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Tax %
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right"
                            value={item.taxPercent ?? ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'taxPercent',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-col lg:block gap-1.5">
                          <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">
                            Tax Amount
                          </label>
                          <CustomInput
                            type="number"
                            inputClassName="text-right"
                            placeholder="0.00"
                            value={item.taxAmount ?? ''}
                            onChange={(e) => {
                              let taxAmountVal = e.target.value;
                              // Handle decimal precision (max 2 places)
                              if (taxAmountVal.includes('.')) {
                                const [int, dec] = taxAmountVal.split('.');
                                if (dec.length > 2) {
                                  taxAmountVal = `${int}.${dec.slice(0, 2)}`;
                                }
                              }
                              const taxAmount = Number(taxAmountVal) || 0;
                              const updated = [
                                ...newInvoice.invoiceDetailDIRequests,
                              ];
                              const grossAmount = updated[index].grossAmount;
                              updated[index].taxAmount = taxAmountVal;
                              updated[index].taxPercent = grossAmount
                                ? Math.min((taxAmount / grossAmount) * 100, 100)
                                : 0;
                              updated[index].receivableAmount = Number(
                                (grossAmount + taxAmount).toFixed(2)
                              );
                              setNewInvoice({
                                ...newInvoice,
                                invoiceDetailDIRequests: updated,
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Net Total */}
                      <div className="flex flex-col lg:block gap-1.5 pt-2 lg:pt-0 border-t lg:border-none border-white/10 dark:border-white/5">
                        <label className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-emerald-500 text-right">
                          Net Total
                        </label>
                        <div
                          className={`h-10 flex items-center justify-end px-3 rounded-lg border-none font-bold text-sm transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {Number(item.receivableAmount).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </div>
                      </div>

                      {/* Desktop Only Delete */}
                      <div className="hidden lg:flex justify-center">
                        <button
                          type="button"
                          title="Delete Line Item"
                          className={`p-2 rounded-full transition-all duration-200 ease-in-out active:scale-95 transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isDarkMode
                              ? 'text-red-400 hover:text-red-300 focus-visible:ring-red-400/60 focus-visible:ring-offset-[#141025]'
                              : 'text-red-600 hover:text-red-700 focus-visible:ring-red-600/60 focus-visible:ring-offset-white'
                          }`}
                          onClick={() => {
                            const updated = [
                              ...newInvoice.invoiceDetailDIRequests,
                            ];
                            updated.splice(index, 1);
                            setNewInvoice({
                              ...newInvoice,
                              invoiceDetailDIRequests: updated,
                            });
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New Product Button */}
                <div className="flex justify-start p-3 border-t border-t-purple-600/20">
                  <CustomButton
                    icon={Redo}
                    className="text-sm sm:text-xs"
                    title="Add New Product"
                    onClick={() => {
                      setNewInvoice((prev) => ({
                        ...prev,
                        invoiceDetailDIRequests: [
                          ...prev.invoiceDetailDIRequests,
                          {
                            invoiceDetailId: 0,
                            invoiceId: prev.invoiceId,
                            lineId: prev.invoiceDetailDIRequests.length,
                            productId: 0,
                            quantity: 0,
                            orderUnitId: 0,
                            price: 0,
                            orderAmount: 0,
                            grossAmount: 0,
                            taxPercent: 0,
                            taxAmount: 0,
                            receivableAmount: 0,
                            lineDescription: '',
                            sroSaleType: '',
                            sroScheduleNo: '',
                            sroItemSerialNo: '',
                          },
                        ],
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/*  FOOTER */}
          <div className="flex flex-col md:flex-row justify-between items-start mt-8 gap-4">
            <div
              className={`w-full md:w-96 rounded-2xl shadow-lg border overflow-hidden ${
                isDarkMode
                  ? 'bg-[#141025] border-white/10'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div
                className={`px-6 py-3 border-b ${
                  isDarkMode
                    ? 'bg-white/5 border-white/5'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <h4 className="font-semibold text-sm uppercase tracking-wider">
                  Invoice Summary
                </h4>
              </div>

              <div className="p-6 space-y-4">
                {(() => {
                  const totals = calculateTotals();
                  return (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-70">Sub Total</span>
                        <span className="font-medium">
                          {totals.totalAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-70">Total Discount</span>
                        <span className="font-medium text-red-500">
                          -
                          {totals.totalDiscount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-70">Total Gross</span>
                        <span className="font-medium">
                          {totals.totalGross.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm pb-4 border-b border-dashed border-gray-300 dark:border-gray-700">
                        <span className="opacity-70">Total Tax</span>
                        <span className="font-medium">
                          {totals.totalTax.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-end pt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">
                            Grand Total
                          </span>
                          <span className="text-sm font-bold opacity-80">
                            Total Receivable
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-3xl font-black tracking-tight ${
                              isDarkMode
                                ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                : 'text-purple-700'
                            }`}
                          >
                            <small className="text-xs font-semibold mr-1 opacity-50">
                              PKR
                            </small>
                            {totals.totalReceivable.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 mb-2">
              <div
                className={`grid ${newInvoice.invoiceId > 0 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex gap-2 sm:gap-3`}
              >
                <button
                  onClick={handleCloseModal}
                  className={`h-12 sm:h-10 px-4 sm:px-6 flex items-center justify-center gap-2 rounded-xl sm:rounded-full cursor-pointer transition-all active:scale-95 transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isDarkMode
                      ? 'border border-gray-600 text-gray-300 hover:bg-[#2a1b3d] focus-visible:ring-gray-400/40 focus-visible:ring-offset-[#141025]'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400/60 focus-visible:ring-offset-white'
                  }`}
                >
                  <X size={16} className="sm:hidden lg:block" />
                  <span>Close</span>
                </button>

                {newInvoice.invoiceId > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({
                        open: true,
                        invoiceId: newInvoice.invoiceId,
                      })
                    }
                    disabled={isPending || isPrinting}
                    className={`h-12 sm:h-10 px-4 sm:px-6 flex items-center justify-center gap-2 rounded-xl sm:rounded-full border cursor-pointer transition-all active:scale-95 transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isDarkMode
                        ? 'border-sky-500/50 text-sky-400 hover:bg-sky-500/10 focus-visible:ring-sky-400/60 focus-visible:ring-offset-[#141025]'
                        : 'border-sky-600 text-sky-600 hover:bg-sky-50 focus-visible:ring-sky-600/60 focus-visible:ring-offset-white'
                    }`}
                  >
                    {isPrinting &&
                    reportModal.invoiceId === newInvoice.invoiceId ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Eye size={16} className="sm:hidden lg:block" />
                    )}
                    <span>Preview</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleAddInvoice(true)}
                disabled={isPending}
                className={`h-12 sm:h-10 px-6 sm:min-w-40 flex items-center justify-center gap-2 rounded-xl sm:rounded-full text-white cursor-pointer transition-all active:scale-95 transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isPending && shouldPreviewFlag
                    ? 'bg-emerald-800 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 ' +
                      (isDarkMode
                        ? 'focus-visible:ring-emerald-400/60 focus-visible:ring-offset-[#141025]'
                        : 'focus-visible:ring-emerald-600/60 focus-visible:ring-offset-white')
                }`}
              >
                {isPending && shouldPreviewFlag ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                <span>Save & Preview</span>
              </button>

              <button
                onClick={() => handleAddInvoice(false)}
                disabled={isPending}
                className={`h-12 sm:h-10 px-8 sm:min-w-37.5 flex items-center justify-center gap-2 rounded-xl sm:rounded-full text-white cursor-pointer transition-all active:scale-95 transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isPending && !shouldPreviewFlag
                    ? 'bg-purple-800 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 ' +
                      (isDarkMode
                        ? 'focus-visible:ring-purple-400/60 focus-visible:ring-offset-[#141025]'
                        : 'focus-visible:ring-purple-600/60 focus-visible:ring-offset-white')
                }`}
              >
                {isPending && !shouldPreviewFlag ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Redo size={18} />
                )}
                <span className="font-bold">Save & Close</span>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      <ValidationErrorsModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        errors={validationErrors}
        isDarkMode={isDarkMode}
      />

      {/* Single Delete Modal */}
      <CustomDeleteModal
        open={confirmModal.open}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bulk Delete Modal */}
      <CustomDeleteModal
        open={bulkDeleteModal}
        loading={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      <SuccessModal
        open={successModalOpen}
        message="Invoice deleted successfully!"
        onClose={() => setSuccessModalOpen(false)}
      />

      {/* Report Selection Modal */}
      <AnimatePresence>
        {reportModal.open && (
          <Motion.div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={() => setReportModal({open: false, invoiceId: null})}
          >
            <Motion.div
              className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
                isDarkMode
                  ? 'bg-[#1B172D] text-white border border-white/10'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              exit={{scale: 0.9, opacity: 0}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Select Print Layout</h3>
                  <p className="text-xs opacity-50 uppercase tracking-widest mt-0.5">
                    Choose layout for invoice preview
                  </p>
                </div>
                <button
                  onClick={() => setReportModal({open: false, invoiceId: null})}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.appProductReportId}
                    onClick={() => setSelectedReport(report)}
                    className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedReport?.appProductReportId ===
                      report.appProductReportId
                        ? 'border-purple-600 bg-purple-600/10 shadow-[0_0_20px_rgba(147,51,234,0.1)]'
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedReport?.appProductReportId ===
                        report.appProductReportId
                          ? 'border-purple-600'
                          : 'border-gray-500'
                      }`}
                    >
                      {selectedReport?.appProductReportId ===
                        report.appProductReportId && (
                        <div className="w-3 h-3 rounded-full bg-purple-600 animate-in fade-in zoom-in duration-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-bold transition-colors ${selectedReport?.appProductReportId === report.appProductReportId ? 'text-purple-400' : 'text-gray-300'}`}
                      >
                        {report.reportTitle}
                      </p>
                      <p className="text-xs opacity-50 font-medium">
                        {report.reportShortName}
                      </p>
                    </div>
                    <FileText
                      size={20}
                      className={`opacity-20 group-hover:opacity-100 transition-opacity ${selectedReport?.appProductReportId === report.appProductReportId ? 'text-purple-600 opacity-100' : ''}`}
                    />
                  </div>
                ))}
                {reports.length === 0 && (
                  <p className="text-center py-4 opacity-50">
                    No report layouts found.
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-black/20 flex gap-3">
                <button
                  onClick={() => setReportModal({open: false, invoiceId: null})}
                  className="flex-1 py-3 font-bold rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    !selectedReport || isPrinting || !reportModal.invoiceId
                  }
                  onClick={() =>
                    printInvoice({
                      invoiceId: reportModal.invoiceId,
                      report: selectedReport,
                    })
                  }
                  className={`
                    flex-2 py-3 font-bold rounded-xl transition-all duration-300
                    flex items-center justify-center gap-2.5 group
                    ${
                      !selectedReport || isPrinting || !reportModal.invoiceId
                        ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-transparent'
                        : 'bg-linear-to-br from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]'
                    }
                  `}
                >
                  {isPrinting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Eye
                      size={18}
                      className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                    />
                  )}
                  <span className="tracking-tight">
                    {isPrinting ? 'Preparing PDF...' : 'Generate Preview'}
                  </span>
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SalesTaxInvoicePage;
