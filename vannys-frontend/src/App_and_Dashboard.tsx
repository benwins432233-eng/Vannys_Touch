// ============================================================
// src/App.tsx — VERSION API (routing par slug + loading auth)
// ============================================================
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { DarkModeProvider } from '@/hooks/useDarkMode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Payment from '@/pages/Payment';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-50">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Vanny's Touch</h2>
      <p className="text-gray-500 mt-2">Chargement...</p>
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ScrollProgress />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          {/* IMPORTANT: route par slug (plus par id) */}
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/payment"
            element={<ProtectedRoute><Payment /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<AdminRoute><Dashboard /></AdminRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Roboto, sans-serif' } }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <DarkModeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </DarkModeProvider>
    </Router>
  );
}


// ============================================================
// src/pages/Dashboard.tsx — Sections Produits et Commandes
// branchées sur l'API (extrait des parties modifiées)
// ============================================================
//
// Changements par rapport à la version mock :
//
// 1. Import des hooks API
// import { useAdminOrders } from '@/hooks/useApi';
// import { productsService } from '@/api/services';
//
// 2. État produits depuis l'API
// const [products, setProducts] = useState<Product[]>([]);
// useEffect(() => {
//   productsService.list({ per_page: 100 })
//     .then(res => setProducts(res.data))
//     .catch(err => toast.error(err.message));
// }, []);
//
// 3. État commandes depuis l'API
// const { orders, refetch: refetchOrders } = useAdminOrders({
//   status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
//   search: orderSearch || undefined,
// });
//
// 4. CRUD produits via API
// const handleSaveProduct = async (formData: FormData) => {
//   try {
//     if (selectedProduct) {
//       await productsService.update(selectedProduct.id, formData);
//       toast.success('Produit mis à jour');
//     } else {
//       await productsService.create(formData);
//       toast.success('Produit ajouté');
//     }
//     // Recharger la liste
//     productsService.list({ per_page: 100 }).then(res => setProducts(res.data));
//   } catch (err) {
//     toast.error(err instanceof ApiException ? err.message : 'Erreur');
//   }
// };
//
// const confirmDeleteProduct = async () => {
//   if (!selectedProduct) return;
//   try {
//     await productsService.delete(selectedProduct.id);
//     setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
//     toast.success('Produit supprimé');
//   } catch {
//     toast.error('Erreur lors de la suppression');
//   }
//   setDeleteModalOpen(false);
// };
//
// 5. Changer le statut d'une commande
// const handleUpdateOrderStatus = async (orderId: number, status: Order['status']) => {
//   try {
//     await ordersService.updateStatus(orderId, status);
//     refetchOrders();
//     toast.success('Statut mis à jour');
//   } catch {
//     toast.error('Erreur lors de la mise à jour');
//   }
// };
//
// 6. Unifier le dark mode (supprimer le state local `darkMode`)
// const { isDark, toggle } = useDarkMode();
// // Retirer <div className={`... ${darkMode ? 'dark' : ''}`}>
// // Le dark mode est géré globalement via useDarkMode
