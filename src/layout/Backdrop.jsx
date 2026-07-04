import { useSidebar } from "../context/SidebarContext";

const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[35] bg-black/40 backdrop-blur-sm lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
