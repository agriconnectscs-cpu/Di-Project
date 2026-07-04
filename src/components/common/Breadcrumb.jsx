import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useGetAuth } from "../../hooks/useGetAuth";

const Breadcrumb = () => {
  const location = useLocation();
  const { menus } = useGetAuth(location);

  const path = location.pathname.toLowerCase();

  const currentMenu = menus.find((menu) => {
    if (!menu.appMenuTargetURL) return false;
    const menuUrl = menu.appMenuTargetURL.toLowerCase();
    return path.includes(menuUrl);
  });

  if (!currentMenu) {
    return null;
  }

  const crumbs = [];
  let menuPointer = currentMenu;
  while (menuPointer) {
    crumbs.unshift({
      name:
        menuPointer.appMenuDisplayName ||
        menuPointer.appMenuName ||
        "Dashboard",
      path: menuPointer.appMenuTargetURL || "#",
    });
    if (!menuPointer.parentAppMenuId) break;
    menuPointer = menus.find(
      (m) => m.appProductMenuId === menuPointer.parentAppMenuId
    );
  }

  // If there is a child menu (submenu child), add it to the end
  const childMenu = menus.find(
    (m) =>
      m.parentAppMenuId === currentMenu.appProductMenuId &&
      path.includes(m.appMenuTargetURL?.toLowerCase() || "")
  );
  if (childMenu) {
    crumbs.push({
      name: childMenu.appMenuDisplayName || childMenu.appMenuName || "Child",
      path: childMenu.appMenuTargetURL || "#",
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-md sm:text-sm mb-4 rounded-full text-nowrap mt-4"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.name + i} className="flex items-center gap-1 ">
            {i !== 0 && (
              <ChevronRight
                size={18}
                className={
                  "transition-colors duration-200 ease-in-out text-[var(--breadcrumb-divider)]"
                }
              />
            )}
            {isLast ? (
              <span
                className={
                  "font-medium capitalize text-[15px] max-w-[160px] sm:max-w-full truncate transition-colors duration-200 text-[var(--breadcrumb-current)]"
                }
              >
                {crumb.name}
              </span>
            ) : (
              <Link
                to="#"
                className={`capitalize text-[15px] font-semibold transition-colors duration-200 text-[var(--breadcrumb-link)] hover:text-[var(--breadcrumb-link-hover)]`}
              >
                {crumb.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
