import { AlignLeft, LayoutGrid } from "lucide-react";

const ViewToggle = ({ viewMode, setViewMode }) => {
  return (
    <>
      <div className="relative inline-flex bg-gray-200 rounded-full p-0.5 select-none mt-2 sm:mt-0">
        {/* Table Option */}
        <button
          onClick={() => setViewMode("table")}
          className={`relative z-10 px-2 sm:px-4 py-1 rounded-full transition-all duration-200 cursor-pointer ${
            viewMode === "table"
              ? "bg-[#8143ec] text-white"
              : "text-gray-700 hover:text-[#8a4fef]"
          }`}
        >
          <AlignLeft size={16} className="inline-block mr-0 sm:mr-1 mb-0.5" />
          <span className="hidden sm:inline">Table</span>
        </button>

        {/* Grid Option */}
        <button
          onClick={() => setViewMode("grid")}
          className={`relative z-10 px-2 sm:px-4 py-1 rounded-full transition-all duration-200 cursor-pointer ${
            viewMode === "grid"
              ? "bg-[#8143ec] text-white"
              : "text-gray-700 hover:text-[#8a4fef]"
          }`}
        >
          <LayoutGrid size={16} className="inline-block mr-0 sm:mr-1 mb-0.5" />
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Animated Background */}
        <span
          className={`absolute  left-1 h-[calc(100%-0.25rem)]  bg-[#8143ec] rounded-full transition-all duration-300 ${
            viewMode === "grid" ? "translate-x-full" : ""
          }`}
        />
      </div>
    </>
  );
};

export default ViewToggle;
