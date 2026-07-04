import { lazy } from "react";
import { Route } from "react-router-dom";

const ProductDashboardPage = lazy(
  () => import("../pages/Modules/ProductManagement/ProductDashboardPage"),
);
const UnitPage = lazy(
  () => import("../pages/Modules/ProductManagement/Profile/UnitPage"),
);

const TaxPage = lazy(
  () => import("../pages/Modules/ProductManagement/Profile/TaxPage"),
);

// Product
const ProductCategoryPage = lazy(
  () =>
    import("../pages/Modules/ProductManagement/Product/ProductHierarchy/ProductCategoryPage"),
);
const ProductSubCategoryPage = lazy(
  () =>
    import("../pages/Modules/ProductManagement/Product/ProductHierarchy/ProductSubCategoryPage"),
);
const ProductRegPageV1 = lazy(
  () => import("../pages/Modules/ProductManagement/Product/ProductRegPageV1"),
);

const ProductRoutes = () => (
  <>
    <Route path="DashBoardISPM/*" element={<ProductDashboardPage />} />

    <Route path="Unit/*" element={<UnitPage />} />
    <Route path="TaxConfiguration/*" element={<TaxPage />} />

    <Route path="ProductCategory/*" element={<ProductCategoryPage />} />
    <Route path="ProductSubCategory/*" element={<ProductSubCategoryPage />} />

    <Route path="ProductRegV1/*" element={<ProductRegPageV1 />} />
  </>
);

export default ProductRoutes;
