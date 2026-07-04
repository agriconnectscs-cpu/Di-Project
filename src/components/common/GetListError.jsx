import { AlertTriangle } from "lucide-react";

const GetListError = ({ isError, message, statusCode }) => {
  if (!isError || statusCode === 200 || message === "No record found.")
    return null;

  return (
    <div className="flex flex-col items-center justify-center py-10 w-full min-h-[200px] text-center mx-auto">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-red-500/10 animate-pulse">
        <AlertTriangle size={28} className="text-red-500" />
      </div>

      <h3 className="text-base font-bold mb-1 text-red-500">Display Error</h3>

      <p className="text-xs text-slate-500 max-w-sm leading-relaxed px-6">
        {message}
      </p>
    </div>
  );
};

export default GetListError;
