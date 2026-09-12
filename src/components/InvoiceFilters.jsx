import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar, RotateCcw } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../ThemeProvider";

const InvoiceFilters = ({
  showFilters,
  dateFilters,
  setDateFilters,
  getAcademicYearDates,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <AnimatePresence>
      {showFilters && (
        <Motion.div
          initial={{ height: 0, opacity: 0, y: -5 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -5 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          style={{ position: "relative", zIndex: 5 }}
        >
          <div
            className={`p-4 mt-1 rounded-xl border transition-all duration-500 ${
              isDarkMode
                ? "bg-[#1A162B] border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5"
                : "bg-white border-purple-100 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Info Section */}
              <div
                className={`flex items-center gap-3 pr-6 lg:border-r ${
                  isDarkMode ? "border-white/10" : "border-gray-200"
                } min-w-fit`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shadow-inner">
                  <Calendar size={18} className="text-purple-500" />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
D                    Month Range
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isDarkMode ? "text-purple-400/90" : "text-purple-800"
                    }`}
                  >
                    {dayjs().format("MMMM YYYY")}
                  </span>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="flex flex-1 items-center gap-4">
                <div className="flex-1 min-w-35 relative mt-1.5">
                  <span
                    className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                      isDarkMode
                        ? "bg-[#1A162B] text-gray-400"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    From Date
                  </span>
                  <DatePicker
                    className={`w-full h-11 px-4 rounded-xl border-2 hover:border-purple-400 focus:border-purple-500 transition-all ${
                      isDarkMode
                        ? "bg-white/5 border-white/5 text-white hover:bg-white/10"
                        : "bg-transparent border-gray-100 text-gray-800 hover:bg-gray-50/30"
                    }`}
                    value={dayjs(dateFilters.FromDate)}
                    onChange={(date) =>
                      setDateFilters((prev) => ({
                        ...prev,
                        FromDate: date
                          ? date.format("YYYY-MM-DD")
                          : getAcademicYearDates().FromDate,
                      }))
                    }
                    format="DD MMM, YYYY"
                    allowClear={false}
                    placement="bottomLeft"
                    suffixIcon={<Calendar size={14} className="opacity-50" />}
                    popupStyle={{ zIndex: 1050 }}
                  />
                </div>

                <div
                  className={
                    isDarkMode
                      ? "hidden sm:block text-gray-600"
                      : "hidden sm:block text-gray-300"
                  }
                >
                  →
                </div>

                <div className="flex-1 min-w-35 relative mt-1.5">
                  <span
                    className={`absolute -top-2 left-3 px-1.5 text-[10px] font-bold z-10 transition-colors uppercase tracking-wider ${
                      isDarkMode
                        ? "bg-[#1A162B] text-gray-400"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    To Date
                  </span>
                  <DatePicker
                    className={`w-full h-11 px-4 rounded-xl border-2 hover:border-purple-400 focus:border-purple-500 transition-all ${
                      isDarkMode
                        ? "bg-white/5 border-white/5 text-white hover:bg-white/10"
                        : "bg-transparent border-gray-100 text-gray-800 hover:bg-gray-50/30"
                    }`}
                    value={dayjs(dateFilters.ToDate)}
                    onChange={(date) =>
                      setDateFilters((prev) => ({
                        ...prev,
                        ToDate: date
                          ? date.format("YYYY-MM-DD")
                          : getAcademicYearDates().ToDate,
                      }))
                    }
                    format="DD MMM, YYYY"
                    allowClear={false}
                    placement="bottomLeft"
                    suffixIcon={<Calendar size={14} className="opacity-50" />}
                    popupStyle={{ zIndex: 1050 }}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setDateFilters(getAcademicYearDates())}
                className={`flex items-center justify-center gap-2 px-8 h-11 rounded-full text-xs font-bold transition-all duration-300 transform active:scale-95 whitespace-nowrap shadow-sm hover:shadow-md ${
                  isDarkMode
                    ? "bg-white/5 text-gray-400 hover:bg-purple-700 hover:text-white border border-white/5"
                    : "bg-gray-100 text-gray-500 hover:bg-purple-600 hover:text-white"
                }`}
                title="Clear to current month"
              >
                <RotateCcw size={16} />
                <span className="inline">Clear</span>
              </button>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceFilters;
