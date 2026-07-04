import { Table } from "antd";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSelector } from "react-redux";
import { selectUser } from "../../../../../store/authSlice";

import { useTheme } from "../../../../../ThemeProvider";

import { usePagePermissions } from "../../../../../permissions";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { useGetRoles } from "../../../../../hooks/useGetRoles";
import { useCloseOnEscape } from "../../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../../components/SearchBar";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../../components/SelectDropDown";
import LoadingSpinner from "../../../../../components/common/LoadingSpinner";

const RoleModulePage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canEdit, permission } = usePagePermissions();

  const authData = useSelector(selectUser);
  const allPossibleModules = authData?.data?.clientLocationModules || [];

  const [globalSearch, setGlobalSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Get Role Modules List
  const { data: roleList = [], isLoading: rolesIsLoading } = useGetRoles();

  // Get Roles Modules compare with roleLocationId & appProductModuleId
  const { data: roleModuleAssignments = [], isLoading: isLoadingAssignments } =
    useQuery({
      queryKey: ["roleModuleAssignments", loginAccessToken],
      queryFn: async () => {
        const res = await fetch("/api/ADM/RoleModule/GetAll", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        });

        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) return [];

        return result.data.map((item) => ({
          roleModuleId: item.roleModuleId,
          roleLocationId: item.roleLocationId,
          appProductModuleId: item.appProductModuleId,
          rowVersionLong: item.rowVersionLong,
        }));
      },
      onError: (error) => toast.error(error.message || "Something went wrong"),
    });

  const handleLocationChange = useCallback(
    (clientLocationId, roleData = selectedRoleData) => {
      const loc = roleData.roleLocationRequests.find(
        (l) => l.clientLocationId === clientLocationId,
      );
      setActiveLocation(loc || null);

      if (!loc) {
        setSelectedRowKeys([]);
        return;
      }

      const currentRoleLocationId = loc.roleLocationId;

      const latestAssignments =
        queryClient.getQueryData(["roleModuleAssignments", loginAccessToken]) ||
        roleModuleAssignments;

      const selectedKeys = latestAssignments
        .filter(
          (assignment) => assignment.roleLocationId === currentRoleLocationId,
        )
        .map((assignment) => assignment.appProductModuleId);

      setSelectedRowKeys(selectedKeys);
    },
    [selectedRoleData, loginAccessToken, queryClient, roleModuleAssignments],
  );

  const handleCloseModal = () => {
    setOpenForm(false);
    setSelectedRoleData(null);
    setActiveLocation(null);
    setSelectedRowKeys([]);
  };

  // Step 4: Save Role Modules
  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/RoleModule/SaveAll", {
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
    onSuccess: async (result) => {
      toast.success(result?.message);

      queryClient.invalidateQueries(["roleModuleAssignments"]);

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["roleModuleAssignments"],
          exact: true,
          type: "active",
        }),
        queryClient.refetchQueries({
          queryKey: ["roleList"],
          exact: true,
          type: "active",
        }),
      ]);

      handleCloseModal();
    },
    onError: (err) => toast.error(err.message),
    retry: false,
  });

  const handleAddItem = () => {
    if (!permission(canEdit, "No permission to edit role modules")) return;
    if (!activeLocation) {
      toast.error("Please select a location first.");
      return;
    }

    const existingAssignments = roleModuleAssignments.filter(
      (assignment) =>
        assignment.roleLocationId === activeLocation.roleLocationId,
    );

    const lstRequest = selectedRowKeys.map((key) => {
      const existing = existingAssignments.find(
        (a) => a.appProductModuleId === key,
      );
      return {
        roleModuleId: existing?.roleModuleId || 0,
        roleLocationId: activeLocation.roleLocationId,
        appProductModuleId: key,
        rowVersionLong: existing?.rowVersionLong || 0,
      };
    });

    const lstDeletedRequest = existingAssignments
      .filter(
        (existing) => !selectedRowKeys.includes(existing.appProductModuleId),
      )
      .map((mod) => {
        if (!mod.roleModuleId || mod.roleModuleId === 0) {
          return null;
        }
        return {
          roleModuleId: mod.roleModuleId,
          roleLocationId: activeLocation.roleLocationId,
          appProductModuleId: mod.appProductModuleId,
          rowVersionLong: mod?.rowVersionLong || 0,
        };
      })
      .filter((request) => request !== null);

    saveItem({ lstRequest, lstDeletedRequest });
  };

  // Filtered Table Data
  const filteredData = roleList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.roleName?.toLowerCase().includes(search) ||
      item.totalLocations?.toString().includes(search)
    );
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 80,
      sorter: (a, b) => a.sr - b.sr,
      className: "text-center",
    },
    {
      title: "Role",
      dataIndex: "roleName",
      sorter: (a, b) => a.roleName.localeCompare(b.roleName),
    },
    {
      title: "Total Locations",
      dataIndex: "totalLocations",
      width: 300,
      sorter: (a, b) => a.totalLocations - b.totalLocations,
      className: "text-center",
    },
  ];

  // Popup Modal Columns
  const moduleTableDataSource = allPossibleModules
    .filter(
      (mod) => mod.appClientLocationId === activeLocation?.clientLocationId,
    )
    .map((mod, index) => ({
      key: mod.appProductModuleId,
      sr: index + 1,
      moduleName: mod.loginModule.appModuleName,
    }));

  // Close modal on Escape
  useCloseOnEscape(openForm, handleCloseModal);

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-start sm:items-center justify-between rounded-full px-4 sm:px-3 sm:pl-5 lg:pb-0 transition-colors duration-200 ${
          isDarkMode ? " bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      {!openForm && (
        <Table
          loading={rolesIsLoading}
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: true }}
          bordered
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2"
          }
          onRow={(record) => ({
            onClick: () => {
              if (!permission(canEdit, "No permission to edit role modules"))
                return;
              const fullRoleData = roleList.find(
                (item) => item.roleId === record.roleId,
              );
              if (!fullRoleData) {
                toast.error(`Could not find data for Role ${record.roleName}`);
                return;
              }
              setSelectedRoleData(fullRoleData);
              const firstLocation = fullRoleData.roleLocationRequests?.[0];

              if (firstLocation) {
                handleLocationChange(
                  firstLocation.clientLocationId,
                  fullRoleData,
                );
              } else {
                setActiveLocation(null);
                setSelectedRowKeys([]);
              }

              setOpenForm(true);
            },
          })}
          pagination={{
            total: filteredData?.length || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            defaultPageSize: 10,
          }}
          title={() => (
            <div className="flex items-center justify-between">
              <div
                className={`text-md mt-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Total Records: {filteredData?.length || 0}
              </div>

              <SearchBar
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Search Role..."
              />
            </div>
          )}
        />
      )}

      {openForm && selectedRoleData && (
        <div className="my-5 rounded-xl">
          {(() => {
            const roleLocationsOptions =
              selectedRoleData.roleLocationRequests.map((loc) => ({
                label: loc.locationName || `Location ${loc.clientLocationId}`,
                value: loc.clientLocationId,
                ...loc,
              }));

            const handleCancel = handleCloseModal;

            return (
              <>
                <div
                  className={`py-2.5 px-4 rounded-lg border transition-all duration-200 
                    flex sm:flex-row sm:items-center justify-between gap-4 mb-4
                    ${
                      isDarkMode
                        ? "border-gray-800 bg-[#0D0C1A]"
                        : "border-gray-200 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-2 mt-1">
                    <Settings
                      size={16}
                      className={`${
                        isDarkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />

                    <h2
                      className={`text-base font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {selectedRoleData.roleName}
                    </h2>
                  </div>

                  <div className="w-40 md:w-64">
                    <SelectDropDown
                      options={roleLocationsOptions}
                      value={activeLocation?.clientLocationId || null}
                      onChange={(value) => handleLocationChange(value)}
                    />
                  </div>
                </div>

                {activeLocation ? (
                  <Table
                    loading={isLoadingAssignments}
                    columns={[
                      {
                        title: "Sr.",
                        dataIndex: "sr",
                        width: 80,
                        className: "text-center",
                      },
                      {
                        title: "Module Name",
                        dataIndex: "moduleName",
                      },
                    ]}
                    dataSource={moduleTableDataSource}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: setSelectedRowKeys,
                    }}
                    onRow={(record) => ({
                      onClick: (e) => {
                        if (e.target.closest(".ant-checkbox-wrapper")) return;
                        setSelectedRowKeys((prev) => {
                          const key = record.key;
                          return prev.includes(key)
                            ? prev.filter((k) => k !== key)
                            : [...prev, key];
                        });
                      },
                    })}
                    bordered
                    scroll={{ x: true }}
                    rowClassName={() =>
                      "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2"
                    }
                  />
                ) : (
                  <div
                    className={`p-8 text-center rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-50 text-gray-500 border border-dashed border-gray-300"
                    }`}
                  >
                    <p className="font-medium">
                      Please select a location to view and configure modules.
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    onClick={handleCancel}
                    className={`px-5 py-1 rounded-full border cursor-pointer ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-[#2a1b3d]"
                        : "border-gray-300 text-gray-700 hover:bg-purple-600 hover:text-white"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAddItem}
                    disabled={
                      isPending || !activeLocation || isLoadingAssignments
                    }
                    className={`px-5 py-1 rounded-full text-white transition cursor-pointer
                       ${
                         isPending || !activeLocation
                           ? "bg-purple-800 cursor-not-allowed"
                           : "bg-purple-600 hover:bg-purple-700"
                       }`}
                  >
                    {isPending ? (
                      <LoadingSpinner content="Saving..." />
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default RoleModulePage;
