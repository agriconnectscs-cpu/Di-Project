import toast from "react-hot-toast";
import { UserRoundPen } from "lucide-react";
import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSelector } from "react-redux";
import { selectUser } from "../../../../store/authSlice";

import { useTheme } from "../../../../ThemeProvider";
import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useUploadFiles } from "../../../../hooks/useUploadFiles";
import { useGetAllClientArea } from "../../../../hooks/useGetAllClientArea";

import CustomInput from "../../../../components/CustomInput";
import UploadFiles from "../../../../components/UploadFiles";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import CompanySkeleton from "../../../../components/skeletons/CompanySkeleton";
// Imports End -----------

// ---------- Card Component ----------
const Card = ({ children, isDarkMode }) => (
  <div
    className={`flex-1 p-3 sm:p-4 rounded-lg shadow-md transition-colors duration-200 ${
      isDarkMode ? "bg-[#1b172d]" : "border border-gray-200"
    }`}
  >
    {children}
  </div>
);

const CompanyPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { uploadFiles, isPending: isUploading } = useUploadFiles();

  const [selectedFile, setSelectedFile] = useState(null);

  const { data: clientAreas = [] } = useGetAllClientArea();

  const [formData, setFormData] = useState({
    clientId: 0,
    clientGroupId: 0,
    clientAreaId: 0,
    currencyId: 0,
    clientName: "",
    clientDomainName: "",
    shortName: "",
    email: "",
    contactPerson: "",
    cellNo: "",
    clientWebsite: "",
    clientNTN: "",
    clientSTRN: "",
    logoImageURL: "",
    logoThumbImageURL: "",
    licenceLocations: 0,
    rowVersionLong: 0,
    clientAreaName: "",
    clientGroupName: "",
    currencyName: "",
    currencySymbol: "",
  });

  console.log("formData:", formData); // Debugging line to check formData state

  // Fetch company data
  const { data: companyData, isLoading: companyDataIsLoading } = useQuery({
    queryKey: ["companyData", loginAccessToken],
    queryFn: async () => {
      const res = await fetch("/api/ADM/Client/GetByLoginClient", {
        headers: { Authorization: `Bearer ${loginAccessToken}` },
      });
      const result = await res.json();
      return result?.data ?? {};
    },
    enabled: !!loginAccessToken,
    onError: () => toast.error("Failed to fetch company data"),

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const { mutateAsync: updateCompanyAsync, isPending: updateCompanyPending } =
    useMutation({
      mutationFn: async (data) => {
        const res = await fetch("/api/ADM/Client/Save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/plain",
            Authorization: `Bearer ${loginAccessToken}`,
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to save company data");
        }

        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["companyData"]);
      },
      onError: (err) =>
        toast.error(err.message || "Failed to save company data"),
    });

  // Update form when company data loads
  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
    }
  }, [companyData]);

  const handleUpdateCompany = async () => {
    try {
      let logoImageURL = formData.logoImageURL;
      let logoThumbImageURL = formData.logoThumbImageURL;

      if (selectedFile) {
        const uploadResult = await uploadFiles({
          file: selectedFile,
          pathUrl: "CompanyImages",
        });
        logoImageURL = uploadResult.fileURL;
        logoThumbImageURL = uploadResult.thumbnailURL;
      }

      await updateCompanyAsync({
        ...formData,
        logoImageURL,
        logoThumbImageURL,
      });

      toast.success("Identity updated successfully! 🎉");
    } catch (error) {
      console.error(error);
    }
  };

  const authData = useSelector(selectUser);
  const sessionUser = authData;

  const sessionClientAreaId = sessionUser?.data?.loginAppClientAreaId;
  const sessionClientAreaName =
    clientAreas.find(
      (a) => Number(a.clientAreaId) === Number(sessionClientAreaId),
    )?.clientAreaName ||
    formData?.clientAreaName ||
    "";

  if (companyDataIsLoading || !companyData) {
    return <CompanySkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <>
      {/* Breadcrumb + Update Button */}
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center px-3 sm:pl-5 pb-5 lg:pb-0 transition-colors duration-200 
           ${isDarkMode ? " bg-[#141025]" : "border border-gray-200"}`}
      >
        <Breadcrumb />

        <Motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleUpdateCompany}
          disabled={updateCompanyPending || isUploading}
          className={`px-6 h-10 flex items-center gap-2 rounded-full text-white font-medium shadow-lg transition-all duration-300 
            ${
              updateCompanyPending || isUploading
                ? "bg-purple-800 cursor-not-allowed opacity-70"
                : "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20"
            }`}
        >
          {updateCompanyPending || isUploading ? (
            <LoadingSpinner
              content={isUploading ? "Uploading..." : "Updating..."}
            />
          ) : (
            <>
              <UserRoundPen size={18} />
              <span>Update Profile</span>
            </>
          )}
        </Motion.button>
      </div>

      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3 p-4 rounded-lg transition-colors ${
          isDarkMode ? "bg-[#141025]" : "bg-gray-50 border border-gray-200"
        }`}
      >
        {/* Left: Title & Description */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-1.5 h-6 rounded-full ${
                isDarkMode ? "bg-purple-400" : "bg-purple-600"
              }`}
            />
            <h1
              className={`text-xl font-semibold tracking-tight ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Company Profile
            </h1>
          </div>

          <p
            className={`text-sm ml-4 max-w-md ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Manage your company's information, branding, and contact details.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        {/* Company Details Card */}
        <Card isDarkMode={isDarkMode}>
          <h2 className="text-lg font-semibold mb-3 text-(--secondary-color)">
            Company Details
          </h2>
          <div>
            <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-3">
              <CustomInput
                label="Client Area"
                disabled
                value={sessionClientAreaName}
                placeholder="Client Area"
                inputClassName="cursor-not-allowed"
              />

              <CustomInput
                label="Client Group"
                value={formData.clientGroupName}
                placeholder="Client Group"
                disabled
                inputClassName="cursor-not-allowed"
                onChange={(e) =>
                  setFormData({ ...formData, clientGroupName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-3">
              <CustomInput
                id="currency"
                label="Currency"
                value={formData.currencyName}
                placeholder="Client Group"
                inputClassName="cursor-not-allowed"
                disabled
                onChange={(e) =>
                  setFormData({ ...formData, currencyName: e.target.value })
                }
              />

              {/* Currency Select */}
              <CustomInput
                id="currencySymbol"
                label="Currency Symbol"
                value={formData.currencySymbol}
                placeholder="Currency Symbol"
                disabled
                inputClassName="cursor-not-allowed"
                onChange={(e) =>
                  setFormData({ ...formData, currencySymbol: e.target.value })
                }
              />
            </div>

{/* fileURL */}
            <CustomInput
              id="clientName"
              label="Client Name"
              value={formData.clientName}
              placeholder="Enter Client Name"
              disabled
              inputClassName="cursor-not-allowed"
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
            />
          </div>
        </Card>

        {/* Contact Details Card */}
        <Card isDarkMode={isDarkMode}>
          <h2 className="text-lg font-semibold mb-3 text-(--secondary-color)">
            Contact Details
          </h2>
          <div className="grid grid-cols-2 gap-1 sm:gap-3">
            <div className="col-span-2 md:col-span-1">
              <CustomInput
                id="email"
                label="Email"
                type="email"
                value={formData.email}
                placeholder="name@email.com"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <CustomInput
                id="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                placeholder="Enter contact person's name"
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </div>

            <CustomInput
              id="cellNo"
              label="Cell No"
              value={formData.cellNo}
              placeholder="03xx-xxxxxxx"
              onChange={(e) =>
                setFormData({ ...formData, cellNo: e.target.value })
              }
            />

            <CustomInput
              id="clientWebsite"
              label="Website"
              value={formData.clientWebsite}
              placeholder="https://company.com"
              onChange={(e) =>
                setFormData({ ...formData, clientWebsite: e.target.value })
              }
            />

            <CustomInput
              id="clientNTN"
              label="NTN"
              value={formData.clientNTN}
              placeholder="NTN (1234567-8)"
              onChange={(e) =>
                setFormData({ ...formData, clientNTN: e.target.value })
              }
            />

            <CustomInput
              id="clientSTRN"
              label="STRN"
              value={formData.clientSTRN}
              placeholder="STRN (e.g., 1234567-8)"
              onChange={(e) =>
                setFormData({ ...formData, clientSTRN: e.target.value })
              }
            />
          </div>
        </Card>
      </div>

      {/* Company Logo */}
      <div
        className={`flex-1 p-4 rounded-lg shadow-md transition-colors duration-200 mb-3 ${
          isDarkMode ? "bg-[#1b172d]" : "border border-gray-200"
        }`}
      >
        <h2 className="text-lg font-semibold mb-3 text-(--secondary-color)">
          Company Logo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Logo Upload */}
          <div className="col-span-2">
            <UploadFiles
              label=""
              value={formData.logoImageURL}
              thumbnail={formData.logoThumbImageURL}
              imageUrlKey="logoImageURL"
              darkMode={isDarkMode}
              onChange={(val) => {
                setFormData((prev) => ({
                  ...prev,
                  logoImageURL: val.imageURL,
                  logoThumbImageURL: val.thumbImageURL,
                }));
                setSelectedFile(val.file);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyPage;
