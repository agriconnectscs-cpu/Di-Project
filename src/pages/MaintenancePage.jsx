import { Suspense, lazy } from "react";
import { useTheme } from "../ThemeProvider";

const Lottie = lazy(() => import("lottie-react"));
import underConstruction from "../assets/lottie/UnderConstruction.json";
// Imports End----

const MaintenancePage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        isDarkMode ? "bg-[#0d0c1a] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block w-full max-w-[320px] mx-auto items-center justify-center min-h-[300px]">
          <div
            className={`absolute inset-0 blur-3xl opacity-20 ${
              isDarkMode ? "bg-purple-600" : "bg-purple-400"
            }`}
          ></div>
          <Suspense
            fallback={
              <div className="relative size-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
            }
          >
            <Lottie
              animationData={underConstruction}
              loop={true}
              className="relative w-full h-auto drop-shadow-2xl"
              style={{ height: 300 }}
            />
          </Suspense>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl  uppercase">
            System <span className="text-purple-500">Maintenance</span>
          </h1>
          <p
            className={`text-base max-w-sm mx-auto ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            We're currently performing some scheduled updates to improve your
            experience. Our services will be back online shortly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
