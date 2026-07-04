import React from "react";
import { useLocation } from "react-router-dom";

import { usePermission } from "../hooks/usePermission";

const PermissionGuard = ({ action, children, controlName = undefined }) => {
  const { hasMenuAction, ACTION_TYPES } = usePermission();
  const location = useLocation();

  const actionTypeId =
    typeof action === "string" ? ACTION_TYPES[action.toUpperCase()] : action;

  const isAllowed = hasMenuAction(
    location.pathname,
    actionTypeId,
    false,
    controlName,
  );

  if (isAllowed) {
    return <>{children}</>;
  }

  const child = React.Children.only(children);

  return React.cloneElement(child, {
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();

      hasMenuAction(location.pathname, actionTypeId, true, controlName);
    },
  });
};

export default PermissionGuard;