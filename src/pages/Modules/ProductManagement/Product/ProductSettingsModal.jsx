import {useState, useEffect, useMemo} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {motion as Motion, AnimatePresence} from 'framer-motion';
import {
  X,
  Settings,
  Layers,
  RotateCcw,
  Save,
  Loader,
  Check,
  AlertCircle,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {useGetAuth} from '../../../../hooks/useGetAuth';
import {useCloseOnEscape} from '../../../../hooks/useCloseOnEscape';
import {useGetSroScheduleNo} from '../../../../hooks/useGetSroScheduleNo';
import {useGetSroSaleType} from '../../../../hooks/useGetSroSaleType';
import {handleApiResponse} from '../../../../utils/handleApiResponse';
import SelectDropDown from '../../../../components/SelectDropDown';

const ProductSettingsModal = ({isOpen, onClose, product, isDarkMode}) => {
  const queryClient = useQueryClient();
  const {loginAccessToken} = useGetAuth();

  const [activeTab, setActiveTab] = useState('scenario');
  const [scenarios, setScenarios] = useState([]);
  const [initialScenarios, setInitialScenarios] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useCloseOnEscape(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setValidationErrors({});
    } else {
      document.body.style.overflow = '';
      setValidationErrors({});
      setScenarios([]);
      setInitialScenarios([]);
      setSearchTerm('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const {data: sroScheduleNoData = []} = useGetSroScheduleNo({
    enabled: isOpen && !!loginAccessToken,
  });

  const {data: sroSaleTypeData = []} = useGetSroSaleType({
    enabled: isOpen && !!loginAccessToken,
  });

  const sroScheduleNoOptions = useMemo(() => {
    return (sroScheduleNoData || []).map((item) => {
      const val =
        item.criteriaName || item.name || item.criteriaCode || String(item);
      return {
        label: val,
        value: val,
      };
    });
  }, [sroScheduleNoData]);

  const sroSaleTypeOptions = useMemo(() => {
    return (sroSaleTypeData || []).map((item) => {
      const val =
        item.criteriaName || item.name || item.criteriaCode || String(item);
      return {
        label: val,
        value: val,
      };
    });
  }, [sroSaleTypeData]);

  const {
    data: rawScenariosData,
    isLoading: isScenariosLoading,
    refetch: refetchScenarios,
  } = useQuery({
    queryKey: ['productScenarios', product?.productId],
    enabled: isOpen && !!product?.productId && !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch(
        `/api/DI/ProductScenario/GetDetailForScenario?ProductId=${product?.productId}`,
        {
          headers: {
            accept: 'text/plain',
            Authorization: `Bearer ${loginAccessToken}`,
          },
        }
      );
      const result = await handleApiResponse(
        res,
        'Failed to fetch product scenarios'
      );
      return result?.data || [];
    },
    retry: 1,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (rawScenariosData && Array.isArray(rawScenariosData)) {
      const normalized = rawScenariosData.map((item) => {
        const isChecked =
          item.isChecked === true ||
          item.isActive === true ||
          item.isSaved === true ||
          (item.productScenarioId !== null &&
            item.productScenarioId !== undefined &&
            Number(item.productScenarioId) > 0);

        const code = item.criteriaCode || item.scenarioCode;
        const name = item.scenarioName || item.criteriaName || 'Scenario';

        return {
          scenarioId: item.scenarioId || item.appScenarioId || item.id || 0,
          scenarioName: code ? `${code} - ${name}` : name,
          productScenarioId: item.productScenarioId || 0,
          productId: product?.productId || item.productId || 0,
          taxPercent:
            item.taxPercent !== undefined && item.taxPercent !== null
              ? item.taxPercent
              : item.taxPercentage !== undefined && item.taxPercentage !== null
                ? item.taxPercentage
                : item.taxRate !== undefined && item.taxRate !== null
                  ? item.taxRate
                  : 0,
          sroSaleType:
            item.sroSaleType || item.saleType || item.saleTypeName || null,
          sroScheduleNo:
            item.sroScheduleNo ||
            item.scheduleNo ||
            item.scheduleNoName ||
            null,
          sroItemSerialNo:
            item.sroItemSerialNo ||
            item.scheduleSerialNo ||
            item.serialNo ||
            '',
          rowVersionLong: item.rowVersionLong || 0,
          isChecked: isChecked,
        };
      });

      // Sort
      normalized.sort((a, b) => {
        if (a.isChecked === b.isChecked) return 0;
        return a.isChecked ? -1 : 1;
      });

      setScenarios(normalized);
      setInitialScenarios(JSON.parse(JSON.stringify(normalized)));
      setValidationErrors({});
    }
  }, [rawScenariosData, product]);

  const handleFieldChange = (scenarioId, field, value) => {
    setScenarios((prev) =>
      prev.map((item) =>
        item.scenarioId === scenarioId ? {...item, [field]: value} : item
      )
    );

    setValidationErrors((prev) => {
      if (!prev[scenarioId]) return prev;
      const updatedRowErrors = {...prev[scenarioId]};
      delete updatedRowErrors[field];
      if (Object.keys(updatedRowErrors).length === 0) {
        const next = {...prev};
        delete next[scenarioId];
        return next;
      }
      return {...prev, [scenarioId]: updatedRowErrors};
    });
  };

  const handleToggleCheck = (scenarioId) => {
    const targetItem = scenarios.find((s) => s.scenarioId === scenarioId);
    const willBeChecked = !targetItem?.isChecked;

    setScenarios((prev) =>
      prev.map((item) => {
        if (item.scenarioId !== scenarioId) return item;
        if (!willBeChecked) {
          return {
            ...item,
            isChecked: false,
            taxPercent: 0,
            sroSaleType: null,
            sroScheduleNo: null,
            sroItemSerialNo: '',
          };
        } else {
          const initial = initialScenarios.find(
            (init) => init.scenarioId === scenarioId
          );
          return {
            ...item,
            isChecked: true,
            taxPercent:
              initial?.taxPercent !== undefined ? initial.taxPercent : 0,
            sroSaleType: initial?.sroSaleType || null,
            sroScheduleNo: initial?.sroScheduleNo || null,
            sroItemSerialNo: initial?.sroItemSerialNo || '',
          };
        }
      })
    );

    if (!willBeChecked) {
      setValidationErrors((prev) => {
        const next = {...prev};
        delete next[scenarioId];
        return next;
      });
    }
  };

  const filteredScenarios = useMemo(() => {
    if (!searchTerm.trim()) return scenarios;
    const term = searchTerm.toLowerCase().trim();
    return scenarios.filter(
      (item) =>
        item.scenarioName?.toLowerCase().includes(term) ||
        item.scenarioCode?.toLowerCase().includes(term) ||
        item.sroSaleType?.toLowerCase().includes(term) ||
        item.sroScheduleNo?.toLowerCase().includes(term) ||
        item.sroItemSerialNo?.toLowerCase().includes(term)
    );
  }, [scenarios, searchTerm]);

  const hasUnsavedChanges = useMemo(() => {
    if (scenarios.length !== initialScenarios.length) return false;
    return JSON.stringify(scenarios) !== JSON.stringify(initialScenarios);
  }, [scenarios, initialScenarios]);

  const handleReset = () => {
    setScenarios(JSON.parse(JSON.stringify(initialScenarios)));
    setValidationErrors({});
    setSearchTerm('');
    toast.success('Changes reset to original');
  };

  const {mutate: saveAllScenarios, isPending: isSaving} = useMutation({
    mutationFn: async () => {
      const lstRequest = [];
      const lstDeletedRequest = [];

      scenarios.forEach((row, index) => {
        const initialRow = initialScenarios[index];

        if (row.isChecked) {
          lstRequest.push({
            productScenarioId:
              Number(row.productScenarioId || initialRow?.productScenarioId) ||
              0,
            productId: Number(product?.productId),
            scenarioId: Number(row.scenarioId),
            taxPercent: Number(row.taxPercent) || 0,
            sroSaleType: row.sroSaleType ? String(row.sroSaleType).trim() : '',
            sroScheduleNo: row.sroScheduleNo
              ? String(row.sroScheduleNo).trim()
              : '',
            sroItemSerialNo: row.sroItemSerialNo
              ? String(row.sroItemSerialNo).trim()
              : '',
            rowVersionLong:
              Number(row.rowVersionLong || initialRow?.rowVersionLong) || 0,
          });
        } else if (
          initialRow?.productScenarioId &&
          Number(initialRow.productScenarioId) > 0
        ) {
          lstDeletedRequest.push({
            productScenarioId: Number(initialRow.productScenarioId),
            productId: Number(product?.productId),
            scenarioId: Number(initialRow.scenarioId),
            taxPercent: Number(initialRow.taxPercent) || 0,
            sroSaleType: initialRow.sroSaleType
              ? String(initialRow.sroSaleType).trim()
              : '',
            sroScheduleNo: initialRow.sroScheduleNo
              ? String(initialRow.sroScheduleNo).trim()
              : '',
            sroItemSerialNo: initialRow.sroItemSerialNo
              ? String(initialRow.sroItemSerialNo).trim()
              : '',
            rowVersionLong: Number(initialRow.rowVersionLong) || 0,
          });
        }
      });

      const body = {
        lstRequest,
        lstDeletedRequest,
      };

      console.log(
        '=== [ProductScenario SaveAll Payload] ===',
        JSON.stringify(body, null, 2)
      );

      const res = await fetch('/api/DI/ProductScenario/SaveAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(body),
      });

      let result;
      const responseText = await res.text();
      try {
        result = JSON.parse(responseText);
      } catch {
        result = {message: responseText};
      }

      if (
        !res.ok ||
        (result?.statusCode &&
          result.statusCode !== 200 &&
          result.statusCode !== 201)
      ) {
        let errorMsg = 'Failed to save product scenarios';
        if (result?.errors) {
          if (typeof result.errors === 'object') {
            const errList = Object.values(result.errors).flat().filter(Boolean);
            errorMsg =
              errList.join(' | ') || result.title || result.message || errorMsg;
          } else if (typeof result.errors === 'string') {
            errorMsg = result.errors;
          }
        } else if (result?.message) {
          errorMsg = result.message;
        } else if (result?.detail) {
          errorMsg = result.detail;
        } else if (result?.title) {
          errorMsg = result.title;
        } else if (
          typeof responseText === 'string' &&
          responseText.trim().length > 0 &&
          responseText.length < 300
        ) {
          errorMsg = responseText;
        }
        throw new Error(errorMsg);
      }

      return result;
    },
    onSuccess: (result) => {
      toast.success(result?.message || 'Product scenarios saved successfully!');
      setValidationErrors({});
      queryClient.invalidateQueries({queryKey: ['productScenarios']});
      queryClient.invalidateQueries({queryKey: ['products']});
      queryClient.invalidateQueries({queryKey: ['allProductScenarios']});
      onClose();
    },
    onError: (err) => {
      toast.error(err?.message || 'Error saving product scenarios');
    },
  });

  const handleSave = () => {
    const errors = {};
    let hasError = false;
    let firstErrorMessage = '';

    scenarios.forEach((row, index) => {
      if (row.isChecked) {
        const rowErrors = {};
        const key = row.scenarioId || index;

        // const taxVal = Number(row.taxPercent);
        // if (
        //   row.taxPercent === '' ||
        //   row.taxPercent === null ||
        //   row.taxPercent === undefined ||
        //   isNaN(taxVal) ||
        //   taxVal <= 0
        // ) {
        //   rowErrors.taxPercent = 'Tax % must be greater than 0';
        //   if (!firstErrorMessage)
        //     firstErrorMessage = `Tax % must be greater than 0 for "${row.scenarioName}"`;
        //   hasError = true;
        // }

        if (!row.sroSaleType || !String(row.sroSaleType).trim()) {
          rowErrors.sroSaleType = 'Sale Type is required';
          if (!firstErrorMessage)
            firstErrorMessage = `Please select Sale Type for "${row.scenarioName}"`;
          hasError = true;
        }

        if (!row.sroScheduleNo || !String(row.sroScheduleNo).trim()) {
          rowErrors.sroScheduleNo = 'Schedule No is required';
          if (!firstErrorMessage)
            firstErrorMessage = `Please select Schedule No for "${row.scenarioName}"`;
          hasError = true;
        }

        if (!row.sroItemSerialNo || !String(row.sroItemSerialNo).trim()) {
          rowErrors.sroItemSerialNo = 'Schedule Serial # is required';
          if (!firstErrorMessage)
            firstErrorMessage = `Please enter Schedule Serial # for "${row.scenarioName}"`;
          hasError = true;
        }

        if (Object.keys(rowErrors).length > 0) {
          errors[key] = rowErrors;
        }
      }
    });

    if (hasError) {
      setValidationErrors(errors);
      toast.error(
        firstErrorMessage ||
          'Please fill all required fields for checked scenarios'
      );
      return;
    }

    setValidationErrors({});
    saveAllScenarios();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        className={`fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm ${
          isDarkMode ? 'bg-black/60' : 'bg-gray-900/40'
        }`}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
      >
        <Motion.div
          className={`relative w-full max-w-7xl xl:max-w-[1400px] h-[92vh] max-h-[880px] mx-2 sm:mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border ${
            isDarkMode
              ? 'bg-[#1B172D] text-white border-white/10'
              : 'bg-white text-gray-800 border-gray-200'
          }`}
          initial={{y: 30, opacity: 0, scale: 0.96}}
          animate={{y: 0, opacity: 1, scale: 1}}
          exit={{y: 30, opacity: 0, scale: 0.96}}
          transition={{type: 'spring', stiffness: 300, damping: 28}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── LEFT SIDEBAR ── */}
          <div
            className={`hidden md:flex md:w-56 p-4 flex-col justify-between border-r shrink-0 ${
              isDarkMode
                ? 'border-white/5 bg-black/20'
                : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div>
              {/* Header inside Sidebar */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode
                      ? 'hover:bg-white/5 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Close"
                >
                  <X size={20} />
                </button>
                <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center">
                  <Settings
                    size={18}
                    className="text-purple-600 animate-[spin_10s_linear_infinite]"
                  />
                </div>
              </div>

              <div className="px-2 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Settings
                </h2>
              </div>

              {/* Navigation Tab */}
              <button
                onClick={() => setActiveTab('scenario')}
                className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left ${
                  activeTab === 'scenario'
                    ? isDarkMode
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 font-bold'
                      : 'bg-white text-purple-600 shadow-sm border border-gray-100 font-bold'
                    : isDarkMode
                      ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      : 'text-gray-600 hover:bg-white'
                }`}
              >
                <Layers
                  size={18}
                  className={
                    activeTab === 'scenario' ? 'text-current' : 'opacity-60'
                  }
                />
                <span className="text-sm">Scenario</span>
              </button>
            </div>

            {/* Bottom Managing Product Info */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isDarkMode
                  ? 'bg-purple-600/10 border-purple-500/20 text-purple-200'
                  : 'bg-purple-50 border-purple-100 text-purple-900'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                Managing
              </p>
              <p className="text-sm font-black truncate text-purple-600 dark:text-purple-400">
                {product?.productName || 'Product'}
              </p>
              {product?.productCode && (
                <p className="text-xs opacity-60 font-mono mt-0.5">
                  {product.productCode}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div
              className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b shrink-0 ${
                isDarkMode
                  ? 'border-white/5 bg-white/2'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-bold truncate">
                    Scenario
                  </h2>
                  {product?.productName && (
                    <span
                      className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md truncate max-w-[150px] sm:max-w-xs ${
                        isDarkMode
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20'
                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}
                    >
                      {product.productName}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] sm:text-xs mt-0.5 truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Configure tax rates, sale types, and schedule numbers for this
                  product
                </p>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X size={18} className="sm:hidden" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Scenario List</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      isDarkMode
                        ? 'bg-purple-900/40 text-purple-300'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {scenarios.filter((s) => s.isChecked).length} of{' '}
                    {scenarios.length} active
                  </span>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search
                    size={14}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                      isDarkMode ? 'text-purple-400' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search Scenarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-full border outline-none transition-all shadow-xs ${
                      isDarkMode
                        ? 'bg-[#141025] border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30'
                    }`}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {isScenariosLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader className="w-8 h-8 animate-spin text-purple-600" />
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Loading product scenarios...
                  </p>
                </div>
              ) : scenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-50">
                  <AlertCircle size={36} />
                  <p className="text-sm font-medium">
                    No scenarios found for this product.
                  </p>
                </div>
              ) : filteredScenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-70">
                  <Search size={32} className="text-purple-500" />
                  <p className="text-sm font-medium">
                    No scenarios found matching "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-purple-500 hover:underline font-semibold"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div>
                  <div className="block lg:hidden space-y-2">
                    {filteredScenarios.map((row) => {
                      const isRowChecked = Boolean(row.isChecked);
                      const rowError = validationErrors[row.scenarioId] || {};

                      return (
                        <div
                          key={row.scenarioId}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                            isRowChecked
                              ? isDarkMode
                                ? 'bg-[#141026] border-purple-500/30 shadow-xs'
                                : 'bg-white border-purple-200/80 shadow-xs'
                              : isDarkMode
                                ? 'bg-[#110e20]/40 border-white/5 opacity-55 hover:opacity-85'
                                : 'bg-white/60 border-gray-100 opacity-55 hover:opacity-85'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleCheck(row.scenarioId)}
                            className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                              isRowChecked
                                ? isDarkMode
                                  ? 'bg-purple-500/5'
                                  : 'bg-purple-50/30'
                                : 'hover:bg-white/2'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isRowChecked
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                    : isDarkMode
                                      ? 'border-gray-600 bg-black/20'
                                      : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isRowChecked && (
                                  <Check size={11} strokeWidth={3} />
                                )}
                              </div>
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isRowChecked
                                    ? isDarkMode
                                      ? 'text-white'
                                      : 'text-gray-900'
                                    : isDarkMode
                                      ? 'text-gray-400'
                                      : 'text-gray-500'
                                }`}
                              >
                                {row.scenarioName}
                              </span>
                            </div>

                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isRowChecked
                                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                                  : isDarkMode
                                    ? 'bg-white/5 text-gray-500'
                                    : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isRowChecked
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-gray-400'
                                }`}
                              />
                              {isRowChecked ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {isRowChecked && (
                            <div className="p-2.5 pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                                    rowError.taxPercent
                                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                                      : isDarkMode
                                        ? 'bg-[#0c0919] border-white/10 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/20'
                                        : 'bg-gray-50/70 border-gray-200 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600/10'
                                  }`}
                                >
                                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    Tax:
                                  </span>
                                  <input
                                    type="number"
                                    min="0.01"
                                    max="100"
                                    step="0.01"
                                    placeholder="18"
                                    value={
                                      row.taxPercent !== undefined &&
                                      row.taxPercent !== null
                                        ? row.taxPercent
                                        : ''
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'taxPercent',
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-transparent text-xs font-semibold text-gray-900 dark:text-white outline-none placeholder-gray-500"
                                  />
                                  <span className="text-[11px] font-bold text-purple-500">
                                    %
                                  </span>
                                </div>

                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                                    rowError.sroItemSerialNo
                                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                                      : isDarkMode
                                        ? 'bg-[#0c0919] border-white/10 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/20'
                                        : 'bg-gray-50/70 border-gray-200 focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600/10'
                                  }`}
                                >
                                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    Serial:
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="SR-1024"
                                    value={row.sroItemSerialNo || ''}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'sroItemSerialNo',
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-transparent text-xs text-gray-900 dark:text-white outline-none placeholder-gray-500 font-mono"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div
                                  className={
                                    rowError.sroSaleType
                                      ? 'rounded-xl ring-1 ring-red-500 p-0.5'
                                      : ''
                                  }
                                >
                                  <SelectDropDown
                                    value={row.sroSaleType}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'sroSaleType',
                                        val
                                      )
                                    }
                                    options={sroSaleTypeOptions}
                                    placeholder="Sale Type"
                                    allowClear={true}
                                    className="text-xs min-h-[32px] h-[32px]"
                                  />
                                </div>

                                <div
                                  className={
                                    rowError.sroScheduleNo
                                      ? 'rounded-xl ring-1 ring-red-500 p-0.5'
                                      : ''
                                  }
                                >
                                  <SelectDropDown
                                    value={row.sroScheduleNo}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'sroScheduleNo',
                                        val
                                      )
                                    }
                                    options={sroScheduleNoOptions}
                                    placeholder="Schedule No"
                                    allowClear={true}
                                    className="text-xs min-h-[32px] h-[32px]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* --- Desktop Table View (hidden lg:block) --- */}
                  <div
                    className={`hidden lg:block rounded-xl border overflow-x-auto custom-scrollbar ${
                      isDarkMode
                        ? 'border-white/10 bg-black/10'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <table className="w-full min-w-[720px] text-left text-sm border-collapse">
                      <thead>
                        <tr
                          className={`border-b text-xs font-bold uppercase tracking-wider ${
                            isDarkMode
                              ? 'bg-white/5 border-white/10 text-gray-400'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <th className="py-2.5 px-2 w-9 text-center shrink-0">
                            <span className="sr-only">Select</span>
                          </th>
                          <th className="py-2.5 px-2.5 min-w-[130px]">
                            Scenario Name
                          </th>
                          <th className="py-2.5 px-2 w-20 xl:w-24 text-center whitespace-nowrap">
                            Tax %{' '}
                            {/* <span className="text-red-500 font-bold">*</span> */}
                          </th>
                          <th className="py-2.5 px-2 w-40 xl:w-48 whitespace-nowrap">
                            Sale Type{' '}
                            <span className="text-red-500 font-bold">*</span>
                          </th>
                          <th className="py-2.5 px-2 w-40 xl:w-48 whitespace-nowrap">
                            Schedule No{' '}
                            <span className="text-red-500 font-bold">*</span>
                          </th>
                          <th className="py-2.5 px-2 w-32 xl:w-40 whitespace-nowrap">
                            Schedule Serial #{' '}
                            <span className="text-red-500 font-bold">*</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredScenarios.map((row) => {
                          const isRowChecked = Boolean(row.isChecked);
                          const rowError =
                            validationErrors[row.scenarioId] || {};

                          return (
                            <tr
                              key={row.scenarioId}
                              className={`transition-colors duration-150 ${
                                isRowChecked
                                  ? isDarkMode
                                    ? 'bg-purple-600/5 hover:bg-purple-600/10'
                                    : 'bg-purple-50/40 hover:bg-purple-50/70'
                                  : isDarkMode
                                    ? 'opacity-60 hover:opacity-90 hover:bg-white/2'
                                    : 'opacity-60 hover:opacity-90 hover:bg-gray-50/50'
                              }`}
                            >
                              {/* Checkbox Column */}
                              <td className="py-2 px-2 text-center shrink-0">
                                <label className="relative flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isRowChecked}
                                    onChange={() =>
                                      handleToggleCheck(row.scenarioId)
                                    }
                                    className="sr-only peer"
                                  />
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                      isRowChecked
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                        : isDarkMode
                                          ? 'border-gray-600 bg-black/20 hover:border-purple-400'
                                          : 'border-gray-300 bg-white hover:border-purple-500'
                                    }`}
                                  >
                                    {isRowChecked && (
                                      <Check size={12} strokeWidth={3} />
                                    )}
                                  </div>
                                </label>
                              </td>

                              <td className="py-2 px-2.5 font-semibold text-xs xl:text-sm">
                                <span
                                  className={
                                    isRowChecked
                                      ? isDarkMode
                                        ? 'text-white'
                                        : 'text-gray-900'
                                      : 'text-gray-500'
                                  }
                                >
                                  {row.scenarioName}
                                </span>
                              </td>

                              <td className="py-2 px-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  max="100"
                                  step="0.01"
                                  placeholder="e.g. 18"
                                  value={
                                    row.taxPercent !== undefined &&
                                    row.taxPercent !== null
                                      ? row.taxPercent
                                      : ''
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      row.scenarioId,
                                      'taxPercent',
                                      e.target.value
                                    )
                                  }
                                  disabled={!isRowChecked}
                                  className={`w-full text-center px-2 py-1 rounded-lg border text-xs font-semibold min-h-[34px] transition-all outline-none ${
                                    !isRowChecked
                                      ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent'
                                      : rowError.taxPercent
                                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                                        : isDarkMode
                                          ? 'bg-[#141025] border-[#2a2738] focus:border-purple-500 text-white'
                                          : 'bg-white border-gray-300 focus:border-purple-600 text-gray-900 shadow-xs'
                                  }`}
                                />
                              </td>

                              <td className="py-2 px-1.5">
                                <div
                                  className={
                                    !isRowChecked
                                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                                      : rowError.sroSaleType
                                        ? 'rounded-xl ring-1 ring-red-500 p-0.5'
                                        : ''
                                  }
                                >
                                  <SelectDropDown
                                    value={row.sroSaleType}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'sroSaleType',
                                        val
                                      )
                                    }
                                    options={sroSaleTypeOptions}
                                    placeholder="Select Sale Type"
                                    disabled={!isRowChecked}
                                    allowClear={true}
                                    className="text-xs min-h-[34px]"
                                  />
                                </div>
                              </td>

                              {/* Schedule No Dropdown */}
                              <td className="py-2 px-1.5">
                                <div
                                  className={
                                    !isRowChecked
                                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                                      : rowError.sroScheduleNo
                                        ? 'rounded-xl ring-1 ring-red-500 p-0.5'
                                        : ''
                                  }
                                >
                                  <SelectDropDown
                                    value={row.sroScheduleNo}
                                    onChange={(val) =>
                                      handleFieldChange(
                                        row.scenarioId,
                                        'sroScheduleNo',
                                        val
                                      )
                                    }
                                    options={sroScheduleNoOptions}
                                    placeholder="Select Schedule"
                                    disabled={!isRowChecked}
                                    allowClear={true}
                                    className="text-xs min-h-[34px]"
                                  />
                                </div>
                              </td>

                              <td className="py-2 px-1.5">
                                <input
                                  type="text"
                                  value={row.sroItemSerialNo || ''}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      row.scenarioId,
                                      'sroItemSerialNo',
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. SR-1024"
                                  disabled={!isRowChecked}
                                  className={`w-full px-2.5 py-1 rounded-lg border text-xs min-h-[34px] transition-all outline-none font-mono ${
                                    !isRowChecked
                                      ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent'
                                      : rowError.sroItemSerialNo
                                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10'
                                        : isDarkMode
                                          ? 'bg-[#141025] border-[#2a2738] focus:border-purple-500 text-white'
                                          : 'bg-white border-gray-300 focus:border-purple-600 text-gray-900 shadow-xs'
                                  }`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`px-3 sm:px-6 py-2.5 sm:py-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
                isDarkMode
                  ? 'border-white/5 bg-black/20'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium min-w-0">
                <span
                  className={`hidden sm:inline ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {scenarios.length} scenarios
                </span>
                <span className="hidden sm:inline opacity-30">•</span>
                {hasUnsavedChanges ? (
                  <span className="text-amber-500 font-semibold flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="truncate">Unsaved changes</span>
                  </span>
                ) : (
                  <span className="text-emerald-500 font-medium flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">All changes saved</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    !hasUnsavedChanges || isSaving
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs'
                  }`}
                >
                  <RotateCcw size={13} className="shrink-0" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 flex items-center gap-1.5 shadow-md ${
                    isSaving || !hasUnsavedChanges
                      ? 'opacity-50 cursor-not-allowed bg-purple-600/50'
                      : 'bg-purple-600 hover:bg-purple-500 active:scale-98 shadow-purple-500/25 hover:shadow-purple-500/40'
                  }`}
                >
                  {isSaving ? (
                    <Loader size={14} className="animate-spin shrink-0" />
                  ) : (
                    <Save size={14} className="shrink-0" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default ProductSettingsModal;
