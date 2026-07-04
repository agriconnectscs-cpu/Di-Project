import NProgress from "nprogress";
NProgress.configure({ showSpinner: false });

import { useSelector } from "react-redux";
import { selectUser, selectValidatedUser } from "./store/authSlice";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";
import { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import ModuleRoutes from "./routes";
import { useTheme } from "./ThemeProvider";
import { PermissionModalProvider } from "./context/PermissionModalContext";

import ScrollToTop from "./components/common/ScrollToTop";
import TokenAuthHandler from "./components/auth/TokenAuthHandler";

const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const UserValidatePage = lazy(() => import("./pages/Auth/UserValidatePage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const ModulesPage = lazy(() => import("./pages/ModulesPage"));
const ShortcutsPage = lazy(() => import("./pages/ShortcutsPage"));
const Layout = lazy(() => import("./layout/Layout"));
// ====== Paths ======

// Route guards
const PrivateRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const validatedUser = useSelector(selectValidatedUser);
  const isFullyLoggedIn = Boolean(user && validatedUser);
  return isFullyLoggedIn ? (
    children
  ) : (
    <Navigate to="/UserValidate/login" replace />
  );
};

const PublicRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const validatedUser = useSelector(selectValidatedUser);
  const isFullyLoggedIn = Boolean(user && validatedUser);
  return isFullyLoggedIn ? <Navigate to="/" replace /> : children;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetch("/api/Login/GetServerDate");
        const contentType = res.headers.get("content-type");
        if (
          !res.ok ||
          !contentType ||
          !contentType.includes("application/json")
        ) {
          setIsMaintenance(true);
          return;
        }

        const data = await res.json();
        if (data.statusCode !== 200) {
          setIsMaintenance(true);
        }
      } catch {
        setIsMaintenance(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkServerStatus();
  }, []);

  const { isDarkMode } = useTheme();

  if (isMaintenance) {
    return (
      <Suspense
        fallback={
          <div
            className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-[#0d0c1a]" : "bg-white"}`}
          >
            <Loader className="size-10 animate-spin" />
          </div>
        }
      >
        <MaintenancePage />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${isDarkMode ? "bg-[#0d0c1a]" : "bg-white"}`}
      >
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <PermissionModalProvider>
        <TokenAuthHandler />
        <ScrollToTop />

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <Loader className="size-10 animate-spin" />
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route
              path="/UserValidate/login"
              element={
                <PublicRoute>
                  <UserValidatePage />
                </PublicRoute>
              }
            />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Private Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <ModulesPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/Shortcuts"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<ShortcutsPage />} />
            </Route>

            {/* Layout with module routing */}
            <Route
              path="/:module/*"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              {ModuleRoutes()}
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: isDarkMode ? "#363636" : "#f3f3f3",
              color: isDarkMode ? "#fffbfb" : "#1f1f1f",
              fontFamily: "Outfit",
              fontSize: "13px",
              padding: "8px 16px",
              borderRadius: "8px",
              maxWidth: "600px",
              wordBreak: "break-word",
              boxShadow: isDarkMode
                ? "0 2px 6px rgba(0,0,0,0.5)"
                : "0 2px 6px rgba(0,0,0,0.1)",
            },
          }}
        />
      </PermissionModalProvider>
    </BrowserRouter>
  );
};

export default App;
