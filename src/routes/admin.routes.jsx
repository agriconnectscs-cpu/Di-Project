import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminDashboardPage = lazy(
  () => import("../pages/Modules/AdminManagement/AdminDashboardPage"),
);
// System
const ErrorLogPage = lazy(
  () => import("../pages/Modules/AdminManagement/System/ErrorLogPage"),
);
const DataUploadPage = lazy(
  () => import("../pages/Modules/AdminManagement/System/DataUploadPage"),
);
const UserPushTokenPage = lazy(
  () => import("../pages/Modules/AdminManagement/System/UserPushTokenPage"),
);

// Data / Constant
const ControlTypePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Constant/ControlTypePage"),
);
const ControlCategoryPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Constant/ControlCategoryPage"),
);
const ClientAreaPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Constant/ClientAreaPage"),
);
const ClientCategoryPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Constant/ClientCategoryPage"),
);
const LocationTypePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Constant/LocationTypePage"),
);

// Mapping
const DocumentTypePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Mapping/DocumentTypePage"),
);
const DocumentMovementPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Mapping/DocumentMovementPage"),
);
const CriteriaTypePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Mapping/CriteriaTypePage"),
);
const CriteriaSubTypePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/Data/Mapping/CriteriaSubTypePage"),
);
const CurrencyPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Mapping/CurrencyPage"),
);

// Geography
const CountryPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/CountryPage"),
);
const ProvincePage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/ProvincePage"),
);
const CityPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/CityPage"),
);
const DistrictPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/DistrictPage"),
);
const TehsilPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/TehsilPage"),
);
const AreaPage = lazy(
  () => import("../pages/Modules/AdminManagement/Data/Geography/AreaPage"),
);

// Setup
const CompanyPage = lazy(
  () => import("../pages/Modules/AdminManagement/Setup/CompanyPage"),
);
const LocationPage = lazy(
  () => import("../pages/Modules/AdminManagement/Setup/LocationPage"),
);

// User / Role
const RolePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/RoleConfiguration/RolePage"),
);
const RoleModulePage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/RoleConfiguration/RoleModulePage"),
);
const RoleMenuPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/RoleConfiguration/RoleMenuPage"),
);
const RoleReportPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/RoleReport/RoleReportPage"),
);

const UserRegistrationPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/UserConfiguration/UserRegistrationPage/UserRegistrationPage"),
);
const UserPermissionPage = lazy(
  () =>
    import("../pages/Modules/AdminManagement/User/UserConfiguration/UserPermissionPage/UserPermissionPage"),
);

const AdminRoutes = () => (
  <>
    <Route path="DashBoardADM/*" element={<AdminDashboardPage />} />

    <Route path="ErrorLog/*" element={<ErrorLogPage />} />
    <Route path="DataUpload/*" element={<DataUploadPage />} />
    <Route path="UserPushToken/*" element={<UserPushTokenPage />} />

    <Route path="ControlType/*" element={<ControlTypePage />} />
    <Route path="ControlCategory/*" element={<ControlCategoryPage />} />
    <Route path="ClientArea/*" element={<ClientAreaPage />} />
    <Route path="ClientCategory/*" element={<ClientCategoryPage />} />
    <Route path="LocationType/*" element={<LocationTypePage />} />

    <Route path="DocumentType/*" element={<DocumentTypePage />} />
    <Route path="DocumentMovement/*" element={<DocumentMovementPage />} />
    <Route path="CriteriaType/*" element={<CriteriaTypePage />} />
    <Route path="CriteriaSubType/*" element={<CriteriaSubTypePage />} />
    <Route path="Currency/*" element={<CurrencyPage />} />

    <Route path="Country/*" element={<CountryPage />} />
    <Route path="Province/*" element={<ProvincePage />} />
    <Route path="City/*" element={<CityPage />} />
    <Route path="District/*" element={<DistrictPage />} />
    <Route path="Tehsil/*" element={<TehsilPage />} />
    <Route path="CityArea/*" element={<AreaPage />} />

    <Route path="OrganizationConfig/*" element={<CompanyPage />} />
    <Route path="LocationConfig/*" element={<LocationPage />} />

    <Route path="Role/*" element={<RolePage />} />
    <Route path="RoleModule/*" element={<RoleModulePage />} />
    <Route path="RoleMenu/*" element={<RoleMenuPage />} />
    <Route path="RoleReport/*" element={<RoleReportPage />} />

    <Route path="User/*" element={<UserRegistrationPage />} />
    <Route path="UserPermission/*" element={<UserPermissionPage />} />
  </>
);

export default AdminRoutes;
