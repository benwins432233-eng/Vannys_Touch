import { Routes, Route } from 'react-router-dom';
import { useCartMergeOnLogin } from '@/hooks/use-cart';
import { RequireAuth, RequireAdmin, GuestOnly } from '@/components/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Public pages
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

// Auth-required pages
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

export default function App() {
  // Le panier rempli avant connexion rejoint le panier serveur (lot L2).
  useCartMergeOnLogin();

  return (
    <Routes>
      {/* ── Guest-only ── */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ── Public (shop) ── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Auth-required inside shop layout */}
        <Route element={<RequireAuth />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Admin ── */}
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
