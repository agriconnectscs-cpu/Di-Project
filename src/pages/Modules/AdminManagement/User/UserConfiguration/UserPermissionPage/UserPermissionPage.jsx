import { Tree } from "antd";
import toast from "react-hot-toast";
import { Search, ShieldOff } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../store/authSlice";

import { useTheme } from "../../../../../../ThemeProvider";
import { useGetAuth } from "../../../../../../hooks/useGetAuth";
import { handleApiResponse } from "../../../../../../utils/handleApiResponse";

import CustomTable from "../../../../../../components/CustomTable";
import useGlobalFilter from "../../../../../../hooks/useGlobalFilter";
import ActionButtons from "../../../../../../components/ActionButtons";
import Breadcrumb from "../../../../../../components/common/Breadcrumb";

import PermissionSkeleton from "./components/PermissionSkeleton";
import PermissionHeader from "./components/PermissionHeader";
import ModulesSidebar from "./components/ModulesSidebar";
import TreeHeader from "./components/TreeHeader";
// Imports ENd-------

const UserPermissionPage = () => {
  const queryClient = useQueryClient();
  const { isDarkMode } = useTheme();
  const { loginAccessToken } = useGetAuth();
  const authData = useSelector(selectUser);

  // UI State
  const [globalSearch, setGlobalSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [parentPermissionInfo, setParentPermissionInfo] = useState({
    id: 0,
    rowVersion: 0,
  });

  const [sessionKey, setSessionKey] = useState(0);

  // Tree states
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const treeContainerRef = useRef(null);
  const sessionBaselineRef = useRef(null);
  const prevUserIdRef = useRef(null);

  // Fetch Role-Menu assignments to filter menus
  const { data: roleMenuAssignmentsList = [] } = useQuery({
    queryKey: ["allRoleMenu", loginAccessToken],
    enabled: !!loginAccessToken && !!selectedUserRow,
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
      }));
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Extract and filter menus from auth data based on role assignments
  const masterMenus = useMemo(() => {
    const clientLocationMenus = authData?.data?.clientLocationMenus || [];
    const baseMenus = Array.from(
      new Map(
        clientLocationMenus
          .map((item) => item.loginMenu)
          .filter(Boolean)
          .map((menu) => [menu.appProductMenuId, menu]),
      ).values(),
    );

    if (!selectedUserRow || !roleMenuAssignmentsList.length) {
      return baseMenus;
    }

    // Filter by role-location assignments
    const assignedMenuIds = roleMenuAssignmentsList
      .filter((ra) => ra.roleLocationId === selectedUserRow.roleLocationId)
      .map((ra) => ra.appProductMenuId);

    return baseMenus.filter((m) =>
      assignedMenuIds.includes(m.appProductMenuId),
    );
  }, [authData, selectedUserRow, roleMenuAssignmentsList]);

  // Fetch Role-Module assignments to filter sidebar
  const { data: roleModuleAssignments = [] } = useQuery({
    queryKey: ["roleModuleAssignments", loginAccessToken],
    enabled: !!loginAccessToken && !!selectedUserRow,
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

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Modules list - Filtered
  const allModules = useMemo(() => {
    if (!selectedUserRow || !roleModuleAssignments.length) return [];

    const assignedModuleIds = roleModuleAssignments
      .filter((ra) => ra.roleLocationId === selectedUserRow.roleLocationId)
      .map((ra) => ra.appProductModuleId);

    const baseModules = authData?.data?.loginUserModules || [];
    return baseModules.filter((m) =>
      assignedModuleIds.includes(m.appProductModuleId),
    );
  }, [authData, selectedUserRow, roleModuleAssignments]);

  // Fetch Users List
  const { data: userRoleList = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["userPermissionList", loginAccessToken],
    enabled: !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch("/api/ADM/UserPermission/GetList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify({}),
      });

      const result = await handleApiResponse(res, "Failed to fetch user list");
      return result?.data || [];
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Fetch permissions for selected user
  const {
    data: apiResponse,
    isFetching: isFetchingPermissions,
    isSuccess: isFetchPermissionsSuccess,
  } = useQuery({
    queryKey: [
      "userPermissions",
      selectedUserRow?.userId,
      selectedUserRow?.roleLocationId,
    ],
    enabled: !!selectedUserRow && !!loginAccessToken,
    queryFn: async () => {
      const res = await fetch(
        `/api/ADM/UserPermission/GetUserPermissionAndAction?RoleLocationId=${selectedUserRow.roleLocationId}&UserId=${selectedUserRow.userId}`,
        {
          headers: {
            Authorization: `Bearer ${loginAccessToken}`,
          },
        },
      );

      const result = await handleApiResponse(res);
      return result.data;
    },

    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Build API permission map
  const buildApiPermissionMap = useMemo(() => {
    const map = new Map();
    if (apiResponse?.userPermissionActionRequests) {
      apiResponse.userPermissionActionRequests.forEach((p) => {
        const actionId = String(
          p.appProductMenuActionId || p.appActionTypeId || 0,
        );
        if (actionId !== "0") {
          map.set(actionId, p);
        }
      });
    }
    return map;
  }, [apiResponse]);

  // Generate initial permissions from menus + API data
  const generateInitialPermissions = (menus, apiMap, parentId) => {
    return menus.flatMap((menu) => {
      const menuActions = menu.menuActions || [];
      return menuActions.map((action) => {
        const actionId = String(action.appProductMenuActionId);
        const apiMatch = apiMap.get(actionId);

        const isDeniedValue =
          apiMatch?.isDenied === true ||
          String(apiMatch?.isDenied) === "1" ||
          String(apiMatch?.isDenied).toLowerCase() === "true";

        return {
          userPermissionActionId: apiMatch?.userPermissionActionId || 0,
          userPermissionId: apiMatch?.userPermissionId || parentId || 0,
          appProductMenuId: menu.appProductMenuId,
          appMenuDisplayName: menu.appMenuDisplayName || menu.appMenuName,
          appProductMenuActionId: action.appProductMenuActionId,
          appActionTypeName: action.actionName,
          appActionTypeId: action.appActionTypeId,
          isDenied: isDeniedValue,
          rowVersionLong: Number(apiMatch?.rowVersionLong || 0),
        };
      });
    });
  };

  useEffect(() => {
    if (
      !isFetchPermissionsSuccess ||
      isFetchingPermissions ||
      !masterMenus.length ||
      !selectedUserRow
    )
      return;

    const currentUserId = selectedUserRow?.userId;
    const isNewUser = prevUserIdRef.current !== currentUserId;
    const isPostSave = !sessionBaselineRef.current;

    if (!isNewUser && !isPostSave) return;

    prevUserIdRef.current = currentUserId;

    const initialPermissions = generateInitialPermissions(
      masterMenus,
      buildApiPermissionMap,
      apiResponse?.userPermissionId || 0,
    );
    setPermissions(initialPermissions);

    sessionBaselineRef.current = JSON.stringify(initialPermissions);

    setParentPermissionInfo({
      id: Number(
        apiResponse?.userPermissionId || selectedUserRow?.userPermissionId || 0,
      ),
      rowVersion: Number(apiResponse?.rowVersionLong || 0),
    });

    const isCurrentModuleValid = allModules.some(
      (m) => m.appProductModuleId === activeModule,
    );
    if (allModules.length > 0 && (!activeModule || !isCurrentModuleValid)) {
      setActiveModule(allModules[0].appProductModuleId);
    }

    setIsEditing(true);
  }, [
    apiResponse,
    isFetchPermissionsSuccess,
    isFetchingPermissions,
    masterMenus,
    selectedUserRow,
    buildApiPermissionMap,
    allModules,
    activeModule,
    sessionKey,
  ]);

  // Scroll menus to top when module changes
  useEffect(() => {
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollTop = 0;
    }
  }, [activeModule]);

  // Reset state when user cleared
  useEffect(() => {
    if (!selectedUserRow) {
      setPermissions([]);
      setParentPermissionInfo({ id: 0, rowVersion: 0 });
      setActiveModule(null);
      setIsEditing(false);
      setExpandedKeys([]);
      sessionBaselineRef.current = null;
      prevUserIdRef.current = null;
    }
  }, [selectedUserRow]);

  // Save Mutation
  const { mutate: savePermissions, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/ADM/UserPermission/Save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginAccessToken}`,
        },
        body: JSON.stringify(payload),
      });
      return handleApiResponse(res, "Failed to save permissions");
    },

    onSuccess: (result) => {
      toast.success(result?.message);

      queryClient.invalidateQueries({ queryKey: ["userPermissionList"] });
      queryClient.invalidateQueries({
        queryKey: [
          "userPermissions",
          selectedUserRow?.userId,
          selectedUserRow?.roleLocationId,
        ],
      });

      sessionBaselineRef.current = null;
      setPermissions([]);
      setSessionKey((prev) => prev + 1);
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!selectedUserRow || !sessionBaselineRef.current) return;

    const baseline = JSON.parse(sessionBaselineRef.current);
    const updatedOrNew = [];
    const removed = [];
    const processedKeys = new Set();

    const baselineMap = new Map();
    baseline.forEach((b) => {
      baselineMap.set(`${b.appProductMenuId}-${b.appProductMenuActionId}`, b);
    });

    permissions.forEach((p) => {
      const compositeKey = `${p.appProductMenuId}-${p.appProductMenuActionId}`;
      const actionIdStr = String(p.appProductMenuActionId);

      const apiMatch = buildApiPermissionMap.get(actionIdStr);
      const baselineItem = baselineMap.get(compositeKey);
      const wasInitiallyDenied = baselineItem?.isDenied ?? false;

      if (processedKeys.has(compositeKey)) return;

      if (Boolean(p.isDenied) !== Boolean(wasInitiallyDenied)) {
        processedKeys.add(compositeKey);

        const record = {
          userPermissionActionId: Number(
            apiMatch?.userPermissionActionId || p.userPermissionActionId || 0,
          ),
          userPermissionId: Number(parentPermissionInfo.id || 0),
          appProductMenuId: Number(p.appProductMenuId || 0),
          appProductMenuActionId: Number(p.appProductMenuActionId || 0),
          appActionTypeId: Number(p.appActionTypeId || 0),
          isDenied: Boolean(p.isDenied),
          rowVersionLong: Number(
            apiMatch?.rowVersionLong || p.rowVersionLong || 0,
          ),
        };

        if (p.isDenied) {
          updatedOrNew.push(record);
        } else if (apiMatch) {
          removed.push({ ...record, isDenied: true });
        }
      } else if (apiMatch) {
        processedKeys.add(compositeKey);
      }
    });

    buildApiPermissionMap.forEach((apiP) => {
      const ck = `${apiP.appProductMenuId}-${apiP.appProductMenuActionId}`;
      if (!processedKeys.has(ck)) {
        removed.push({
          userPermissionActionId: Number(apiP.userPermissionActionId || 0),
          userPermissionId: Number(parentPermissionInfo.id || 0),
          appProductMenuId: Number(apiP.appProductMenuId || 0),
          appProductMenuActionId: Number(apiP.appProductMenuActionId || 0),
          appActionTypeId: Number(apiP.appActionTypeId || 0),
          isDenied: true,
          rowVersionLong: Number(apiP.rowVersionLong || 0),
        });
      }
    });

    if (updatedOrNew.length === 0 && removed.length === 0) {
      toast("No changes detected");
      return;
    }

    const payload = {
      userPermissionId: Number(parentPermissionInfo.id || 0),
      roleLocationId: Number(selectedUserRow.roleLocationId || 0),
      userId: Number(selectedUserRow.userId || 0),
      rowVersionLong: Number(parentPermissionInfo.rowVersion || 0),
      userPermissionActionRequests: updatedOrNew,
      deletedUserPermissionActionRequests: removed,
    };

    savePermissions(payload);
  };

  // Toggle all permissions for the currently active module
  const handleSelectAllMenus = (allowAll) => {
    if (!activeModule) return;
    const moduleId = String(activeModule);

    setPermissions((prev) =>
      prev.map((p) => {
        const menu = masterMenus.find(
          (m) => m.appProductMenuId === p.appProductMenuId,
        );
        if (menu && String(menu.appProductModuleId) === moduleId) {
          return { ...p, isDenied: !allowAll };
        }
        return p;
      }),
    );
  };

  // --- Tree Logic ---
  const currentPermissionsMap = useMemo(() => {
    const map = new Map();
    permissions.forEach((p) => {
      map.set(`${p.appProductMenuId}-${p.appProductMenuActionId}`, p);
    });
    return map;
  }, [permissions]);

  const hasChanges = useMemo(() => {
    if (!sessionBaselineRef.current) return false;
    const baseline = JSON.parse(sessionBaselineRef.current);
    return permissions.some((p, index) => {
      return Boolean(p.isDenied) !== Boolean(baseline[index]?.isDenied);
    });
  }, [permissions]);

  const treeData = useMemo(() => {
    if (!activeModule) return [];

    const searchLower = treeSearch.toLowerCase();
    const moduleId = String(activeModule);
    const moduleMenus = masterMenus.filter(
      (m) => String(m.appProductModuleId) === moduleId,
    );

    const buildTree = (menus, parentId = null) => {
      return menus
        .filter((m) => {
          if (parentId === null) {
            return m.parentAppMenuId === null || m.parentAppMenuId === 0;
          }
          return m.parentAppMenuId === parentId;
        })
        .sort((a, b) => (a.appMenuSeqNo || 0) - (b.appMenuSeqNo || 0))
        .map((menu) => {
          // Recursive call for sub-menus
          const subMenuNodes = buildTree(menus, menu.appProductMenuId);

          // Build action nodes for this menu
          const menuActions = menu.menuActions || [];
          const actionNodes = menuActions
            .map((action) => {
              const key = `${menu.appProductMenuId}-${action.appProductMenuActionId}`;
              const p = currentPermissionsMap.get(key);

              const baseline = sessionBaselineRef.current
                ? JSON.parse(sessionBaselineRef.current)
                : [];
              const pIndex = permissions.findIndex(
                (perm) =>
                  `${perm.appProductMenuId}-${perm.appProductMenuActionId}` ===
                  key,
              );
              const wasInitiallyDenied =
                pIndex !== -1 ? baseline[pIndex]?.isDenied : false;
              const isCurrentlyDenied =
                p &&
                (p.isDenied === true ||
                  String(p.isDenied) === "1" ||
                  String(p.isDenied).toLowerCase() === "true");

              const isChanged =
                Boolean(wasInitiallyDenied) !== Boolean(isCurrentlyDenied);

              return {
                title: (
                  <div className="flex items-center justify-between pr-2 py-1">
                    <span
                      className={`text-[11px] font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {action.actionName}
                    </span>

                    <div className="flex items-center gap-2">
                      {isChanged && (
                        <span className="text-[7px] px-3 rounded-full bg-amber-500/20 text-amber-500 font-black uppercase border border-amber-500/20 shadow-sm tracking-widest">
                          Changed
                        </span>
                      )}
                      <span
                        className={`text-[8px] px-3 rounded-full font-bold uppercase tracking-widest ${
                          isCurrentlyDenied
                            ? "bg-red-500/10 text-red-500/90 border border-red-500/10"
                            : "bg-emerald-500/10 text-emerald-500/90 border border-emerald-500/10"
                        }`}
                      >
                        {isCurrentlyDenied ? "Denied" : "Allowed"}
                      </span>
                    </div>
                  </div>
                ),
                key: `action-${key}`,
                isLeaf: true,
                rawTitle: action.actionName,
              };
            })
            .filter((node) => {
              if (!searchLower) return true;
              return (
                node.rawTitle.toLowerCase().includes(searchLower) ||
                menu.appMenuDisplayName?.toLowerCase().includes(searchLower)
              );
            });

          // Combine sub-menus and actions
          // If a menu has child menus, don't show its own actions
          const finalActionNodes = subMenuNodes.length > 0 ? [] : actionNodes;
          const children = [...subMenuNodes, ...finalActionNodes];

          // If searching and this menu + its children don't match, hide it
          if (
            searchLower &&
            children.length === 0 &&
            !menu.appMenuDisplayName?.toLowerCase().includes(searchLower)
          ) {
            return null;
          }

          // Statistics for the menu (including nested actions)
          const getActionStats = (nodes) => {
            let total = 0;
            let denied = 0;
            nodes.forEach((node) => {
              if (node.isLeaf) {
                total++;
                const key = node.key.replace("action-", "");
                const p = currentPermissionsMap.get(key);
                if (
                  p &&
                  (p.isDenied === true ||
                    String(p.isDenied) === "1" ||
                    String(p.isDenied).toLowerCase() === "true")
                ) {
                  denied++;
                }
              } else if (node.children) {
                const stats = getActionStats(node.children);
                total += stats.total;
                denied += stats.denied;
              }
            });
            return { total, denied };
          };

          const { total: totalActions, denied: deniedActions } =
            getActionStats(children);
          const isFullyDenied =
            totalActions > 0 && deniedActions === totalActions;
          const isFullyAllowed = totalActions > 0 && deniedActions === 0;

          return {
            title: (
              <div className="flex items-center justify-between w-full pr-2">
                <span
                  className={`text-[13px] font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                >
                  {menu.appMenuDisplayName}
                </span>
                {totalActions > 0 && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tight ${
                      isFullyDenied
                        ? isDarkMode
                          ? "text-red-400/50"
                          : "text-red-500/50"
                        : isFullyAllowed
                          ? isDarkMode
                            ? "text-emerald-400/50"
                            : "text-emerald-500/50"
                          : isDarkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                    }`}
                  >
                    {isFullyAllowed
                      ? `${totalActions}/${totalActions} allowed`
                      : `${deniedActions}/${totalActions} denied`}
                  </span>
                )}
              </div>
            ),
            key: `menu-${menu.appProductMenuId}`,
            children: children.length > 0 ? children : undefined,
            rawTitle: menu.appMenuDisplayName,
          };
        })
        .filter(Boolean);
    };

    return buildTree(moduleMenus);
  }, [
    masterMenus,
    currentPermissionsMap,
    treeSearch,
    activeModule,
    isDarkMode,
    permissions,
    sessionBaselineRef,
  ]);

  const checkedKeys = useMemo(() => {
    const keys = [];
    const deniedActionKeys = new Set();

    permissions.forEach((p) => {
      const isDenied =
        p.isDenied === true ||
        String(p.isDenied) === "1" ||
        String(p.isDenied).toLowerCase() === "true";

      if (isDenied) {
        const key = `action-${p.appProductMenuId}-${p.appProductMenuActionId}`;
        keys.push(key);
        deniedActionKeys.add(key);
      }
    });

    // Recursively check if all actions under a menu (including submenus) are denied
    const isMenuFullyDenied = (menuId) => {
      // Sub-menus
      const subMenus = masterMenus.filter((m) => m.parentAppMenuId === menuId);
      const hasSubMenus = subMenus.length > 0;

      if (hasSubMenus) {
        return subMenus.every((sm) => isMenuFullyDenied(sm.appProductMenuId));
      }

      // Direct actions (only if no sub-menus)
      const menuActions =
        masterMenus.find((m) => m.appProductMenuId === menuId)?.menuActions ||
        [];
      const hasDirectActions = menuActions.length > 0;

      if (!hasDirectActions) return false;
      return menuActions.every((action) =>
        deniedActionKeys.has(
          `action-${menuId}-${action.appProductMenuActionId}`,
        ),
      );
    };

    masterMenus.forEach((menu) => {
      if (isMenuFullyDenied(menu.appProductMenuId)) {
        keys.push(`menu-${menu.appProductMenuId}`);
      }
    });

    return keys;
  }, [permissions, masterMenus]);

  const handleCheck = (checkedKeysValue) => {
    const checkedSet = new Set(checkedKeysValue);

    const getAllActionKeys = (nodes) => {
      let keys = [];
      nodes.forEach((node) => {
        if (node.isLeaf) {
          keys.push(node.key);
        } else if (node.children) {
          keys = keys.concat(getAllActionKeys(node.children));
        }
      });
      return keys;
    };

    const visibleActionKeys = new Set(getAllActionKeys(treeData));

    setPermissions((prev) =>
      prev.map((p) => {
        const key = `action-${p.appProductMenuId}-${p.appProductMenuActionId}`;
        if (visibleActionKeys.has(key)) {
          const isChecked = checkedSet.has(key);
          return { ...p, isDenied: isChecked };
        }
        return p;
      }),
    );
  };

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const handleExpandAll = (expand) => {
    if (expand) {
      const keys = [];
      const getKeys = (nodes) => {
        nodes.forEach((node) => {
          keys.push(node.key);
          if (node.children) getKeys(node.children);
        });
      };
      getKeys(treeData);
      setExpandedKeys(keys);
    } else {
      setExpandedKeys([]);
    }
    setAutoExpandParent(false);
  };

  const filteredUsers = useGlobalFilter(userRoleList, globalSearch, [
    "appUserName",
    "roleName",
    "locationName",
  ]);

  const columns = [
    {
      title: "Sr.",
      dataIndex: "rno",
      width: 60,
      align: "center",
      render: (index) => index + 1,
    },
    {
      title: "User Name",
      dataIndex: "appUserName",
      className: "font-medium",
      sorter: (a, b) => a.appUserName.localeCompare(b.appUserName),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      render: (role) => (
        <span
          className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
            isDarkMode
              ? "bg-purple-500/10 text-purple-400"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {role}
        </span>
      ),
      sorter: (a, b) => a.roleName.localeCompare(b.roleName),
    },
    {
      title: "Location",
      dataIndex: "locationName",
      className: "text-gray-500",
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <ActionButtons
          onSettings={() => {
            setSelectedUserRow(record);
            setIsEditing(true);
          }}
          isSettingsLoading={
            isFetchingPermissions &&
            selectedUserRow?.userId === record.userId &&
            selectedUserRow?.roleLocationId === record.roleLocationId
          }
          darkMode={isDarkMode}
        />
      ),
    },
  ];

  return (
    <div className="p-1">
      {!isEditing ? (
        <div>
          <div
            className={`mb-3 flex flex-col md:flex-col lg:flex-row items-start sm:items-center justify-between rounded-full px-4 sm:px-3 sm:pl-5 lg:pb-0 transition-colors duration-200 ${
              isDarkMode ? "bg-[#141025]" : "bg-gray-100"
            }`}
          >
            <Breadcrumb />
          </div>

          <CustomTable
            dataSource={filteredUsers}
            columns={columns}
            loading={isLoadingUsers}
            rowKey={(record) => `${record.userId}-${record.roleLocationId}`}
            isDarkMode={isDarkMode}
            globalSearch={globalSearch}
            onSearchChange={setGlobalSearch}
            searchPlaceholder="Search users by name, role or location..."
          />
        </div>
      ) : (
        <div
          key="edit"
          className={`rounded-xl border p-4 sm:p-4 shadow-2xl transition-all duration-200 h-[calc(100vh-130px)] overflow-hidden flex flex-col ${
            isDarkMode
              ? "bg-[#0d0c1a] border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          <PermissionHeader
            isDarkMode={isDarkMode}
            selectedUserRow={selectedUserRow}
            isSaving={isSaving}
            isFetchingPermissions={isFetchingPermissions}
            onSave={handleSave}
            hasChanges={hasChanges}
            onBack={() => {
              setIsEditing(false);
              setSelectedUserRow(null);
              setActiveModule(null);
            }}
          />

          {isFetchingPermissions ? (
            <PermissionSkeleton isDarkMode={isDarkMode} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-3 flex-1 overflow-hidden pr-2">
              {/* Modules Sidebar */}
              <ModulesSidebar
                allModules={allModules}
                activeModule={activeModule}
                isDarkMode={isDarkMode}
                onModuleChange={setActiveModule}
              />

              {/* Tree Container */}
              <div
                ref={treeContainerRef}
                className={`flex-1 p-5 sm:p-6 rounded-xl border min-h-full overflow-y-auto custom-scrollbar ${
                  isDarkMode
                    ? "bg-[#141025] border-gray-800"
                    : "bg-white border-gray-200"
                }`}
              >
                <TreeHeader
                  isDarkMode={isDarkMode}
                  activeModule={activeModule}
                  allModules={allModules}
                  treeDataLength={treeData.length}
                  expandedKeysLength={expandedKeys.length}
                  onExpandAll={handleExpandAll}
                  onSelectAll={handleSelectAllMenus}
                  treeSearch={treeSearch}
                  onTreeSearchChange={setTreeSearch}
                />

                {treeData.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center py-20 rounded-xl border border-dashed ${
                      isDarkMode
                        ? "border-gray-800 bg-white/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Search
                      size={32}
                      className="text-gray-600 mb-2 opacity-50"
                    />
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    >
                      No permissions found for this module.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl border ${
                      isDarkMode
                        ? "bg-[#0d0c1a] border-gray-800"
                        : "bg-gray-50 border-gray-200"
                    } min-h-75`}
                  >
                    <Tree
                      checkable
                      onExpand={onExpand}
                      expandedKeys={expandedKeys}
                      autoExpandParent={autoExpandParent}
                      onCheck={handleCheck}
                      checkedKeys={checkedKeys}
                      treeData={treeData}
                      className={`custom-tree text-base ${isDarkMode ? "dark-tree" : ""}`}
                      selectable={true}
                      onSelect={(selectedKeys, info) => {
                        const { key } = info.node;
                        if (!info.node.isLeaf) {
                          if (expandedKeys.includes(key)) {
                            onExpand(expandedKeys.filter((k) => k !== key));
                          } else {
                            onExpand([...expandedKeys, key]);
                          }
                        } else {
                          const isChecked = checkedKeys.includes(key);
                          let newCheckedKeys;
                          if (isChecked) {
                            newCheckedKeys = checkedKeys.filter(
                              (k) => k !== key,
                            );
                          } else {
                            newCheckedKeys = [...checkedKeys, key];
                          }

                          const getAllKeysInTree = (nodes) => {
                            let keys = [];
                            nodes.forEach((node) => {
                              keys.push(node.key);
                              if (node.children) {
                                keys = keys.concat(
                                  getAllKeysInTree(node.children),
                                );
                              }
                            });
                            return keys;
                          };

                          const currentModuleKeys = getAllKeysInTree(treeData);

                          const moduleCheckedKeys = newCheckedKeys.filter((k) =>
                            currentModuleKeys.includes(k),
                          );
                          handleCheck(moduleCheckedKeys);
                        }
                      }}
                      blockNode
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-tree .ant-tree-treenode {
          width: 100%;
          padding: 2px 8px !important;
          margin-bottom: 2px;
          transition: all 0.2s ease;
          display: flex !important;
          align-items: center !important;
          border-radius: 8px;
          cursor: pointer;
        }

        .custom-tree .ant-tree-treenode:hover {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"} !important;
        }

        .custom-tree .ant-tree-treenode:not(.ant-tree-treenode-leaf) {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#f9fafb"};
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"};
          padding: 8px 12px !important;
          margin-bottom: 6px;
          margin-top: 4px;
        }

        .custom-tree .ant-tree-treenode-leaf {
          width: 100% !important;
          padding: 1px 8px !important;
        }

        .custom-tree .ant-tree-switcher {
          color: ${isDarkMode ? "#4b5563" : "#9ca3af"};
          width: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .custom-tree .ant-tree-node-content-wrapper {
          flex: 1 !important;
          display: flex !important;
          background: transparent !important;
          padding: 2px 8px !important;
          transition: none !important;
        }

        .custom-tree .ant-tree-node-content-wrapper:hover {
          background: transparent !important;
        }

        .custom-tree .ant-tree-node-content-wrapper .ant-tree-title {
          flex: 1 !important;
        }

        .custom-tree .ant-tree-checkbox {
          margin-inline-end: 2px !important;
        }

        .custom-tree .ant-tree-checkbox-inner {
          width: 18px !important;
          height: 18px !important;
          border-radius: 5px !important;
          background-color: ${isDarkMode ? "#1a1129" : "#fff"} !important;
          border-color: ${isDarkMode ? "#3b1f5a" : "#d1d5db"} !important;
        }

        .custom-tree .ant-tree-checkbox-checked .ant-tree-checkbox-inner,
        .custom-tree .ant-tree-checkbox-indeterminate .ant-tree-checkbox-inner {
          background-color: #9333ea !important;
          border-color: #9333ea !important;
        }

        .custom-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
          background-color: transparent !important;
          color: inherit !important;
        }

        .dark-tree {
          color: #d1d5db !important;
        }
      `}</style>
    </div>
  );
};

export default UserPermissionPage;
