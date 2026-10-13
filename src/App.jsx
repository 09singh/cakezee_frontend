import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import StaffLayout from "./components/layout/StaffLayout";
import PageLoader from "./components/common/PageLoader.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

const Home = lazy(() =>
  import("./features/home/pages/Home")
);

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

// Page showing all categories
const CategoryPage = lazy(() =>
  import("./features/products/pages/CategoryPage")
);

// Page showing products belonging to a selected category
const CategoryProducts = lazy(() =>
  import("./features/CategoryProducts.jsx")
);
const ReadyNowPage = lazy(() =>
  import("./features/products/pages/ReadynowPage.jsx")
);

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

const ProductPage = lazy(() =>
  import("./features/products/pages/ProductPage")
);

/*
|--------------------------------------------------------------------------
| CHECKOUT
|--------------------------------------------------------------------------
*/

const CartPage = lazy(() =>
  import("./features/cart/pages/CartPage")
);

const OrdersPage = lazy(() =>
  import("./features/orders/pages/OrdersPage")
);

const AccountPage = lazy(() =>
  import("./features/customer/pages/AccountPage")
);

const PersonalisePage = lazy(() =>
  import("./features/PersonalisePage.jsx")
);

const AddonsPage = lazy(() =>
  import("./features/AddonsPage.jsx")
);

const DeliveryPage = lazy(() =>
  import("./features/DeliveryPage.jsx")
);

const OrderSummaryPage = lazy(() =>
  import("./features/OrderSummaryPage.jsx")
);

const PaymentPage = lazy(() =>
  import("./features/PaymentPage.jsx")
);

const OrderConfirmationPage = lazy(() =>
  import("./features/OrderConfirmationPage.jsx")
);

/*
|--------------------------------------------------------------------------
| STAFF
|--------------------------------------------------------------------------
*/

const AdminDashboard = lazy(() =>
  import("./features/admain/page/AdminDashboard.jsx")
);

const OrdersDashboard = lazy(() =>
  import("./features/admain/order/OrdersDashboard.jsx")
);

const InventoryPage = lazy(() =>
  import("./features/admain/inventory/InventoryPage.jsx")
);
const FinancePage = lazy(() =>
  import("./features/admain/finance/FinancePage.jsx")
);
const CouponsPage = lazy(() =>
  import("./features/admain/coupons/CouponsPage.jsx")
);
const CustomersDashboard = lazy(() =>
  import("./features/admain/customers/CustomersDashboard.jsx")
);

/*
|--------------------------------------------------------------------------
| ADMIN PRODUCT MANAGEMENT
|--------------------------------------------------------------------------
*/

const ProductManagement = lazy(() =>
  import("./features/admain/product/ProductManagement.jsx")
);

const AddProduct = lazy(() =>
  import("./features/admain/product/pages/AddProduct.jsx")
);
const ReadyNowManagement = lazy(() =>
  import("./features/admain/product/ReadyNowManagement.jsx")
);

const AddCategory = lazy(() =>
  import("./features/admain/addcategory/AddCategory.jsx")
);

const ManageCategories = lazy(() =>
  import("./features/admain/addcategory/ManageCategories.jsx")
);

const AddAddon = lazy(() =>
  import("./features/admain/addons/AddAddon.jsx")
);

/*
|--------------------------------------------------------------------------
| KITCHEN
|--------------------------------------------------------------------------
*/

const KitchenDashboard = lazy(() =>
  import("./features/Kitchen/page/KitchenDashboard.jsx")
);

/*
|--------------------------------------------------------------------------
| DELIVERY
|--------------------------------------------------------------------------
*/

const DeliveryDashboard = lazy(() =>
  import("./features/Deliverym/pages/DeliveryDashboard.jsx")
);

/*
|--------------------------------------------------------------------------
| STAFF LOGIN
|--------------------------------------------------------------------------
*/

const StaffLogin = lazy(() =>
  import("./features/auth/staff/login.jsx")
);

/*
|--------------------------------------------------------------------------
| UNAUTHORIZED
|--------------------------------------------------------------------------
*/

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Access Denied
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to access this page.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/staff/login";
          }}
          className="mt-6 rounded-lg bg-[#2f211c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#443029]"
        >
          Go to Staff Login
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ========================================================= */}
        {/* CUSTOMER / PUBLIC WEBSITE                                */}
        {/* ========================================================= */}

        <Route element={<MainLayout />}>
          {/* HOME */}

          <Route
            path="/"
            element={<Home />}
          />

          {/* ======================================================= */}
          {/* CATEGORY LISTING                                        */}
          {/* ======================================================= */}

          {/* Shows all categories */}
          <Route
            path="/categories"
            element={<CategoryPage />}
          />
          <Route
            path="/category/all"
            element={<CategoryPage />}
          />

          <Route
            path="/category/ready-now"
            element={<ReadyNowPage />}
          />

          {/* ======================================================= */}
          {/* CATEGORY PRODUCTS                                       */}
          {/* ======================================================= */}

          {/* Shows products for the selected category */}
          <Route
            path="/category/:categoryId"
            element={<CategoryProducts />}
          />

          {/* ======================================================= */}
          {/* PRODUCT DETAILS                                         */}
          {/* ======================================================= */}

          <Route
            path="/product/:id"
            element={<ProductPage />}
          />

          <Route
            path="/product/:id/personalise"
            element={<PersonalisePage />}
          />

          {/* ======================================================= */}
          {/* CHECKOUT                                                */}
          {/* ======================================================= */}

          <Route
            path="/addonsPage"
            element={<AddonsPage />}
          />

          <Route
            path="/checkout/addons"
            element={<AddonsPage />}
          />

          <Route
            path="/checkout/delivery"
            element={<DeliveryPage />}
          />

          <Route
            path="/checkout/summary"
            element={<OrderSummaryPage />}
          />

          <Route
            path="/checkout/payment"
            element={<PaymentPage />}
          />

          <Route
            path="/checkout/confirmation"
            element={<OrderConfirmationPage />}
          />

          {/* ======================================================= */}
          {/* CART / ORDERS / ACCOUNT                                 */}
          {/* ======================================================= */}

          <Route
            path="/cart"
            element={<CartPage />}
          />

          <Route
            path="/orders"
            element={<OrdersPage />}
          />

          <Route
            path="/account"
            element={<AccountPage />}
          />
        </Route>

        {/* ========================================================= */}
        {/* STAFF LOGIN                                               */}
        {/* ========================================================= */}

        <Route
          path="/staff/login"
          element={<StaffLogin />}
        />

        {/* ========================================================= */}
        {/* ADMIN                                                     */}
        {/* ========================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={["admin"]} />
            }
          >
            <Route element={<StaffLayout />}>
              {/* ADMIN DASHBOARD */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<OrdersDashboard />} />
              <Route path="/admin/finance" element={<FinancePage />} />
              <Route path="/admin/customers" element={<CustomersDashboard />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route path="/admin/coupons" element={<CouponsPage />} />
              <Route path="/admin/kitchen" element={<KitchenDashboard />} />
              <Route path="/admin/delivery" element={<DeliveryDashboard />} />

              {/* PRODUCT MANAGEMENT */}
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/products/add" element={<AddProduct />} />
              <Route path="/admin/ready-now" element={<ReadyNowManagement />} />
              <Route path="/admin/products/categories/add" element={<AddCategory />} />
              <Route path="/admin/products/categories" element={<ManageCategories />} />
              <Route path="/admin/products/addons/add" element={<AddAddon />} />
              <Route path="/admin/addons" element={<AddAddon />} />
            </Route>
          </Route>
        </Route>

        {/* ========================================================= */}
        {/* KITCHEN                                                   */}
        {/* ========================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={["kitchen"]} />
            }
          >
            <Route element={<StaffLayout />}>
              <Route path="/kitchen" element={<KitchenDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* ========================================================= */}
        {/* DELIVERY                                                  */}
        {/* ========================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={["delivery"]} />
            }
          >
            <Route element={<StaffLayout />}>
              <Route path="/delivery" element={<DeliveryDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* ========================================================= */}
        {/* UNAUTHORIZED                                              */}
        {/* ========================================================= */}

        <Route
          path="/unauthorized"
          element={<UnauthorizedPage />}
        />

        {/* ========================================================= */}
        {/* FALLBACK                                                  */}
        {/* ========================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;






