import { Table } from "antd";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../../ThemeProvider";

import { usePagePermissions } from "../../../../permissions";

import { useGetAuth } from "../../../../hooks/useGetAuth";
import { useGetLocations } from "../../../../hooks/useGetLocations";

import SearchBar from "../../../../components/SearchBar";
import CustomInput from "../../../../components/CustomInput";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../components/SelectDropDown";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
// Imports End------

const LocationPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canEdit, permission } = usePagePermissions();

  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Basic Info");

  // Fetch Data List
  const { data: locationListRaw = [], isLoading: locationIsLoading } =
    useGetLocations();

  // Fetch Form data for dropdowns
  const { data: formData } = useQuery({
    queryKey: ["locationFormData"],
    queryFn: async () => {
      const res = await fetch("/api/ADM/ClientLocation/GetFormData", {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${loginAccessToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch form data");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const locationType = formData?.data?.locationTypeRequests || [];
  const country = formData?.data?.countryRequests || [];
  const province = formData?.data?.provinceRequests || [];
  const city = formData?.data?.cityRequests || [];
  const cityAreaList = formData?.data?.cityAreaRequests || [];

  // Save / Update Location
  const { mutate: saveLocation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/ClientLocation/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success(result?.message);
      queryClient.invalidateQueries(["locationList"]);
      setOpenForm(false);
      setSelectedLocation(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpdate = () => {
    if (!selectedLocation) return;

    const payload = {
      clientLocationId: Number(selectedLocation.clientLocationId) || 0,
      locationTypeId: Number(selectedLocation.locationTypeId) || 0,
      locationName: selectedLocation.locationName || "",
      locationAddress: selectedLocation.locationAddress || "",
      addressId: Number(selectedLocation.addressId) || 0,
      rowVersionLong: Number(selectedLocation.rowVersionLong) || 0,
      addressRequest: {
        addressId: Number(selectedLocation.addressId) || 0,
        addressTypeId: selectedLocation.addressTypeId || null,
        countryId: Number(selectedLocation.countryId) || 0,
        provinceId: Number(selectedLocation.provinceId) || 0,
        cityId: Number(selectedLocation.cityId) || 0,
        cityAreaId: selectedLocation.cityAreaId || null,
        addressDetail: selectedLocation.addressDetail || "",
        areaName: selectedLocation.areaName || "",
        phoneNo: selectedLocation.phoneNo || "",
        phoneNo1: selectedLocation.phoneNo1 || "",
        phoneNo2: selectedLocation.phoneNo2 || "",
        fax: selectedLocation.fax || "",
        email: selectedLocation.email || "",
        uan: selectedLocation.uan || "",
        zipCode: selectedLocation.zipCode || "",
        tollFreeNo: selectedLocation.tollFreeNo || "",
        webSite: selectedLocation.webSite || "",
        navigationURL: selectedLocation.navigationURL || "",
        longitude: Number(selectedLocation.longitude) || 0,
        latitude: Number(selectedLocation.latitude) || 0,
        altitude: Number(selectedLocation.altitude) || 0,
        locationDistanceInKM:
          Number(selectedLocation.locationDistanceInKM) || 0,
        locationDistanceInMiles:
          Number(selectedLocation.locationDistanceInMiles) || 0,
        checkInRadiusInKm: Number(selectedLocation.checkInRadiusInKm) || 0,
        checkOutRadiusInKm: Number(selectedLocation.checkOutRadiusInKm) || 0,

        rowVersionLong: Number(selectedLocation.addressRowVersion) || 0,
      },
      clientLocationWeekDayRequests:
        selectedLocation.clientLocationWeekDayRequests || [],
      deletedClientLocationWeekDayRequests:
        selectedLocation.deletedClientLocationWeekDayRequests || [],
    };

    saveLocation(payload);
  };

  // Fetch Single Location by ID
  const { data: locationById, isLoading: isLocationDetailsLoading } = useQuery({
    queryKey: ["locationById", selectedLocation?.clientLocationId],
    queryFn: async () => {
      if (!selectedLocation?.clientLocationId) return null;
      const res = await fetch(
        `/api/ADM/ClientLocation/GetById?Id=${selectedLocation.clientLocationId}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch location details");
      return res.json();
    },
    enabled: !!selectedLocation?.clientLocationId,
  });

  useEffect(() => {
    const loc = locationById?.data;
    if (!loc) return;

    setSelectedLocation({
      ...loc,
      ...loc.addressRequest,

      rowVersionLong: loc.rowVersionLong,
      addressRowVersion: loc.addressRequest?.rowVersionLong,
    });
  }, [locationById]);

  const isFormValid = () => {
    return (
      selectedLocation.clientLocationId &&
      selectedLocation.locationTypeId &&
      selectedLocation.locationName &&
      selectedLocation.locationAddress &&
      selectedLocation.countryId &&
      selectedLocation.provinceId &&
      selectedLocation.cityId &&
      selectedLocation.addressDetail
    );
  };

  // Table Data
  const locationList = locationListRaw.map((item, i) => ({
    key: item.clientLocationId || i,
    sr: i + 1,
    clientLocationId: item.clientLocationId ?? "N/A",
    locationName: item.locationName ?? "N/A",
    locationTypeName: item.locationTypeName ?? "N/A",
    locationAddress: item.locationAddress ?? "N/A",
  }));

  const filteredData = locationList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.locationName?.toLowerCase().includes(search) ||
      item.locationTypeName?.toLowerCase().includes(search) ||
      item.locationAddress?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 60,
      sorter: (a, b) => a.sr - b.sr,
      align: "center",
    },
    {
      title: "Location Name",
      dataIndex: "locationName",
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
    },
    {
      title: "Location Type Name",
      dataIndex: "locationTypeName",
      sorter: (a, b) => a.locationTypeName.localeCompare(b.locationTypeName),
    },
    {
      title: "Location Address",
      dataIndex: "locationAddress",
      width: 500,
      sorter: (a, b) => a.locationAddress.localeCompare(b.locationAddress),
    },
  ];

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-center justify-between rounded-lg sm:rounded-full sm:items-center  px-3 sm:px-3 sm:pl-5 transition-colors duration-200  ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      {openForm && selectedLocation && (
        <div
          className={`my-5 p-4 rounded-xl border ${
            isDarkMode
              ? "border-gray-900 bg-[#1A162B]"
              : "border-gray-300 bg-white"
          }`}
        >
          <h2
            className={`font-semibold py-2 px-4 rounded-full flex items-center justify-start transition-colors duration-200 ${
              isDarkMode
                ? "text-gray-50 bg-purple-900/20 border border-purple-800/20"
                : "text-gray-800 bg-purple-100 border border-purple-200/40"
            }`}
          >
            <MapPin
              size={16}
              className={`mr-3 ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />

            <span
              className={`text-base font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {selectedLocation.locationName}
            </span>
          </h2>

          {/* Tabs */}
          <div
            className="flex mt-4 space-x-1 sm:space-x-2 mb-6 overflow-x-auto whitespace-nowrap pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {["Basic Info", "Address", "Geo", "Radius"].map((tab, i) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1 rounded-full font-medium transition-all duration-200 text-sm shrink-0 border ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-600"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {isLocationDetailsLoading ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 space-y-1 mb-6">
                {/* Location Name */}
                <div className="flex flex-col">
                  <label
                    className={`text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Location Name
                  </label>
                  <Skeleton
                    height={38}
                    className="col-span-1"
                    baseColor={isDarkMode ? "#2a2438" : "#e0e0e0"}
                    highlightColor={isDarkMode ? "#3b324f" : "#f5f5f5"}
                  />
                </div>

                {/* Location Address */}
                <div className="flex flex-col">
                  <label
                    className={`text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Location Address
                  </label>
                  <Skeleton
                    height={38}
                    className="col-span-1"
                    baseColor={isDarkMode ? "#2a2438" : "#e0e0e0"}
                    highlightColor={isDarkMode ? "#3b324f" : "#f5f5f5"}
                  />
                </div>

                {/* Location Type */}
                <div className="flex flex-col">
                  <label
                    className={`text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Location Type
                  </label>
                  <Skeleton
                    height={38}
                    className="col-span-1"
                    baseColor={isDarkMode ? "#2a2438" : "#e0e0e0"}
                    highlightColor={isDarkMode ? "#3b324f" : "#f5f5f5"}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <Skeleton
                  width={100}
                  height={32}
                  style={{ borderRadius: 999 }}
                  baseColor={isDarkMode ? "#2a2438" : "#e0e0e0"}
                  highlightColor={isDarkMode ? "#3b324f" : "#f5f5f5"}
                />
                <Skeleton
                  width={80}
                  height={32}
                  style={{ borderRadius: 999 }}
                  baseColor={isDarkMode ? "#2a2438" : "#e0e0e0"}
                  highlightColor={isDarkMode ? "#3b324f" : "#f5f5f5"}
                />
              </div>
            </>
          ) : (
            <>
              {/* Basic Info Tab */}
              {activeTab === "Basic Info" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 space-y-1">
                  <CustomInput
                    label="Location Name"
                    required
                    value={selectedLocation.locationName || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        locationName: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Location Address"
                    required
                    value={selectedLocation.locationAddress || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        locationAddress: e.target.value,
                      }))
                    }
                  />
                  <SelectDropDown
                    label="Location Type"
                    required
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.locationTypeId}
                    options={locationType?.map((lt) => ({
                      value: lt.locationTypeId,
                      label: lt.locationTypeName,
                    }))}
                    onChange={(val) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        locationTypeId: val,
                      }))
                    }
                  />
                </div>
              )}

              {/* Address Tab */}
              {activeTab === "Address" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 space-y-1">
                  <SelectDropDown
                    label="Country"
                    placeholder="Select Country"
                    required
                    value={selectedLocation.countryId}
                    options={country?.map((c) => ({
                      value: c.countryId,
                      label: c.countryName,
                    }))}
                    onChange={(val) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        countryId: val,
                        provinceId: null,
                        cityId: null,
                        cityAreaId: null,
                      }))
                    }
                  />

                  <SelectDropDown
                    label="Province"
                    placeholder="Select Province"
                    required
                    value={selectedLocation.provinceId}
                    options={province
                      ?.filter(
                        (p) => p.countryId === selectedLocation.countryId,
                      )
                      .map((p) => ({
                        value: p.provinceId,
                        label: p.provinceName,
                      }))}
                    onChange={(val) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        provinceId: val,
                        cityId: null,
                        cityAreaId: null,
                      }))
                    }
                  />

                  <SelectDropDown
                    label="City"
                    required
                    placeholder="Select City"
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.cityId}
                    options={city
                      ?.filter(
                        (c) => c.provinceId === selectedLocation.provinceId,
                      )
                      .map((c) => ({
                        value: c.cityId,
                        label: c.cityName,
                      }))}
                    onChange={(val) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        cityId: val,
                        cityAreaId: null,
                      }))
                    }
                  />

                  <SelectDropDown
                    label="Area"
                    placeholder="Select Area"
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.cityAreaId}
                    options={cityAreaList
                      .filter((a) => a.cityId === selectedLocation.cityId)
                      .map((a) => ({
                        value: a.cityAreaId,
                        label: a.areaName,
                      }))}
                    onChange={(val) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        cityAreaId: val,
                      }))
                    }
                  />

                  <CustomInput
                    label="Address Details"
                    placeholder="Enter full address"
                    className="col-span-2 sm:col-span-1"
                    required
                    value={selectedLocation.addressDetail || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        addressDetail: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Phone No"
                    placeholder="03xx-xxxxxxx"
                    value={selectedLocation.phoneNo || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        phoneNo: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Zip Code"
                    placeholder="e.g. 54000"
                    value={selectedLocation.zipCode || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Email"
                    placeholder="example@email.com"
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.email || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Location URL"
                    placeholder="e.g., Google Maps URL"
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.navigationURL || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        navigationURL: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {/* Geo Tab */}
              {activeTab === "Geo" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 space-y-1">
                  <CustomInput
                    label="Longitude"
                    placeholder="e.g., 74.3587 (East/West)"
                    value={selectedLocation.longitude || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        longitude: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Latitude"
                    placeholder="e.g., 31.5204 (North/South)"
                    value={selectedLocation.latitude || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        latitude: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Altitude"
                    placeholder="e.g., 540 meters above sea level"
                    value={selectedLocation.altitude || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        altitude: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Distance KM"
                    placeholder="e.g., 15 km"
                    value={selectedLocation.locationDistanceInKM || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        locationDistanceInKM: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {/* Radius Tab */}
              {activeTab === "Radius" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 space-y-1">
                  <CustomInput
                    label="Check-In Radius KM"
                    placeholder="e.g., 5 km"
                    value={selectedLocation.checkInRadiusInKm || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        checkInRadiusInKm: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Check-Out Radius KM"
                    placeholder="e.g., 10 km"
                    value={selectedLocation.checkOutRadiusInKm || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        checkOutRadiusInKm: e.target.value,
                      }))
                    }
                  />

                  <CustomInput
                    label="Distance Miles"
                    placeholder="e.g., 3 miles"
                    className="col-span-2 sm:col-span-1"
                    value={selectedLocation.locationDistanceInMiles || ""}
                    onChange={(e) =>
                      setSelectedLocation((prev) => ({
                        ...prev,
                        locationDistanceInMiles: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {/* Buttons  */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    if (!permission(canEdit, "No permission to edit location"))
                      return;
                    handleUpdate();
                  }}
                  disabled={!isFormValid() || isPending}
                  className={`px-5 py-1 rounded-full text-white cursor-pointer ${
                    !isFormValid() ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    isPending
                      ? "bg-purple-800 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isPending ? (
                    <LoadingSpinner content="Updating..." />
                  ) : (
                    "Update"
                  )}
                </button>

                <button
                  onClick={() => {
                    setOpenForm(false);
                    setSelectedLocation(null);
                    queryClient.removeQueries({
                      queryKey: [
                        "locationById",
                        selectedLocation?.clientLocationId,
                      ],
                      exact: true,
                    });
                  }}
                  className={`px-5 py-1 rounded-full border cursor-pointer ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-[#2a1b3d]"
                      : "border-gray-300 text-gray-700 hover:bg-purple-600 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!openForm && (
        <Table
          loading={locationIsLoading}
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 900 }}
          bordered
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-13 [&>td]:!py-1.5 [&>td]:!px-2"
          }
          pagination={{
            total: filteredData?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            defaultPageSize: 10,
          }}
          title={() => (
            <div className="flex items-center justify-between">
              <div
                className={`text-md mt-2 sm:mt-1 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Total Records: {filteredData?.length || 0}
              </div>

              <SearchBar
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Search Location..."
              />
            </div>
          )}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: () => {
              const fullData = locationListRaw.find(
                (item) => item.clientLocationId === record.clientLocationId,
              );

              setActiveTab("Basic Info");
              setSelectedLocation(fullData);
              setOpenForm(true);
            },
          })}
        />
      )}
    </>
  );
};

export default LocationPage;
