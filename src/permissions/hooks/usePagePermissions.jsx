import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { usePermission } from "./usePermission";
import { usePermissionModal } from "../../context/PermissionModalContext";

export const usePagePermissions = (pathOverride = null) => {
  const location = useLocation();

  const { hasMenuAction, ACTION_TYPES } = usePermission();
  const { openPermissionModal } = usePermissionModal();

  const currentPath = pathOverride || location.pathname;

  const canAdd = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.NEW, false),
    [currentPath, hasMenuAction, ACTION_TYPES.NEW],
  );

  const canEdit = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.EDIT, false),
    [currentPath, hasMenuAction, ACTION_TYPES.EDIT],
  );

  const canDelete = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.DELETE, false),
    [currentPath, hasMenuAction, ACTION_TYPES.DELETE],
  );

  const canView = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.VIEW, false),
    [currentPath, hasMenuAction, ACTION_TYPES.VIEW],
  );

  const canImport = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.IMPORT, false),
    [currentPath, hasMenuAction, ACTION_TYPES.IMPORT],
  );

  const canPost = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.POST, false),
    [currentPath, hasMenuAction, ACTION_TYPES.POST],
  );

  const canUnpost = useMemo(
    () => hasMenuAction(currentPath, ACTION_TYPES.UNPOST, false),
    [currentPath, hasMenuAction, ACTION_TYPES.UNPOST],
  );

  const permission = (canAccess) => {
    if (!canAccess) {
      openPermissionModal();
      return false;
    }
    return true;
  };

  return {
    canAdd,
    canEdit,
    canDelete,
    canView,
    canImport,
    canPost,
    canUnpost,
    permission,
  };
};

export default usePagePermissions;
