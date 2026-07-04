import { lazy } from "react";
import { Route } from "react-router-dom";

const InvoiceDashboardPage = lazy(
  () => import("../pages/Modules/InvoiceManagement/InvoiceDashboardPage"),
);

const FBRTestScenarioPage = lazy(
  () =>
    import("../pages/Modules/InvoiceManagement/Sandbox/FBRTestScenarioPage"),
);

const BuyerCategoryPage = lazy(
  () => import("../pages/Modules/InvoiceManagement/Buyer/BuyerCategoryPage"),
);
const BuyerRegistrationPage = lazy(
  () =>
    import("../pages/Modules/InvoiceManagement/Buyer/BuyerRegistrationPage"),
);

const SalesTaxInvoicePage = lazy(
  () =>
    import("../pages/Modules/InvoiceManagement/Invoice/SalesTaxInvoicePage"),
);
const FBRInvoicePage = lazy(
  () => import("../pages/Modules/InvoiceManagement/Invoice/FBRInvoicePage"),
);

const InvoiceRoutes = () => (
  <>
    <Route path="DashBoardINV/*" element={<InvoiceDashboardPage />} />

    <Route path="FBRTestScenario/*" element={<FBRTestScenarioPage />} />

    <Route path="BuyerCategory/*" element={<BuyerCategoryPage />} />
    <Route path="BuyerRegistration/*" element={<BuyerRegistrationPage />} />
    <Route path="CustomerRegistration/*" element={<BuyerRegistrationPage />} />

    <Route path="SalesTaxInvoice/*" element={<SalesTaxInvoicePage />} />
    <Route path="FBRInvoice/*" element={<FBRInvoicePage />} />
  </>
);

export default InvoiceRoutes;
