import Skeleton from "react-loading-skeleton";

const PermissionSkeleton = ({ isDarkMode }) => {
  const base = isDarkMode ? "#1e1e2fff" : "#f8fafc";
  const highlight = isDarkMode ? "#252542" : "#f1f5f9";

  return (
    <div className="flex flex-col lg:flex-row gap-3 min-h-[500px]">
      {/* Modules Sidebar Skeleton */}
      <div
        className={`w-full lg:w-72 shrink-0 rounded-xl border p-4 ${
          isDarkMode
            ? "bg-[#1a1a2e] border-[#2a2a4a]"
            : "bg-white border-gray-200"
        }`}
      >
        <Skeleton
          baseColor={base}
          highlightColor={highlight}
          borderRadius={8}
          height={24}
          width={80}
          className="mb-3"
        />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-md">
              <Skeleton
                baseColor={base}
                highlightColor={highlight}
                borderRadius={6}
                height={28}
                width={28}
              />
              <Skeleton
                baseColor={base}
                highlightColor={highlight}
                borderRadius={4}
                height={14}
                width={100}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tree Container Skeleton */}
      <div
        className={`flex-1 p-5 rounded-xl border ${
          isDarkMode
            ? "bg-[#151528] border-[#2a2a4a]"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Skeleton
            baseColor={base}
            highlightColor={highlight}
            borderRadius={6}
            height={20}
            width={200}
          />
          <div className="flex gap-2">
            {[1, 2].map((i) => (
              <Skeleton
                key={i}
                baseColor={base}
                highlightColor={highlight}
                borderRadius={6}
                height={28}
                width={80}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Skeleton
            baseColor={base}
            highlightColor={highlight}
            borderRadius={8}
            height={36}
            width="100%"
            className="max-w-sm"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton
              baseColor={base}
              highlightColor={highlight}
              borderRadius={8}
              height={32}
              width={100}
            />
            <Skeleton
              baseColor={base}
              highlightColor={highlight}
              borderRadius={8}
              height={32}
              width={100}
            />
          </div>
        </div>

        <div
          className={`rounded-xl border min-h-[300px] p-4 ${
            isDarkMode
              ? "bg-[#101020] border-[#2a2a4a]"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton
                  baseColor={base}
                  highlightColor={highlight}
                  borderRadius={6}
                  height={18}
                  width={18}
                  circle
                />
                <Skeleton
                  baseColor={base}
                  highlightColor={highlight}
                  borderRadius={4}
                  height={14}
                  width={140}
                />
                <Skeleton
                  baseColor={base}
                  highlightColor={highlight}
                  borderRadius={12}
                  height={18}
                  width={70}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionSkeleton;
