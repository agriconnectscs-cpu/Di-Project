import { Table, Tree } from "antd";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";
import { useCallback, useEffect, useState, useMemo } from "react";
import { CircleCheckBig, CircleX, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../../../ThemeProvider";

import { useGetAuth } from "../../../../../hooks/useGetAuth";
import { useGetRoles } from "../../../../../hooks/useGetRoles";
import { useCloseOnEscape } from "../../../../../hooks/useCloseOnEscape";

import SearchBar from "../../../../../components/SearchBar";
import Breadcrumb from "../../../../../components/common/Breadcrumb";
import SelectDropDown from "../../../../../components/SelectDropDown";
import LoadingSpinner from "../../../../../components/common/LoadingSpinner";
// Imports End------

// Tree building function
const buildTreeData = (menus, reports, parentId = null) =>
  menus
    .filter((m) => {
      if (parentId === null) {
        return (
          m.loginMenu.parentAppMenuId === null ||
          m.loginMenu.parentAppMenuId === 0
        );
      }
      return m.loginMenu.parentAppMenuId === parentId;
    })
    .sort(
      (a, b) =>
        (a.loginMenu.appMenuSeqNo || 0) - (b.loginMenu.appMenuSeqNo || 0),
    )
    .map((m) => {
      const menuId = m.loginMenu.appProductMenuId;
      const children = buildTreeData(menus, reports, menuId);

      const menuReports = reports
        .filter((r) => r.appProductMenuId === menuId && r.loginReport?.isActive)
        .sort(
          (a, b) =>
            (a.loginReport?.reportSeqNo || 0) -
            (b.loginReport?.reportSeqNo || 0),
        )
        .map((r) => ({
          title: r.loginReport?.reportTitle || "Unnamed Report",
          key: `R${r.appProductReportId}`,
          isLeaf: true,
        }));

      const finalChildren = [...children, ...menuReports];

      return {
        title: m.loginMenu.appMenuDisplayName || m.loginMenu.appMenuName,
        key: m.appProductMenuId.toString(),
        children: finalChildren.length > 0 ? finalChildren : undefined,
      };
    });

const getAllKeys = (treeData) => {
  let keys = [];
  treeData.forEach((node) => {
    keys.push(node.key);
    if (node.children) {
      keys = keys.concat(getAllKeys(node.children));
    }
  });
  return keys;
};

const RoleReportPage = () => {
  const queryClient = useQueryClient();
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();

  const authData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("LoggedInUser"));
    } catch {
      return null;
    }
  }, []);

  const allPossibleMenus = useMemo(
    () => authData?.data?.clientLocationMenus || [],
    [authData],
  );
  const allPossibleModules = useMemo(
    () => authData?.data?.loginUserModules || [],
    [authData],
  );
  //  clientLocationReports — scoped to this client/location
  const allPossibleReports = useMemo(
    () => authData?.data?.clientLocationReports || [],
    [authData],
  );

  const [globalSearch, setGlobalSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Filter reports by active location
  const reportsForActiveLocation = useMemo(() => {
    if (!activeLocation) return [];
    return allPossibleReports.filter(
      (r) => r.appClientLocationId === activeLocation.clientLocationId,
    );
  }, [allPossibleReports, activeLocation]);

  //  Get all roles
  const { data: roleList = [], isLoading: rolesIsLoading } = useGetRoles();

  // Get all role report assignments
  const { data: roleReportAssignments = [], isLoading: isLoadingAssignments } =
    useQuery({
      queryKey: ["allRoleReport", loginAccessToken],
      queryFn: async () => {
        const res = await fetch("/api/ADM/RoleReport/GetAll", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        });
        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) return [];
        return result.data.map((item) => ({
          roleReportId: item.roleReportId,
          roleLocationId: item.roleLocationId,
          appProductReportId: item.appProductReportId,
          parentAppMenuId: item.parentAppMenuId,
          rowVersionLong: item.rowVersionLong,
        }));
      },
      onError: (error) => toast.error(error.message),
    });

  // Fetches saved reports for the active location
  const { data: roleLocationReports = [] } = useQuery({
    queryKey: [
      "roleLocationReports",
      activeLocation?.roleLocationId,
      loginAccessToken,
    ],
    enabled: !!activeLocation?.roleLocationId,

    queryFn: async () => {
      const res = await fetch(
        `/api/ADM/RoleReport/GetRoleLocationReports?RoleLocationId=${activeLocation.roleLocationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );
      const result = await res.json();
      if (!result.data || !Array.isArray(result.data)) return [];
      return result.data.map((item) => ({
        roleReportId: item.roleReportId,
        roleLocationId: item.roleLocationId,
        appProductReportId: item.appProductReportId,
        parentAppMenuId: item.parentAppMenuId,
      }));
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  const { data: roleModuleAssignments = [] } = useQuery({
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
        roleLocationId: item.roleLocationId,
        appProductModuleId: item.appProductModuleId,
      }));
    },
    onError: (error) => toast.error(error.message),

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const getMenusByModule = (menus, moduleId) =>
    menus.filter((m) => m.loginMenu.appProductModuleId === moduleId);

  //  Only show modules that have reports in clientLocationReports
  const filteredModules = useMemo(() => {
    if (!activeLocation || !roleModuleAssignments.length) return [];

    const assignedModuleIds = roleModuleAssignments
      .filter((ra) => ra.roleLocationId === activeLocation.roleLocationId)
      .map((ra) => ra.appProductModuleId);

    // Module IDs that actually have reports
    const reportModuleIds = new Set(
      reportsForActiveLocation
        .map((r) => r.loginReport?.appProductModuleId)
        .filter(Boolean),
    );

    return allPossibleModules.filter(
      (m) =>
        assignedModuleIds.includes(m.appProductModuleId) &&
        reportModuleIds.has(m.appProductModuleId),
    );
  }, [
    allPossibleModules,
    activeLocation,
    roleModuleAssignments,
    reportsForActiveLocation,
  ]);

  //  Only show menus that have reports (and their ancestor menus)
  const moduleTreeData = useMemo(() => {
    if (!activeLocation || !activeModule) return [];

    const locationMenus = allPossibleMenus.filter(
      (m) => m.appClientLocationId === activeLocation.clientLocationId,
    );

    const filteredMenus = getMenusByModule(locationMenus, activeModule);

    // Menu IDs that directly have reports
    const reportMenuIds = new Set(
      reportsForActiveLocation.map((r) => r.appProductMenuId),
    );

    const menuIdsToShow = new Set(
      filteredMenus
        .filter((m) => reportMenuIds.has(m.loginMenu.appProductMenuId))
        .map((m) => m.loginMenu.appProductMenuId),
    );

    // Walk up and include all ancestor menus
    const includeParents = (menuId) => {
      const menu = filteredMenus.find(
        (m) => m.loginMenu.appProductMenuId === menuId,
      );
      if (!menu) return;
      const parentId = menu.loginMenu.parentAppMenuId;
      if (parentId) {
        menuIdsToShow.add(parentId);
        includeParents(parentId);
      }
    };

    [...menuIdsToShow].forEach((id) => includeParents(id));

    const relevantMenus = filteredMenus.filter((m) =>
      menuIdsToShow.has(m.loginMenu.appProductMenuId),
    );

    return buildTreeData(relevantMenus, reportsForActiveLocation, null);
  }, [
    allPossibleMenus,
    reportsForActiveLocation,
    activeLocation,
    activeModule,
  ]);

  const checkedKeysForCurrentModule = useMemo(() => {
    if (
      !activeModule ||
      checkedKeys.length === 0 ||
      moduleTreeData.length === 0
    )
      return [];
    const keysInCurrentTree = new Set(getAllKeys(moduleTreeData));
    return checkedKeys.filter((key) => keysInCurrentTree.has(key));
  }, [checkedKeys, activeModule, moduleTreeData]);

  // Sync roleLocationReports query data → checkedKeys + isAllSelected
  useEffect(() => {
    if (!activeLocation) return;

    const currentRoleLocationId = activeLocation.roleLocationId;
    const selectedKeys = roleLocationReports.map(
      (item) => `R${item.appProductReportId}`,
    );
    setCheckedKeys(selectedKeys);

    const assignedModuleIds = roleModuleAssignments
      .filter((ra) => ra.roleLocationId === currentRoleLocationId)
      .map((ra) => ra.appProductModuleId);

    const reportModuleIds = new Set(
      reportsForActiveLocation
        .map((r) => r.loginReport?.appProductModuleId)
        .filter(Boolean),
    );

    const relevantModules = allPossibleModules.filter(
      (m) =>
        assignedModuleIds.includes(m.appProductModuleId) &&
        reportModuleIds.has(m.appProductModuleId),
    );

    const locationMenus = allPossibleMenus.filter(
      (m) => m.appClientLocationId === activeLocation.clientLocationId,
    );

    const relevantReportKeys = relevantModules.flatMap((module) => {
      const moduleMenus = getMenusByModule(
        locationMenus,
        module.appProductModuleId,
      );
      const menuIds = new Set(
        moduleMenus.map((m) => m.loginMenu.appProductMenuId),
      );
      return reportsForActiveLocation
        .filter(
          (r) => menuIds.has(r.appProductMenuId) && r.loginReport?.isActive,
        )
        .map((r) => `R${r.appProductReportId}`);
    });

    const hasAll =
      relevantReportKeys.length > 0 &&
      relevantReportKeys.every((k) => selectedKeys.includes(k));

    setIsAllSelected(hasAll);
  }, [
    roleLocationReports,
    activeLocation,
    roleModuleAssignments,
    reportsForActiveLocation,
    allPossibleModules,
    allPossibleMenus,
  ]);

  const handleLocationChange = useCallback(
    (clientLocationId, roleData = selectedRoleData) => {
      if (!roleData) return;

      const loc = roleData.roleLocationRequests.find(
        (l) => l.clientLocationId === clientLocationId,
      );

      setActiveLocation(loc || null);
      setExpandedKeys([]);

      if (!loc) {
        setCheckedKeys([]);
        setIsAllSelected(false);
      }
    },
    [selectedRoleData],
  );

  const handleToggleSelectAllModules = () => {
    if (!activeLocation) {
      return toast.error("Please select a location first.");
    }

    if (isAllSelected) {
      setCheckedKeys([]);
    } else {
      const locationMenus = allPossibleMenus.filter(
        (m) => m.appClientLocationId === activeLocation.clientLocationId,
      );

      const allReportKeys = filteredModules.flatMap((module) => {
        const moduleMenus = getMenusByModule(
          locationMenus,
          module.appProductModuleId,
        );
        const menuIds = new Set(
          moduleMenus.map((m) => m.loginMenu.appProductMenuId),
        );
        return reportsForActiveLocation
          .filter(
            (r) => menuIds.has(r.appProductMenuId) && r.loginReport?.isActive,
          )
          .map((r) => `R${r.appProductReportId}`);
      });

      setCheckedKeys(allReportKeys);
    }

    setIsAllSelected(!isAllSelected);
  };

  const handleModuleClick = (moduleId) => {
    setExpandedKeys([]);
    setActiveModule(moduleId);
  };

  const handleCloseModal = () => {
    setOpenForm(false);
    setSelectedRoleData(null);
    setActiveLocation(null);
    setCheckedKeys([]);
    setActiveModule(null);
    setExpandedKeys([]);
    setIsAllSelected(false);
  };

  // Save Role Report
  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/RoleReport/SaveAll", {
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
      await queryClient.invalidateQueries({ queryKey: ["allRoleReport"] });
      if (activeLocation) {
        await queryClient.invalidateQueries({
          queryKey: ["roleLocationReports", activeLocation.roleLocationId],
        });
      }
      toast.success(result?.message);
      handleCloseModal();
    },

    onError: (err) => toast.error(err.message),
    retry: false,
  });

  //  Add new role report
  const handleAddItem = () => {
    if (!activeLocation) return toast.error("Please select a location first.");

    const currentRoleLocationId = activeLocation.roleLocationId;
    const selectedReportKeys = checkedKeys.filter((k) => k.startsWith("R"));

    const allExistingAssignments = (
      queryClient.getQueryData(["allRoleReport", loginAccessToken]) ||
      roleReportAssignments
    ).filter(
      (assignment) => assignment.roleLocationId === currentRoleLocationId,
    );

    const lstRequest = selectedReportKeys.map((key) => {
      const appProductReportId = parseInt(key.substring(1));
      const report = reportsForActiveLocation.find(
        (r) => r.appProductReportId === appProductReportId,
      );
      const existing = allExistingAssignments.find(
        (a) => a.appProductReportId === appProductReportId,
      );
      return {
        roleReportId: existing?.roleReportId || 0,
        roleLocationId: currentRoleLocationId,
        parentAppMenuId: report?.appProductMenuId || 0,
        appProductReportId,
        rowVersionLong: existing?.rowVersionLong || 0,
      };
    });

    const selectedReportIds = new Set(
      selectedReportKeys.map((k) => parseInt(k.substring(1))),
    );

    const lstDeletedRequest = allExistingAssignments
      .filter((a) => !selectedReportIds.has(a.appProductReportId))
      .map((a) => ({
        roleReportId: a.roleReportId,
        roleLocationId: a.roleLocationId,
        parentAppMenuId: a.parentAppMenuId,
        appProductReportId: a.appProductReportId,
        rowVersionLong: a.rowVersionLong,
      }));

    saveItem({ lstRequest, lstDeletedRequest });
  };

  const filteredData = roleList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.roleName?.toLowerCase().includes(search) ||
      item.totalLocations?.toString().includes(search)
    );
  });

  useCloseOnEscape(openForm, handleCloseModal);

  return (
    <>
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-start sm:items-center justify-between rounded-full px-4 sm:px-3 sm:pl-5 lg:pb-0 transition-colors duration-200 ${
          isDarkMode ? "bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      {!openForm && (
        <Table
          loading={rolesIsLoading}
          columns={[
            {
              title: "Sr.",
              dataIndex: "sr",
              width: 80,
              className: "text-center",
              sorter: (a, b) => a.sr - b.sr,
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
              className: "text-center",
              sorter: (a, b) => a.totalLocations - b.totalLocations,
            },
          ]}
          dataSource={filteredData}
          scroll={{ x: true }}
          bordered
          rowClassName={() =>
            "hover:bg-[#1b122b]/30 !h-12 [&>td]:!py-1.5 [&>td]:!px-2 cursor-pointer"
          }
          onRow={(record) => ({
            onClick: () => {
              const fullRoleData = roleList.find(
                (item) => item.roleId === record.roleId,
              );
              if (!fullRoleData)
                return toast.error(
                  `Could not find data for Role ${record.roleName}`,
                );

              setSelectedRoleData(fullRoleData);
              const firstLocation = fullRoleData.roleLocationRequests?.[0];

              if (firstLocation) {
                const assignedVals = roleModuleAssignments
                  .filter(
                    (ra) => ra.roleLocationId === firstLocation.roleLocationId,
                  )
                  .map((ra) => ra.appProductModuleId);

                const reportsThisLoc = allPossibleReports.filter(
                  (r) =>
                    r.appClientLocationId === firstLocation.clientLocationId,
                );

                const reportModuleIds = new Set(
                  reportsThisLoc
                    .map((r) => r.loginReport?.appProductModuleId)
                    .filter(Boolean),
                );

                const firstValidModule = allPossibleModules.find(
                  (m) =>
                    assignedVals.includes(m.appProductModuleId) &&
                    reportModuleIds.has(m.appProductModuleId),
                );

                const firstModuleId =
                  firstValidModule?.appProductModuleId || null;

                setActiveLocation(firstLocation);
                setActiveModule(firstModuleId);
                handleLocationChange(
                  firstLocation.clientLocationId,
                  fullRoleData,
                );
              } else {
                setActiveLocation(null);
                setActiveModule(null);
                setCheckedKeys([]);
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
          <div
            className={`py-2.5 px-4 rounded-lg border transition-all duration-200 flex sm:flex-row sm:items-center justify-between gap-4 mb-4 ${
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
            <div className="w-40 sm:w-64">
              <SelectDropDown
                options={selectedRoleData.roleLocationRequests.map((loc) => ({
                  label: loc.locationName,
                  value: loc.clientLocationId,
                }))}
                value={activeLocation?.clientLocationId || null}
                onChange={(value) => {
                  const loc = selectedRoleData.roleLocationRequests.find(
                    (l) => l.clientLocationId === value,
                  );
                  if (loc) {
                    const assignedVals = roleModuleAssignments
                      .filter((ra) => ra.roleLocationId === loc.roleLocationId)
                      .map((ra) => ra.appProductModuleId);

                    const reportsThisLoc = allPossibleReports.filter(
                      (r) => r.appClientLocationId === loc.clientLocationId,
                    );

                    const reportModuleIds = new Set(
                      reportsThisLoc
                        .map((r) => r.loginReport?.appProductModuleId)
                        .filter(Boolean),
                    );

                    const firstValidModule = allPossibleModules.find(
                      (m) =>
                        assignedVals.includes(m.appProductModuleId) &&
                        reportModuleIds.has(m.appProductModuleId),
                    );

                    setActiveModule(
                      firstValidModule?.appProductModuleId || null,
                    );
                  }
                  setExpandedKeys([]);
                  handleLocationChange(value);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            {filteredModules.length > 0 && (
              <div
                className={`col-span-12 lg:col-span-3 rounded-lg p-3 border ${
                  isDarkMode
                    ? "border-gray-700 bg-[#0D0C1A]"
                    : "border-gray-200 bg-white"
                }`}
              >
                {activeLocation && (
                  <Motion.button
                    onClick={() => {
                      handleToggleSelectAllModules();
                      toast.success(
                        isAllSelected
                          ? "Menus Unselected"
                          : "All Menus Selected 🎉",
                      );
                    }}
                    disabled={isLoadingAssignments}
                    className={`w-full text-center px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ease-in-out mb-3 ${
                      isLoadingAssignments
                        ? "text-gray-400 bg-gray-500/30 cursor-not-allowed"
                        : isDarkMode
                          ? "text-purple-100 bg-purple-700/60 hover:bg-purple-700/80 active:bg-purple-800 shadow-sm hover:shadow-md"
                          : "text-purple-700 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 shadow-sm hover:shadow-md"
                    }`}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center gap-1">
                      <Motion.div
                        className={`transition-transform duration-300 ease-in-out ${
                          isAllSelected ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        {isAllSelected ? (
                          <CircleX size={16} />
                        ) : (
                          <CircleCheckBig size={16} />
                        )}
                      </Motion.div>
                      <Motion.span className="transition-opacity duration-300 ease-in-out">
                        {isAllSelected
                          ? "Unselect All Menus"
                          : "Select All Menus"}
                      </Motion.span>
                    </div>
                  </Motion.button>
                )}

                <h3
                  className={`text-md font-semibold mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Modules
                </h3>

                <div className="space-y-2">
                  {filteredModules.map((module) => (
                    <div
                      key={module.appProductModuleId}
                      onClick={() =>
                        handleModuleClick(module.appProductModuleId)
                      }
                      className={`cursor-pointer rounded-md p-2.5 flex items-center gap-3 transition ${
                        activeModule === module.appProductModuleId
                          ? isDarkMode
                            ? "bg-purple-700 shadow-md"
                            : "bg-purple-100 border border-purple-400 shadow-sm"
                          : isDarkMode
                            ? "hover:bg-[#1A162E] hover:shadow-sm"
                            : "hover:bg-gray-100 hover:shadow-sm"
                      }`}
                    >
                      <img
                        src={module.moduleImageURL}
                        className="w-8 h-8 rounded-full"
                        alt={module.appModuleName}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {module.appModuleName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`col-span-12 ${
                filteredModules.length > 0 ? "lg:col-span-9" : "lg:col-span-12"
              } rounded-lg p-4 border ${
                isDarkMode
                  ? "border-gray-700 bg-[#0D0C1A]"
                  : "border-gray-200 bg-white"
              }`}
            >
              {!activeLocation ? (
                <p
                  className={`text-center py-10 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Please select a Location first.
                </p>
              ) : !activeModule ? (
                <p
                  className={`text-center py-10 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Please select a module to view its menus.
                </p>
              ) : moduleTreeData.length === 0 ? (
                <p
                  className={`text-center py-10 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No reports available for this module.
                </p>
              ) : (
                <Tree
                  checkable
                  selectable={false}
                  treeData={moduleTreeData}
                  checkedKeys={checkedKeysForCurrentModule.map(String)}
                  onCheck={(checked) => {
                    const newCheckedKeysForModule = checked.map(String);
                    const currentModuleKeys = getAllKeys(moduleTreeData);
                    const keysToKeep = checkedKeys.filter(
                      (key) => !currentModuleKeys.includes(key),
                    );

                    const finalCheckedKeys = [
                      ...keysToKeep,
                      ...newCheckedKeysForModule,
                    ];

                    setCheckedKeys(finalCheckedKeys);

                    const allReportKeysInTree = currentModuleKeys.filter((k) =>
                      k.startsWith("R"),
                    );
                    const selectedReportsInTree =
                      newCheckedKeysForModule.filter((k) => k.startsWith("R"));

                    setIsAllSelected(
                      allReportKeysInTree.length > 0 &&
                        selectedReportsInTree.length ===
                          allReportKeysInTree.length,
                    );
                  }}
                  expandedKeys={expandedKeys}
                  onExpand={(newExpandedKeys) =>
                    setExpandedKeys(newExpandedKeys)
                  }
                />
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={handleCloseModal}
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
                isPending ||
                !activeLocation ||
                !activeModule ||
                isLoadingAssignments
              }
              className={`px-5 py-1 rounded-full text-white transition cursor-pointer ${
                isPending || !activeLocation || !activeModule
                  ? "bg-purple-800 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isPending ? <LoadingSpinner content="Saving..." /> : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleReportPage;
