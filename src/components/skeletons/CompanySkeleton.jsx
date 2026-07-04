import { ChevronRight } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const CompanySkeleton = ({ isDarkMode }) => {
  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1b172d" : "#e0e0e0"}
      highlightColor={isDarkMode ? "#2c243d" : "#f5f5f5"}
    >
      {/* Breadcrumb + Button */}
      <div
        className={`mb-3 p-3 pl-5 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-full transition-colors duration-200 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Skeleton width={50} height={20} style={{ borderRadius: 16 }} />
          <ChevronRight
            size={18}
            className={
              "transition-colors duration-200 ease-in-out text-[var(--breadcrumb-divider)]"
            }
          />
          <Skeleton width={60} height={20} style={{ borderRadius: 16 }} />
        </div>

        <Skeleton width={120} height={20} style={{ borderRadius: 16 }} />
      </div>

      {/* Title & Description */}
      <div
        className={`mb-3 py-2 px-5 flex flex-col md:flex-col lg:flex-row sm:items-center justify-between rounded-lg transition-colors duration-200 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <div className="flex flex-col space-y-2">
          <Skeleton width={155} height={20} style={{ borderRadius: 16 }} />
          <div className="w-full sm:w-80">
            <Skeleton height={14} style={{ borderRadius: 16 }} />
          </div>
        </div>
      </div>

      {/* Card Section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        {/* Company Details Card */}
        <div
          className={`flex-1 p-4 rounded-lg shadow-md transition-colors duration-200 ${
            isDarkMode ? "bg-[#141025]" : "bg-[#fafafa]"
          }`}
        >
          <Skeleton width={150} height={20} className="mb-3" />

          {/* Input rows */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Skeleton height={38} />
            <Skeleton height={38} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Skeleton height={38} />
            <Skeleton height={38} />
          </div>

          <Skeleton height={38} />
        </div>

        {/* Contact Details Card */}
        <div
          className={`flex-1 p-4 rounded-lg shadow-md transition-colors duration-200 ${
            isDarkMode ? "bg-[#141025]" : "bg-[#fafafa]"
          }`}
        >
          <Skeleton width={150} height={20} className="mb-3" />

          <div className="grid grid-cols-2 gap-3">
            <Skeleton height={38} className="col-span-2 md:col-span-1" />
            <Skeleton height={38} className="col-span-2 md:col-span-1" />

            <Skeleton height={38} />
            <Skeleton height={38} />

            <Skeleton height={38} />
            <Skeleton height={38} />
          </div>
        </div>
      </div>

      {/* Logo Card */}
      <div
        className={`flex-1 p-4 mb-10 rounded-lg shadow-md transition-colors duration-200 ${
          isDarkMode ? "bg-[#141025]" : "bg-white"
        }`}
      >
        <Skeleton width={160} height={20} className="mb-4" />

        {/* Upload Skeleton */}
        <Skeleton height={150} borderRadius={12} />
      </div>
    </SkeletonTheme>
  );
};

export default CompanySkeleton;
