import { Outlet } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Backdrop from "./Backdrop";

import { SidebarProvider, useSidebar } from "../context/SidebarContext";

const LayoutContent = () => {
  const { isExpanded, isMobileOpen } = useSidebar();

  return (
    <div className="h-screen overflow-hidden xl:flex">
      <div>
        <Sidebar />
        <Backdrop />
      </div>

      <div
        id="main-scroll-container"
        className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ease-in-out ${isExpanded ? "lg:ml-[270px]" : "lg:ml-[90px]"} ${isMobileOpen ? "ml-0" : ""}`}
      >
        <Header />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
