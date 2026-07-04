import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice";
import { usePermissionModal } from "../../context/PermissionModalContext";
// Imports End------

export const usePermission = () => {
  const { openPermissionModal } = usePermissionModal();

  // Logged-in user data from Redux
  const user = useSelector(selectUser);

  //  User menus assigned after login
  const loginUserMenus = useMemo(() => {
    return user?.data?.loginUserMenus || [];
  }, [user]);

  //  Permission actions (deny-based system)
  const loginAppUserPermissionActions = useMemo(() => {
    return user?.data?.loginAppUserPermissionActions || [];
  }, [user]);

  // Action type
  const ACTION_TYPES = {
    NEW: 1,
    EDIT: 2,
    DELETE: 3,
    VIEW: 4,
    POST: 5,
    UNPOST: 6,
    IMPORT: 7,
  };

  // Clean URL (remove / and lowercase)
  const normalizePath = (path) =>
    path.replace(/^\//, "").replace(/\/$/, "").toLowerCase();

  // Find menu by URL
  const getMenuByPath = (targetURL) => {
    if (!targetURL) return null;
    const cleanPath = normalizePath(targetURL);

    let bestMatch = null;
    let maxLength = -1;

    for (const m of loginUserMenus) {
      if (!m.appMenuTargetURL) continue;
      const menuPath = normalizePath(m.appMenuTargetURL);

      // Exact match
      if (cleanPath === menuPath) {
        return m;
      }

      // Prefix match (choose longest match)
      if (cleanPath.startsWith(menuPath + "/")) {
        if (menuPath.length > maxLength) {
          bestMatch = m;
          maxLength = menuPath.length;
        }
      }
    }

    return bestMatch;
  };

  // Check permission for action
  const hasMenuAction = (
    menuIdOrPath,
    actionTypeId,
    showModal = true,
    controlName = undefined,
  ) => {
    if (!menuIdOrPath || !actionTypeId) return false;

    let menu;

    // Find menu by id or path
    if (typeof menuIdOrPath === "number") {
      menu = loginUserMenus.find((m) => m.appProductMenuId === menuIdOrPath);
    } else {
      menu = getMenuByPath(menuIdOrPath);
    }

    // No menu = no access
    if (!menu) {
      if (showModal) {
        openPermissionModal();
      }
      return false;
    }

    // Try to get exact action ID from master menu
    let exactActionIdStr = null;
    const clientLocationMenus = user?.data?.clientLocationMenus || [];
    const masterMenu =
      clientLocationMenus.find(
        (item) => item.loginMenu?.appProductMenuId === menu.appProductMenuId,
      )?.loginMenu || menu;

    if (masterMenu?.menuActions && Array.isArray(masterMenu.menuActions)) {
      const matchingAction = masterMenu.menuActions.find(
        (ma) => ma.appActionTypeId === actionTypeId,
      );
      if (matchingAction) {
        exactActionIdStr = String(matchingAction.appProductMenuActionId);
      }
    }

    // Check if denied
    const isDenied = loginAppUserPermissionActions.some((action) => {
      const menuMatch = action.appProductMenuId === menu.appProductMenuId;

      const actionIdStr = String(action.appProductMenuActionId);
      const actionTypeStr = String(actionTypeId);

      const typeMatch = exactActionIdStr
        ? actionIdStr === exactActionIdStr ||
          action.appActionTypeId === actionTypeId
        : actionIdStr.endsWith(actionTypeStr) ||
          action.appActionTypeId === actionTypeId ||
          String(action.appActionTypeId).endsWith(actionTypeStr);

      const controlMatch =
        controlName !== undefined
          ? action.actionControlName === controlName
          : true;

      return menuMatch && typeMatch && controlMatch && action.isDenied;
    });

    const hasPerm = !isDenied;

    // Show modal if not allowed
    if (!hasPerm && showModal) {
      openPermissionModal();
    }

    return hasPerm;
  };

  // Get all actions (true/false) for a menu
  const getMenuActions = (menuId) => {
    const menu = loginUserMenus.find(
      (m) => m.appProductMenuId === Number(menuId),
    );
    if (!menu) return {};

    const clientLocationMenus = user?.data?.clientLocationMenus || [];
    const masterMenu =
      clientLocationMenus.find(
        (item) => item.loginMenu?.appProductMenuId === menu.appProductMenuId,
      )?.loginMenu || menu;

    const actions = {};
    Object.keys(ACTION_TYPES).forEach((key) => {
      const actionTypeId = ACTION_TYPES[key];
      const actionTypeStr = String(actionTypeId);

      let exactActionIdStr = null;
      if (masterMenu?.menuActions && Array.isArray(masterMenu.menuActions)) {
        const matchingAction = masterMenu.menuActions.find(
          (ma) => ma.appActionTypeId === actionTypeId,
        );
        if (matchingAction) {
          exactActionIdStr = String(matchingAction.appProductMenuActionId);
        }
      }

      const isDenied = loginAppUserPermissionActions.some((a) => {
        const menuMatch = a.appProductMenuId === menu.appProductMenuId;

        const actionIdStr = String(a.appProductMenuActionId);
        const actionIdMatch = exactActionIdStr
          ? actionIdStr === exactActionIdStr ||
            a.appActionTypeId === actionTypeId
          : actionIdStr.endsWith(actionTypeStr) ||
            a.appActionTypeId === actionTypeId ||
            String(a.appActionTypeId).endsWith(actionTypeStr);

        return menuMatch && actionIdMatch && a.isDenied;
      });
      actions[key] = !isDenied;
    });
    return actions;
  };

  // Check menu visibility
  const canViewMenu = (menuId) => {
    if (!menuId) return true;
    const menu = loginUserMenus.find(
      (m) => m.appProductMenuId === Number(menuId),
    );
    return !!menu;
  };

  // Check route access
  const canAccessRoute = (menuTargetURL) => {
    if (!menuTargetURL) return true;
    return !!getMenuByPath(menuTargetURL);
  };

  // Route guard with optional message
  const checkRouteAccess = (
    menuTargetURL,
    options = { showMessage: false, redirectTo: "/" },
  ) => {
    const hasAccess = canAccessRoute(menuTargetURL);
    if (!hasAccess && options.showMessage) {
      openPermissionModal();
    }
    return hasAccess;
  };

  return {
    hasMenuAction,
    canViewMenu,
    canAccessRoute,
    checkRouteAccess,
    getMenuActions,
    getMenuByPath,
    ACTION_TYPES,
    loginUserMenus,
    loginAppUserPermissionActions,
  };
};

export default usePermission;
