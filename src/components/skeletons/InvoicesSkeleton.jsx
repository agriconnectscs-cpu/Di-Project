import { ChevronRight } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const InvoicesSkeleton = ({
  isDarkMode,
  showSummary = true,
  showTable = true,
  showBreadcrumb = true,
}) => {
  const skeletonArray = Array.from({ length: 4 });
  const rows = Array.from({ length: 5 });

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1b172d" : "#e0e0e0"}
      highlightColor={isDarkMode ? "#2c243d" : "#f5f5f5"}
    >
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div
          className={`mb-3 p-3 pl-5 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-full transition-colors duration-200 ${isDarkMode ? "bg-[#141025]" : "bg-gray-100"
            }`}
        >
          <div className="flex items-center gap-2">
            <Skeleton width={50} height={20} style={{ borderRadius: 16 }} />
            <ChevronRight
              size={18}
              className="transition-colors duration-200 ease-in-out text-[var(--breadcrumb-divider)] opacity-40"
            />
            <Skeleton width={60} height={20} style={{ borderRadius: 16 }} />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 my-6">
          {skeletonArray.map((_, index) => (
            <div
              key={index}
              className={`animate-pulse flex items-center gap-4 rounded-lg p-5 ${isDarkMode ? "bg-[#141025]" : "bg-gray-100"
                }`}
            >
              <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden">
                <Skeleton circle height={40} width={40} />
              </div>
              <div className="flex flex-col justify-center w-full">
                <Skeleton height={16} width="80%" className="mb-2" />
                <Skeleton height={16} width="50%" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      {showTable && (
        <div className="space-y-4">
          {rows.map((_, i) => (
            <div
              key={i}
              className={`animate-pulse grid grid-cols-8 gap-4 items-center p-3 rounded-lg transition-colors duration-200 ${isDarkMode ? "bg-[#141025]" : "bg-gray-100"
                }`}
            >
              <Skeleton height={20} width="100%" /> {/* Sr */}
              <Skeleton height={20} width="100%" /> {/* Date */}
              <Skeleton height={16} width="90%" /> {/* Company */}
              <Skeleton height={16} width="80%" /> {/* Email / Contact */}
              <Skeleton height={16} width="100%" /> {/* Product Name */}
              <Skeleton height={16} width="100%" /> {/* Quantity */}
              <Skeleton height={16} width="100%" /> {/* Status */}
              <Skeleton height={16} width="100%" /> {/* Action */}
            </div>
          ))}
        </div>
      )}
    </SkeletonTheme>
  );
};

export default InvoicesSkeleton;
