import { AlertTriangle, RefreshCcw } from "lucide-react";

const TableErrorState = ({ isError, message, statusCode }) => {
  if (!isError || statusCode === 200 || message === "No record found.") {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-lg border border-red-100 dark:border-red-900/30">
          <RefreshCcw size={14} className="text-red-400" />
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          Oops! Something went wrong
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

export default TableErrorState;
