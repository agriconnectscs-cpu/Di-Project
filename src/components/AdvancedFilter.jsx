import dayjs from 'dayjs';
import {DatePicker} from 'antd';
import {useGetAuth} from '../hooks/useGetAuth';
import {useQuery} from '@tanstack/react-query';
import {useState, useCallback, useMemo} from 'react';
import {motion as Motion, AnimatePresence} from 'framer-motion';
import {
  Plus,
  X,
  Trash2,
  Sparkles,
  RotateCcw,
  Check,
  Calendar,
  Redo,
} from 'lucide-react';

import {useTheme} from '../ThemeProvider';

import CustomInput from './CustomInput';
import SelectDropDown from './SelectDropDown';
import CustomButton from './common/CustomButton';
// Imports End-----

const NO_VALUE_OPERATORS = new Set(['Is Empty', 'Is Not Empty']);

const CONDITIONS = [
  {label: 'AND', value: 'AND'},
  {label: 'OR', value: 'OR'},
];

const createEmptyRow = (condition = 'AND') => ({
  id: Date.now() + Math.random(),
  field: null,
  operator: null,
  value: '',
  value2: '',
  condition,
});

const rowToPreview = (row) => {
  if (!row.field || !row.operator) return null;
  if (row.operator === 'Between') {
    return `${row.field} ${row.operator} ${row.value || '?'} and ${row.value2 || '?'}`;
  }
  return `${row.field} ${row.operator} ${row.value || '?'}`;
};

const AdvancedFilter = ({
  onApply,
  onClose,
  inline = false,
  initialRows = null,
  dateFilters = null,
  setDateFilters = null,
  getAcademicYearDates = null,
}) => {
  const {isDarkMode} = useTheme();
  const {loginAccessToken} = useGetAuth();

  // Fetch filter configuration (fields, types, operators) from API
  const {data: filterConfig, isLoading: configLoading} = useQuery({
    queryKey: ['digitalInvoiceFilters', loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch('/api/DBO/DataFilter/GetDigitalInvoiceFilters', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${loginAccessToken}`,
          Accept: 'text/plain',
        },
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const result = await res.json();
      if (!result?.data) throw new Error(result?.message || 'No data found');
      return result.data;
    },

    select: (data) => ({
      fields: data.map((item) => ({
        label: item.label,
        value: item.field,
        type: item.type,
        operators: item.operators,
      })),
    }),
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const fieldOptions = useMemo(
    () => filterConfig?.fields || [],
    [filterConfig]
  );

  const getOperatorsForField = useCallback(
    (fieldValue) => {
      const field = fieldOptions.find((f) => f.value === fieldValue);
      const ops = field?.operators || [];
      return ops.map((op) => ({label: op, value: op}));
    },
    [fieldOptions]
  );

  const getFieldType = useCallback(
    (fieldValue) => {
      return fieldOptions.find((f) => f.value === fieldValue)?.type || 'string';
    },
    [fieldOptions]
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [rows, setRows] = useState(
    initialRows && initialRows.length > 0
      ? initialRows
      : [createEmptyRow('AND')]
  );

  const updateRow = useCallback((id, updates) => {
    setRows((prev) => prev.map((r) => (r.id === id ? {...r, ...updates} : r)));
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow('AND')]);
  }, []);

  const clearAll = useCallback(() => {
    setRows([createEmptyRow('AND')]);
  }, []);

  const handleApply = useCallback(() => {
    const validRows = rows
      .filter(
        (r) =>
          r.field &&
          r.operator &&
          (r.value || NO_VALUE_OPERATORS.has(r.operator))
      )
      .map((r) => {
        const noVal = NO_VALUE_OPERATORS.has(r.operator);
        const val = noVal ? '' : r.value;
        const fieldConfig = fieldOptions.find((f) => f.value === r.field);
        return {
          field: r.field,
          operator: r.operator,
          type: fieldConfig?.type || 'string',
          value: val,
          value1: r.operator === 'Between' ? r.value || '' : val,
          value2: r.operator === 'Between' ? r.value2 || '' : val,
          condition: r.condition || 'AND',
        };
      });
    if (onApply) onApply(validRows, rows);
  }, [rows, onApply, fieldOptions]);

  const previewItems = rows.map(rowToPreview).filter(Boolean);

  const content = (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4`}>
        <h2
          className={`flex items-center gap-2 text-lg font-semibold ${
            isDarkMode ? 'text-(--secondary-color)' : 'text-(--secondary-color)'
          }`}
        >
          <Sparkles size={20} />
          Filters
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div
        className={`flex border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        } px-6`}
      >
        {dateFilters && setDateFilters && getAcademicYearDates && (
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'basic'
                ? isDarkMode
                  ? 'border-(--secondary-color) text-(--secondary-color)'
                  : 'border-(--secondary-color) text-(--secondary-color)'
                : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-200'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Basic Filter
          </button>
        )}
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'advanced'
              ? isDarkMode
                ? 'border-(--secondary-color) text-(--secondary-color)'
                : 'border-(--secondary-color) text-(--secondary-color)'
              : isDarkMode
                ? 'border-transparent text-gray-400 hover:text-gray-200'
                : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Advanced Filter
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-6">
        {activeTab === 'advanced' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Manual Filter
              </p>
              <div className="flex items-center gap-2">
                <CustomButton onClick={addRow} icon={Redo} title="Add Filter" />
                <CustomButton
                  onClick={clearAll}
                  icon={RotateCcw}
                  title="Clear All"
                />
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex flex-wrap items-end gap-2 p-3 rounded-xl border ${
                    isDarkMode
                      ? 'bg-[#141025] border-white/10'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {index > 0 && (
                    <div className="w-22.5 shrink-0">
                      <SelectDropDown
                        id={`condition-${row.id}`}
                        label="Cond."
                        value={row.condition}
                        options={CONDITIONS}
                        onChange={(val) => updateRow(row.id, {condition: val})}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-35">
                    <SelectDropDown
                      label="Field"
                      value={row.field}
                      options={fieldOptions}
                      loading={configLoading}
                      placeholder="Select Field"
                      disabled={!fieldOptions.length}
                      onChange={(val) =>
                        updateRow(row.id, {
                          field: val,
                          operator: null,
                          value: '',
                          value2: '',
                        })
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-30">
                    <SelectDropDown
                      label="Operator"
                      value={row.operator}
                      options={getOperatorsForField(row.field)}
                      loading={configLoading}
                      disabled={!row.field}
                      placeholder="Operator"
                      onChange={(val) =>
                        updateRow(row.id, {
                          operator: val,
                          value: '',
                          value2: '',
                        })
                      }
                    />
                  </div>

                  {NO_VALUE_OPERATORS.has(row.operator) ? (
                    <div className="flex-1 min-w-30" />
                  ) : row.operator === 'Between' &&
                    getFieldType(row.field) === 'date' ? (
                    <>
                      <div className="flex-1 min-w-35 relative mt-1.5">
                        <span
                          className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                            isDarkMode
                              ? 'bg-[#141025] text-gray-400'
                              : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          From
                        </span>
                        <DatePicker
                          className={`w-full py-2 pl-3 pr-2 rounded-md border shadow-sm text-sm focus:outline-none transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-black/10 border-gray-700 text-white placeholder-gray-400 hover:border-gray-500 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)]'
                              : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-600 hover:border-gray-400 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_20%,transparent)]'
                          }`}
                          value={row.value ? dayjs(row.value) : null}
                          onChange={(date) =>
                            updateRow(row.id, {
                              value: date ? date.format('YYYY-MM-DD') : '',
                            })
                          }
                          format="DD MMM, YYYY"
                          placement="bottomLeft"
                          suffixIcon={
                            <Calendar size={14} className="opacity-50" />
                          }
                          popupStyle={{zIndex: 1050}}
                        />
                      </div>
                      <div className="flex-1 min-w-35 relative mt-1.5">
                        <span
                          className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                            isDarkMode
                              ? 'bg-[#141025] text-gray-400'
                              : 'bg-gray-50 text-gray-500'
                          }`}
                        >
                          To
                        </span>
                        <DatePicker
                          className={`w-full py-2 pl-3 pr-2 rounded-md border shadow-sm text-sm focus:outline-none transition-all duration-300 ${
                            isDarkMode
                              ? 'bg-black/10 border-gray-700 text-white placeholder-gray-400 hover:border-gray-500 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)]'
                              : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-600 hover:border-gray-400 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_20%,transparent)]'
                          }`}
                          value={row.value2 ? dayjs(row.value2) : null}
                          onChange={(date) =>
                            updateRow(row.id, {
                              value2: date ? date.format('YYYY-MM-DD') : '',
                            })
                          }
                          format="DD MMM, YYYY"
                          placement="bottomLeft"
                          suffixIcon={
                            <Calendar size={14} className="opacity-50" />
                          }
                          popupStyle={{zIndex: 1050}}
                        />
                      </div>
                    </>
                  ) : row.operator === 'Between' ? (
                    <>
                      <div className="flex-1 min-w-25">
                        <CustomInput
                          label="From"
                          type="number"
                          value={row.value}
                          onChange={(e) =>
                            updateRow(row.id, {value: e.target.value})
                          }
                          placeholder="Min"
                          disabled={!row.operator}
                        />
                      </div>
                      <div className="flex-1 min-w-25">
                        <CustomInput
                          label="To"
                          type="number"
                          value={row.value2}
                          onChange={(e) =>
                            updateRow(row.id, {value2: e.target.value})
                          }
                          placeholder="Max"
                          disabled={!row.operator}
                        />
                      </div>
                    </>
                  ) : getFieldType(row.field) === 'date' ? (
                    <div className="flex-1 min-w-35 relative mt-1.5">
                      <span
                        className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                          isDarkMode
                            ? 'bg-[#141025] text-gray-400'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        Date
                      </span>
                      <DatePicker
                        className={`w-full py-2 pl-3 pr-2 rounded-md border shadow-sm text-sm focus:outline-none transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-black/10 border-gray-700 text-white placeholder-gray-400 hover:border-gray-500 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)]'
                            : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-600 hover:border-gray-400 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_20%,transparent)]'
                        }`}
                        value={row.value ? dayjs(row.value) : null}
                        onChange={(date) =>
                          updateRow(row.id, {
                            value: date ? date.format('YYYY-MM-DD') : '',
                          })
                        }
                        format="DD MMM, YYYY"
                        placement="bottomLeft"
                        suffixIcon={
                          <Calendar size={14} className="opacity-50" />
                        }
                        popupStyle={{zIndex: 1050}}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-30">
                      <CustomInput
                        label="Value"
                        value={row.value}
                        onChange={(e) =>
                          updateRow(row.id, {value: e.target.value})
                        }
                        placeholder="Enter value"
                        disabled={!row.operator}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Filter- Date Range */}
        {activeTab === 'basic' &&
          dateFilters &&
          setDateFilters &&
          getAcademicYearDates && (
            <div
              className={`p-4 rounded-xl border ${
                isDarkMode
                  ? 'bg-[#141025] border-white/10'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Date Range Filter
                </p>
                <CustomButton
                  onClick={() => setDateFilters(getAcademicYearDates())}
                  icon={RotateCcw}
                  title="Clear"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full relative mt-1.5">
                  <span
                    className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                      isDarkMode
                        ? 'bg-[#141025] text-gray-400'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    From Date
                  </span>

                  <DatePicker
                    className={`w-full py-2 pl-3 pr-2 rounded-md border shadow-sm text-sm focus:outline-none transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-black/10 border-gray-700 text-white placeholder-gray-400 hover:border-gray-500 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)]'
                        : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-600 hover:border-gray-400 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_20%,transparent)]'
                    }`}
                    value={dayjs(dateFilters.FromDate)}
                    onChange={(date) =>
                      setDateFilters((prev) => ({
                        ...prev,
                        FromDate: date
                          ? date.format('YYYY-MM-DD')
                          : getAcademicYearDates().FromDate,
                      }))
                    }
                    format="DD MMM, YYYY"
                    allowClear={false}
                    placement="bottomLeft"
                    suffixIcon={<Calendar size={14} className="opacity-50" />}
                    popupStyle={{zIndex: 1050}}
                  />
                </div>

                <div
                  className={`hidden sm:flex items-center px-2 pb-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-300'
                  }`}
                >
                  →
                </div>

                <div className="flex-1 w-full relative mt-1.5">
                  <span
                    className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                      isDarkMode
                        ? 'bg-[#141025] text-gray-400'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    To Date
                  </span>

                  <DatePicker
                    className={`w-full py-2 pl-3 pr-2 rounded-md border shadow-sm text-sm focus:outline-none transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-black/10 border-gray-700 text-white placeholder-gray-400 hover:border-gray-500 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)]'
                        : 'bg-gray-100/50 border-gray-300 text-gray-900 placeholder-gray-600 hover:border-gray-400 focus:border-(--secondary-color) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--secondary-color)_20%,transparent)]'
                    }`}
                    value={dayjs(dateFilters.ToDate)}
                    onChange={(date) =>
                      setDateFilters((prev) => ({
                        ...prev,
                        ToDate: date
                          ? date.format('YYYY-MM-DD')
                          : getAcademicYearDates().ToDate,
                      }))
                    }
                    format="DD MMM, YYYY"
                    allowClear={false}
                    placement="bottomLeft"
                    suffixIcon={<Calendar size={14} className="opacity-50" />}
                    popupStyle={{zIndex: 1050}}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={() =>
                    setDateFilters({
                      FromDate: dayjs().format('YYYY-MM-DD'),
                      ToDate: dayjs().format('YYYY-MM-DD'),
                    })
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isDarkMode
                      ? 'bg-white/5 text-gray-300 hover:bg-(--secondary-color) hover:text-white border border-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-(--secondary-color) hover:text-white border border-gray-200'
                  }`}
                >
                  Today
                </button>

                <button
                  onClick={() =>
                    setDateFilters({
                      FromDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
                      ToDate: dayjs().format('YYYY-MM-DD'),
                    })
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isDarkMode
                      ? 'bg-white/5 text-gray-300 hover:bg-(--secondary-color) hover:text-white border border-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-(--secondary-color) hover:text-white border border-gray-200'
                  }`}
                >
                  Last Week
                </button>

                <button
                  onClick={() =>
                    setDateFilters({
                      FromDate: dayjs()
                        .subtract(1, 'month')
                        .format('YYYY-MM-DD'),
                      ToDate: dayjs().format('YYYY-MM-DD'),
                    })
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isDarkMode
                      ? 'bg-white/5 text-gray-300 hover:bg-(--secondary-color) hover:text-white border border-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-(--secondary-color) hover:text-white border border-gray-200'
                  }`}
                >
                  Last Month
                </button>

                <button
                  onClick={() =>
                    setDateFilters({
                      FromDate: dayjs()
                        .subtract(1, 'year')
                        .format('YYYY-MM-DD'),
                      ToDate: dayjs().format('YYYY-MM-DD'),
                    })
                  }
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isDarkMode
                      ? 'bg-white/5 text-gray-300 hover:bg-(--secondary-color) hover:text-white border border-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-(--secondary-color) hover:text-white border border-gray-200'
                  }`}
                >
                  Last Year
                </button>
              </div>
            </div>
          )}

        {/* Preview Section */}
        {activeTab === 'advanced' && previewItems.length > 0 && (
          <div
            className={`p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-[#141025] border-white/10'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p
              className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Filter Preview
            </p>
            <div
              className={`p-3 rounded-lg font-mono text-xs leading-relaxed ${
                isDarkMode
                  ? 'bg-[#1A162B] text-gray-300'
                  : 'bg-white text-gray-600'
              }`}
            >
              {previewItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-(--secondary-color)">{item}</span>
                  {i < previewItems.length - 1 && (
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {rows[i + 1]?.condition || 'AND'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-end gap-3 px-6 py-4`}>
        <CustomButton onClick={onClose} title="Cancel" />
        <CustomButton
          onClick={handleApply}
          icon={Check}
          title="Apply Filters"
        />
      </div>
    </>
  );

  if (inline) {
    return (
      <div
        className={`rounded-xl shadow-2xl border ${
          isDarkMode
            ? 'bg-[#1A162B] text-white border-white/10'
            : 'bg-white text-gray-800 border-gray-200'
        }`}
      >
        {content}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <Motion.div
        className={`fixed inset-0 z-1000 flex items-center justify-center backdrop-blur-sm ${
          isDarkMode ? 'bg-black/50' : 'bg-black/20'
        }`}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        onClick={onClose}
      >
        <Motion.div
          className={`relative w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border ${
            isDarkMode
              ? 'bg-[#1A162B] text-white border-white/10'
              : 'bg-white text-gray-800 border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
          initial={{opacity: 0, scale: 0.95, y: 20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.95, y: 20}}
          transition={{duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94]}}
        >
          {content}
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default AdvancedFilter;
