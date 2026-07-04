import AdminRoutes from "./admin.routes";
import ProductRoutes from "./product.routes";
import InvoiceRoutes from "./invoice.routes";

const ModuleRoutes = () => (
  <>
    {AdminRoutes()}
    {ProductRoutes()}
    {InvoiceRoutes()}
  </>
);

export default ModuleRoutes;
