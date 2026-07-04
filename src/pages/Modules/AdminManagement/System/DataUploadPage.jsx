import { Table } from "antd";
import toast from "react-hot-toast";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Download, Upload, FileUp, Info, Loader } from "lucide-react";

import { useTheme } from "../../../../ThemeProvider";
import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useCloseOnEscape } from "../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../components/SearchBar";
import SuccessModal from "../../../../components/SuccessModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
// Imports End ----------------

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const DataUploadPage = () => {
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const [globalSearch, setGlobalSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [uploadModal, setUploadModal] = useState({
    open: false,
    template: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch ALl Templates
  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["dataTemplates", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/DBO/DataTemplate/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const result = await res.json();
      return Array.isArray(result?.data) ? result.data : [];
    },
    enabled: !!loginAccessToken,

    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Download Template Mutation
  const { mutate: downloadTemplate } = useMutation({
    mutationFn: async (id) => {
      setDownloadingId(id);
      const res = await fetch(`/api/DBO/DataTemplate/DownloadFile?Id=${id}`, {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });

      let result = null;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await res.json();
        }
      } catch (e) {
        console.error("Error parsing response JSON:", e);
      }

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Template file not found on server (404)");
        }
        throw new Error(
          result?.message || `Failed to download template (${res.status})`,
        );
      }

      return result?.data;
    },

    onSuccess: (url) => {
      if (url) {
        window.open(url, "_blank");
        toast.success("Download started");
      } else {
        toast.error("Download link not available");
      }
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setDownloadingId(null),
  });

  // Upload File Mutation
  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/DBO/DataTemplate/UploadFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
          accept: "text/plain",
        },
        body: JSON.stringify(payload),
      });

      let result = null;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await res.json();
        }
      } catch (e) {
        console.error("Error parsing upload response:", e);
      }

      if (!res.ok) {
        throw new Error(result?.message);
      }

      return result;
    },
    onSuccess: (result) => {
      setSuccessMessage(result?.message);
      setSuccessModalOpen(true);
      handleCloseUploadModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCloseUploadModal = () => {
    setUploadModal({ open: false, template: null });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useCloseOnEscape(uploadModal.open, handleCloseUploadModal);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64Content = await getBase64(file);
        setSelectedFile({
          name: file.name,
          base64: base64Content.split(",")[1],
        });
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        toast.error("Error reading file");
      }
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile || !uploadModal.template) {
      toast.error("Please select a file first");
      return;
    }

    uploadFile({
      uploadFileType: uploadModal.template.templateName,
      fileBase64String: selectedFile.base64,
      fileName: selectedFile.name,
    });
  };

  const filteredData = templates.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.templateDisplayName?.toLowerCase().includes(search) ||
      item.moduleName?.toLowerCase().includes(search) ||
      item.templateName?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "rno",
      width: 60,
      align: "center",
      sorter: (a, b) => a.rno - b.rno,
    },
    {
      title: "Module",
      dataIndex: "moduleName",
      width: 120,
      sorter: (a, b) => a.moduleName?.localeCompare(b.moduleName),
      render: (text) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isDarkMode
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-indigo-50 border-indigo-100 text-indigo-600"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Template Name",
      dataIndex: "templateDisplayName",
      width: 250,
      sorter: (a, b) =>
        a.templateDisplayName?.localeCompare(b.templateDisplayName),
      render: (text) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{text}</span>
        </div>
      ),
    },
    {
      title: "Instructions",
      dataIndex: "templateInstructions",
      ellipsis: true,
      render: (text) =>
        text ? (
          <div
            className="flex items-center gap-2 opacity-70 group cursor-help py-1"
            title={text}
          >
            <div
              className={`p-1 rounded-md ${
                isDarkMode ? "bg-white/5" : "bg-slate-100"
              }`}
            >
              <Info size={14} className="text-slate-500 shrink-0" />
            </div>
            <span className="text-xs truncate max-w-[200px] font-medium">
              {text}
            </span>
          </div>
        ) : (
          <span className="text-xs opacity-30 italic">No instructions</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => downloadTemplate(record.dataTemplateId)}
            disabled={downloadingId === record.dataTemplateId}
            title="Download Template"
            className={`p-2.5 rounded-full border transition-all duration-300 cursor-pointer flex items-center justify-center shadow-sm active:scale-95 ${
              isDarkMode
                ? "bg-[#1a1129] border-[#3b1f5a] text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
                : "bg-white border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600"
            }`}
          >
            {downloadingId === record.dataTemplateId ? (
              <Loader size={18} className="shrink-0 animate-spin" />
            ) : (
              <Download size={18} />
            )}
          </button>
          <button
            onClick={() => setUploadModal({ open: true, template: record })}
            title="Upload Data"
            className={`p-2.5 rounded-full border transition-all duration-300 cursor-pointer shadow-sm active:scale-95 ${
              isDarkMode
                ? "bg-[#1a1129] border-[#3b1f5a] text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50"
                : "bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
            }`}
          >
            <Upload size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 pb-5 lg:pb-0 
             ${isDarkMode ? " bg-[#141025]" : "bg-gray-50"}`}
      >
        <Breadcrumb />
        <SearchBar
          value={globalSearch}
          onChange={setGlobalSearch}
          placeholder="Search templates..."
        />
      </div>

      <div>
        <Table
          loading={isTemplatesLoading}
          columns={columns}
          dataSource={filteredData}
          bordered
          scroll={{ x: true }}
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2"
          }
          pagination={{
            total: filteredData?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            defaultPageSize: 10,
          }}
        />
      </div>

      <AnimatePresence>
        {uploadModal.open && (
          <Motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
              isDarkMode ? "bg-black/60" : "bg-gray-900/20"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className={`relative w-[90%] md:w-[500px] rounded-2xl shadow-2xl border px-6 py-8 select-none ${
                isDarkMode
                  ? "bg-[#1A162B] text-white border-purple-600/20"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isDarkMode ? "bg-purple-500/20" : "bg-purple-100"
                  }`}
                >
                  <FileUp size={32} className="text-purple-500" />
                </div>
                <h2
                  className={`text-xl font-bold mb-2 ${
                    isDarkMode ? "text-purple-400" : "text-purple-700"
                  }`}
                >
                  Upload Data
                </h2>
                <p className="text-sm opacity-60 mb-6">
                  Uploading for:{" "}
                  <span className="font-semibold">
                    {uploadModal.template?.templateDisplayName}
                  </span>
                </p>

                <div className="w-full space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 flex flex-col items-center gap-3 ${
                      isDarkMode
                        ? "bg-black/20 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5"
                        : "bg-gray-50 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    <Upload size={24} className="opacity-40" />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-purple-500">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs opacity-50">
                          Click to change file
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm opacity-50 font-medium">
                        Click to select file (Excel/CSV)
                      </span>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                    />
                  </div>

                  {uploadModal.template?.templateInstructions && (
                    <div
                      className={`p-4 rounded-xl text-left border ${
                        isDarkMode
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      <h4 className="text-xs font-bold uppercase mb-2 text-red-500 flex items-center gap-1">
                        <Info size={12} /> Instructions
                      </h4>
                      <p className="text-xs leading-relaxed opacity-80 whitespace-pre-line">
                        {uploadModal.template.templateInstructions}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCloseUploadModal}
                      className={`flex-1 px-5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer font-medium ${
                        isDarkMode
                          ? "border-gray-600 text-gray-300 hover:bg-white/5"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={!selectedFile || isUploading}
                      className={`flex-1 px-5 py-2.5 rounded-xl text-white transition-all duration-200 cursor-pointer font-medium flex items-center justify-center gap-2 ${
                        !selectedFile || isUploading
                          ? "bg-purple-500/40 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <SuccessModal
        open={successModalOpen}
        message={successMessage}
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default DataUploadPage;
