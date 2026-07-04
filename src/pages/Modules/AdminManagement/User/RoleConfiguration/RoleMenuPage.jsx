import { Table, Tree } from "antd";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";
import { useCallback, useState, useMemo } from "react";
import { CircleCheckBig, CircleX, Settings } from "lucide-react";
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
// Imports End------

// Helper moved into component for Redux access

// Tree building function
const buildTreeData = (menus, parentId = null) =>
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
      const children = buildTreeData(menus, m.loginMenu.appProductMenuId);
      return {
        title: m.loginMenu.appMenuDisplayName || m.loginMenu.appMenuName,
        key: m.appProductMenuId.toString(),
        children: children.length > 0 ? children : undefined,
      };
    });

// Helper to get all keys in a tree structure
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

const RoleMenuPage = () => {
  const queryClient = useQueryClient();

  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const { canEdit, permission } = usePagePermissions();

  const authData = useSelector(selectUser);

  const allPossibleMenus = useMemo(
    () => authData?.data?.clientLocationMenus || [],
    [authData],
  );
  const allPossibleModules = useMemo(
    () => authData?.data?.loginUserModules || [],
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

  const handleToggleSelectAllModules = () => {
    if (!permission(canEdit, "No permission to edit role menus")) return;
    if (!activeLocation) {
      return toast.error("Please select a location first.");
    }

    if (isAllSelected) {
      setCheckedKeys([]);
    } else {
      const locationMenus = allPossibleMenus.filter(
        (m) => m.appClientLocationId === activeLocation.clientLocationId,
      );

      const allKeys = filteredModules.flatMap((module) => {
        const moduleMenus = getMenusByModule(
          locationMenus,
          module.appProductModuleId,
        );
        return moduleMenus.map((m) => m.appProductMenuId.toString());
      });

      setCheckedKeys(allKeys);
    }

    setIsAllSelected(!isAllSelected);
  };

  const { data: roleList = [], isLoading: rolesIsLoading } = useGetRoles();

  const { data: roleMenuAssignments = [], isLoading: isLoadingAssignments } =
    useQuery({
      queryKey: ["allRoleMenu", loginAccessToken],
      queryFn: async () => {
        const res = await fetch("/api/ADM/RoleMenu/GetAll", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginAccessToken}`,
          },
        });
        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) return [];
        return result.data.map((item) => ({
          roleMenuId: item.roleMenuId,
          roleLocationId: item.roleLocationId,
          appProductMenuId: item.appProductMenuId,
          rowVersionLong: item.rowVersionLong,
        }));
      },
      onError: (error) => toast.error(error.message),
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
  });

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
        return;
      }

      const currentRoleLocationId = loc.roleLocationId;
      const latestAssignments =
        queryClient.getQueryData(["allRoleMenu", loginAccessToken]) ||
        roleMenuAssignments;

      const allParentIds = new Set(
        allPossibleMenus
          .map((m) => m.loginMenu.parentAppMenuId)
          .filter((id) => id !== null && id !== 0),
      );

      const selectedKeys = latestAssignments
        .filter(
          (assignment) => assignment.roleLocationId === currentRoleLocationId,
        )
        .map((assignment) => assignment.appProductMenuId.toString());

      // Filter out parent IDs so the Tree doesn't auto-check ALL children
      const leafKeys = selectedKeys.filter(
        (key) => !allParentIds.has(parseInt(key)),
      );

      setCheckedKeys(leafKeys);

      // AUTO-SET Select All toggle based on loaded keys
      // 1. Get filtered modules for this location (using same logic as filteredModules useMemo)
      const assignedModuleIds = roleModuleAssignments
        .filter((ra) => ra.roleLocationId === currentRoleLocationId)
        .map((ra) => ra.appProductModuleId);

      const relevantModules = allPossibleModules.filter((m) =>
        assignedModuleIds.includes(m.appProductModuleId),
      );

      // 2. Get menus ONLY for these relevant modules
      const locationMenus = allPossibleMenus.filter(
        (m) => m.appClientLocationId === clientLocationId,
      );

      const relevantMenuKeys = relevantModules.flatMap((module) => {
        const moduleMenus = getMenusByModule(
          locationMenus,
          module.appProductModuleId,
        );
        return moduleMenus.map((m) => m.appProductMenuId.toString());
      });

      // 3. Compare selectedKeys vs relevantMenuKeys
      const hasAll =
        relevantMenuKeys.length > 0 &&
        relevantMenuKeys.every((k) => selectedKeys.includes(k));

      setIsAllSelected(hasAll);
    },
    [
      selectedRoleData,
      queryClient,
      loginAccessToken,
      roleMenuAssignments,
      roleModuleAssignments,
      allPossibleModules,
      allPossibleMenus,
    ],
  );

  const filteredModules = useMemo(() => {
    if (!activeLocation || !roleModuleAssignments.length) return [];

    const assignedModuleIds = roleModuleAssignments
      .filter((ra) => ra.roleLocationId === activeLocation.roleLocationId)
      .map((ra) => ra.appProductModuleId);

    return allPossibleModules.filter((m) =>
      assignedModuleIds.includes(m.appProductModuleId),
    );
  }, [allPossibleModules, activeLocation, roleModuleAssignments]);

  const handleCloseModal = () => {
    setOpenForm(false);
    setSelectedRoleData(null);
    setActiveLocation(null);
    setCheckedKeys([]);
    setActiveModule(null);
    setExpandedKeys([]);
    setIsAllSelected(false);
  };

  const { mutate: saveItem, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/ADM/RoleMenu/SaveAll", {
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
      await queryClient.invalidateQueries(["allRoleMenu"]);
      const latestAssignments = await queryClient.fetchQuery({
        queryKey: ["allRoleMenu", loginAccessToken],
      });

      if (activeLocation) {
        const currentRoleLocationId = activeLocation.roleLocationId;
        const allParentIds = new Set(
          allPossibleMenus
            .map((m) => m.loginMenu.parentAppMenuId)
            .filter((id) => id !== null && id !== 0),
        );

        const selectedKeys = latestAssignments
          .filter(
            (assignment) => assignment.roleLocationId === currentRoleLocationId,
          )
          .map((assignment) => assignment.appProductMenuId.toString());

        // Filter out parent IDs so the Tree doesn't auto-check ALL children
        const leafKeys = selectedKeys.filter(
          (key) => !allParentIds.has(parseInt(key)),
        );

        setCheckedKeys(leafKeys);
      }

      toast.success(result?.message);
      handleCloseModal();
    },
    onError: (err) => toast.error(err.message),
    retry: false,
  });

  const handleAddItem = () => {
    if (!permission(canEdit, "No permission to edit role menus")) return;
    if (!activeLocation) return toast.error("Please select a location first.");

    const currentRoleLocationId = activeLocation.roleLocationId;

    // Expand selection to include all parents/ancestors
    // This ensures that if a child is selected, its parent categories also get assigned
    // so they show up in the sidebar.
    const allRequiredKeysSet = new Set();
    checkedKeys.forEach((key) => {
      let currentId = parseInt(key);
      while (currentId > 0) {
        if (allRequiredKeysSet.has(currentId)) break;
        allRequiredKeysSet.add(currentId);
        const menu = allPossibleMenus.find(
          (m) => m.appProductMenuId === currentId,
        );
        currentId = menu?.loginMenu?.parentAppMenuId || 0;
      }
    });

    const finalCheckedKeys = Array.from(allRequiredKeysSet);
    const checkedSet = new Set(finalCheckedKeys);

    const allExistingAssignments = (
      queryClient.getQueryData(["allRoleMenu", loginAccessToken]) ||
      roleMenuAssignments
    ).filter(
      (assignment) => assignment.roleLocationId === currentRoleLocationId,
    );

    const lstRequest = finalCheckedKeys.map((id) => {
      const appProductMenuId = id;

      const existing = allExistingAssignments.find(
        (a) => a.appProductMenuId === appProductMenuId,
      );

      return {
        roleMenuId: existing?.roleMenuId || 0,
        roleLocationId: currentRoleLocationId,
        appProductMenuId,
        rowVersionLong: existing?.rowVersionLong || 0,
      };
    });

    const lstDeletedRequest = allExistingAssignments
      .filter((a) => !checkedSet.has(a.appProductMenuId))
      .map((a) => ({
        roleMenuId: a.roleMenuId,
        roleLocationId: a.roleLocationId,
        appProductMenuId: a.appProductMenuId,
        rowVersionLong: a.rowVersionLong,
      }));

    const finalPayload = {
      lstRequest,
      lstDeletedRequest,
    };

    saveItem(finalPayload);
  };

  const getMenusByModule = (menus, moduleId) => {
    return menus.filter((m) => m.loginMenu.appProductModuleId === moduleId);
  };

  const moduleTreeData = useMemo(() => {
    if (!activeLocation || !activeModule) return [];

    const locationMenus = allPossibleMenus.filter(
      (m) => m.appClientLocationId === activeLocation.clientLocationId,
    );

    const filteredMenus = getMenusByModule(locationMenus, activeModule);

    return buildTreeData(filteredMenus, null);
  }, [allPossibleMenus, activeLocation, activeModule]);

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

  const filteredData = roleList.filter((item) => {
    const search = globalSearch.toLowerCase();
    return (
      item.sr?.toString().includes(search) ||
      item.roleName?.toLowerCase().includes(search) ||
      item.totalLocations?.toString().includes(search)
    );
  });

  const handleModuleClick = (moduleId) => {
    setExpandedKeys([]);
    setActiveModule(moduleId);
  };

  useCloseOnEscape(openForm, handleCloseModal);

  return (
    <>
      {/* Breadcrumb */}
      <div
        className={`mb-3 flex flex-col md:flex-col lg:flex-row items-start sm:items-center justify-between rounded-full px-4 sm:px-3 sm:pl-5 lg:pb-0 transition-colors duration-200 ${
          isDarkMode ? "bg-[#141025]" : "bg-gray-100"
        }`}
      >
        <Breadcrumb />
      </div>

      {/* Table */}
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
              if (!permission(canEdit, "No permission to edit role menus"))
                return;
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
                // Find first module assigned to this role/location
                const assignedVals = roleModuleAssignments
                  .filter(
                    (ra) => ra.roleLocationId === firstLocation.roleLocationId,
                  )
                  .map((ra) => ra.appProductModuleId);

                const firstValidModule = allPossibleModules.find((m) =>
                  assignedVals.includes(m.appProductModuleId),
                );

                const firstModuleId = firstValidModule
                  ? firstValidModule.appProductModuleId
                  : null;

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

      {/* Popup */}
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
                onChange={(value) => handleLocationChange(value)}
              />
            </div>
          </div>

          {/* Module List and Tree View */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            {/* LEFT SIDE MODULE LIST */}
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

            {/* RIGHT SIDE TREE VIEW */}
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
              ) : (
                <>
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
                      const allKeys = getAllKeys(moduleTreeData);
                      setIsAllSelected(
                        newCheckedKeysForModule.length === allKeys.length &&
                          allKeys.length > 0,
                      );
                    }}
                    expandedKeys={expandedKeys}
                    onExpand={(newExpandedKeys) =>
                      setExpandedKeys(newExpandedKeys)
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Action Buttons  */}
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

export default RoleMenuPage;
