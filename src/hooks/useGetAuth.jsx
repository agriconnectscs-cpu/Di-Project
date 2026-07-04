import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";

export const useGetAuth = (location) => {
  const authData = useSelector(selectUser);

  const loginAccessToken = authData?.data?.loginAccessToken || null;

  const menus = authData?.data?.loginUserMenus || authData?.data?.menus || [];
  const loginUserModules =
    authData?.data?.loginUserModules ||
    authData?.data?.modules ||
    authData?.data?.clientLocationModules ||
    [];

  const currentPath = location?.pathname?.toLowerCase() || "";

  const currentMenu = menus.find(
    (menu) =>
      menu.appMenuTargetURL &&
      currentPath.includes(menu.appMenuTargetURL.toLowerCase()),
  );

  const childMenus = currentMenu
    ? menus.filter((m) => m.parentAppMenuId === currentMenu.appProductMenuId)
    : [];

  return {
    authData,
    loginAccessToken,
    modules: loginUserModules,
    loginUserModules,
    menus,
    childMenus,
  };
};
