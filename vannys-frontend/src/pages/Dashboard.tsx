import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Users, Settings,
  LogOut, Search, Plus, Edit, Trash2, Eye, X,
  ChevronRight, TrendingUp, TrendingDown, DollarSign, User,
  CheckCircle, Clock, AlertCircle, Menu, Mail, Send,
  Image as ImageIcon, ChevronDown, RefreshCw, Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { productsService, ordersService } from '@/api/services';
import { http } from '@/api/client';
import { ApiException } from '@/api/client';
import { toast } from 'sonner';
import type { Product, Order, Category } from '@/types';

// ── Helpers ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof CheckCircle }> = {
    delivered:  { label: 'Livrée',       cls: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle },
    processing: { label: 'En cours',     cls: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Clock },
    pending:    { label: 'En attente',   cls: 'bg-amber-100 text-amber-700 border-amber-200',  icon: AlertCircle },
    cancelled:  { label: 'Annulée',      cls: 'bg-red-100 text-red-700 border-red-200',        icon: X },
  };
  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </span>
  );
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: {
  title: string; value: string; change: string;
  changeType: 'up' | 'down' | 'neutral'; icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <span className={`flex items-center gap-1 text-sm font-medium ${
          changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {changeType === 'up' && <TrendingUp className="w-4 h-4" />}
          {changeType === 'down' && <TrendingDown className="w-4 h-4" />}
          {changeType === 'neutral' && <CheckCircle className="w-4 h-4" />}
          {change}
        </span>
        <span className="text-gray-400 text-sm">vs mois dernier</span>
      </div>
    </div>
  );
}

// ── Modal Produit ─────────────────────────────────────────────
function ProductModal({ product, categories, isOpen, onClose, onSaved }: {
  product?: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', description: '', price: '', original_price: '',
    category_id: '', badge: '', in_stock: true, is_featured: false,
    colors: '', sizes: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      const colors = product.variants?.filter(v => v.type === 'color').map(v => v.value).join(', ') ?? '';
      const sizes  = product.variants?.filter(v => v.type === 'size').map(v => v.value).join(', ') ?? '';
      setForm({
        name:           product.name,
        description:    product.description ?? '',
        price:          String(product.price),
        original_price: product.original_price ? String(product.original_price) : '',
        category_id:    String(product.category_id),
        badge:          product.badge ?? '',
        in_stock:       product.in_stock,
        is_featured:    product.is_featured,
        colors, sizes,
      });
    } else {
      setForm({ name: '', description: '', price: '', original_price: '', category_id: String(categories[0]?.id ?? ''), badge: '', in_stock: true, is_featured: false, colors: '', sizes: '' });
      setImages([]); setPreviews([]);
    }
  }, [product, isOpen]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      // Couleurs & tailles
      form.colors.split(',').map(s => s.trim()).filter(Boolean).forEach(c => fd.append('colors[]', c));
      form.sizes.split(',').map(s => s.trim()).filter(Boolean).forEach(s => fd.append('sizes[]', s));
      images.forEach((img, i) => fd.append(`images[${i}]`, img));

      if (product) {
        await productsService.update(product.id, fd);
        toast.success('Produit mis à jour !');
      } else {
        await productsService.create(fd);
        toast.success('Produit ajouté !');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Ex: Casque Bluetooth Pro" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              rows={3} placeholder="Description du produit..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix (FCFA) *</label>
              <input required type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="45000" />
            </div>
            {/* Prix original */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix original (FCFA)</label>
              <input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="55000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none bg-white">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Badge</label>
              <input type="text" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" placeholder="Promo, Nouveau…" />
            </div>
          </div>

          {/* Couleurs & tailles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleurs <span className="text-gray-400 text-xs">(séparées par des virgules)</span></label>
              <input type="text" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" placeholder="Noir, Blanc, Bleu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tailles <span className="text-gray-400 text-xs">(séparées par des virgules)</span></label>
              <input type="text" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" placeholder="S, M, L, XL" />
            </div>
          </div>

          {/* Upload images Cloudinary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {product ? 'Ajouter de nouvelles photos' : 'Photos du produit *'}
              <span className="text-gray-400 text-xs ml-2">(JPEG, PNG, WebP — max 5 MB chacune)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Cliquer pour sélectionner vos photos</span>
              <span className="text-xs text-gray-400 mt-1">La première photo sera l'image principale</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImages} className="hidden"
                {...(!product && { required: true })} />
            </label>
            {/* Prévisualisations */}
            {previews.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-blue-500' : 'border-gray-200'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[9px] bg-blue-500 py-0.5">Principale</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Images existantes */}
            {product && product.images && product.images.length > 0 && previews.length === 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {product.images.map((img, i) => (
                  <div key={img.id} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${img.is_primary ? 'border-blue-500' : 'border-gray-200'}`}>
                    <img src={img.url_thumbnail ?? img.url} alt="" className="w-full h-full object-cover" />
                    {img.is_primary && <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[9px] bg-blue-500 py-0.5">Principale</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            {[['in_stock', 'En stock'], ['is_featured', 'Produit en vedette']].map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form[field as keyof typeof form] as boolean}
                  onChange={e => setForm({ ...form, [field]: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {product ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal suppression ─────────────────────────────────────────
function DeleteModal({ isOpen, onClose, onConfirm, name }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; name: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scaleIn">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Confirmer la suppression</h2>
        <p className="text-gray-600 text-center mb-6">Êtes-vous sûr de vouloir supprimer <strong>"{name}"</strong> ? Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Produits
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Commandes
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // ── Clients
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // ── Newsletter
  const [newsletter, setNewsletter] = useState({
    subject: '', headline: '', intro: '', body: '',
    cta_label: 'Voir toutes les offres', cta_url: '',
    product_ids: [] as number[],
  });
  const [nlSending, setNlSending] = useState(false);
  const [nlSent, setNlSent] = useState(false);

  // ── Chargement initial
  useEffect(() => {
    if (!isAdmin) { toast.error('Accès refusé'); navigate('/'); return; }
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    try {
      const [prods, cats, ords, custs] = await Promise.all([
        productsService.list({ per_page: 100 }),
        http.get<Category[]>('/categories'),
        ordersService.adminList(),
        http.get<{ data: any[] }>('/admin/customers'),
      ]);
      setProducts(prods.data);
      setCategories(cats);
      setOrders(ords.data);
      setCustomers(custs.data ?? []);
    } catch {
      // chargement partiel ok
    }
  };

  const loadProducts = () => productsService.list({ per_page: 100 }).then(r => setProducts(r.data)).catch(() => {});
  const loadOrders   = () => ordersService.adminList({ status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined, search: orderSearch || undefined }).then(r => setOrders(r.data)).catch(() => {});

  useEffect(() => { loadOrders(); }, [orderStatusFilter, orderSearch]);

  // ── Produits filtrés
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat    = productFilter === 'all' || String(p.category_id) === productFilter;
    return matchSearch && matchCat;
  });

  // ── Clients filtrés
  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // ── Stats
  const totalRevenue  = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // ── Handlers produits
  const handleSaved = () => loadProducts();

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await productsService.delete(selectedProduct.id);
      setProducts(p => p.filter(x => x.id !== selectedProduct.id));
      toast.success('Produit supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
    setDeleteModalOpen(false);
  };

  // ── Handler statut commande
  const handleOrderStatus = async (order: Order, status: Order['status']) => {
    try {
      await ordersService.updateStatus(order.id, status);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
      toast.success('Statut mis à jour — email envoyé au client automatiquement');
    } catch { toast.error('Erreur'); }
  };

  // ── Handler newsletter
  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlSending(true);
    try {
      await http.post('/admin/newsletter', newsletter);
      setNlSent(true);
      toast.success('Newsletter envoyée à tous les clients !');
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : 'Erreur d\'envoi');
    } finally {
      setNlSending(false);
    }
  };

  const sidebarItems = [
    { id: 'overview',    label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'products',    label: 'Produits',         icon: Package,    badge: products.length },
    { id: 'orders',      label: 'Commandes',        icon: ShoppingBag, badge: pendingOrders },
    { id: 'customers',   label: 'Clients',           icon: Users,      badge: customers.length },
    { id: 'newsletter',  label: 'Newsletter',        icon: Mail },
    { id: 'settings',    label: 'Paramètres',        icon: Settings },
  ];

  // ── Contenu par onglet
  const renderContent = () => {
    switch (activeTab) {

      // ── VUE D'ENSEMBLE ─────────────────────────────────────
      case 'overview':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-wrap gap-4">
              <button onClick={() => { setActiveTab('products'); setProductModalOpen(true); setSelectedProduct(null); }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/30">
                <Plus className="w-5 h-5" /><span>Nouveau produit</span>
              </button>
              <button onClick={() => setActiveTab('newsletter')}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-500 hover:text-blue-600 transition-all">
                <Mail className="w-5 h-5" /><span>Envoyer une newsletter</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Chiffre d'affaires" value={`${totalRevenue.toLocaleString()} FCFA`} change="+12.5%" changeType="up"    icon={DollarSign}  color="#10b981" />
              <StatCard title="Commandes"          value={String(orders.length)}                   change="+8.2%"  changeType="up"    icon={ShoppingBag} color="#f59e0b" />
              <StatCard title="Clients"            value={String(customers.length)}                change="+15.3%" changeType="up"    icon={User}        color="#8b5cf6" />
              <StatCard title="En attente"         value={String(pendingOrders)}                   change={pendingOrders > 0 ? 'À traiter' : 'Tout est à jour'} changeType={pendingOrders > 0 ? 'down' : 'neutral'} icon={Clock} color="#ef4444" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Commandes récentes */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" />Commandes récentes</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-blue-600 text-sm font-medium flex items-center gap-1">Voir tout<ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>{['Référence','Client','Statut','Total'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{o.reference}</td>
                          <td className="px-6 py-4 text-gray-700">{o.user?.first_name} {o.user?.last_name}</td>
                          <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{Number(o.total).toLocaleString()} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Produits populaires */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" />Produits populaires</h2>
                  <button onClick={() => setActiveTab('products')} className="text-blue-600 text-sm font-medium flex items-center gap-1">Voir tout<ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {products.slice(0, 4).map(p => {
                    const img = p.images?.find(i => i.is_primary) ?? p.images?.[0];
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={img?.url_thumbnail ?? img?.url ?? '/placeholder.png'} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{p.name}</h4>
                            <span className="text-sm text-gray-500">{p.category?.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{Number(p.price).toLocaleString()} FCFA</p>
                          <p className={`text-sm font-medium ${p.in_stock ? 'text-green-600' : 'text-red-500'}`}>{p.in_stock ? 'En stock' : 'Rupture'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      // ── PRODUITS ────────────────────────────────────────────
      case 'products':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
              </div>
              <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white">
                <option value="all">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
              <button onClick={() => { setSelectedProduct(null); setProductModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all">
                <Plus className="w-5 h-5" /><span>Ajouter</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>{['Produit','Catégorie','Prix','Stock','Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map(p => {
                      const img = p.images?.find(i => i.is_primary) ?? p.images?.[0];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img src={img?.url_thumbnail ?? img?.url ?? '/placeholder.png'} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                              <div>
                                <h4 className="font-semibold text-gray-900">{p.name}</h4>
                                {p.badge && <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{p.badge}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{p.category?.name}</span></td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">{Number(p.price).toLocaleString()} FCFA</span>
                            {p.original_price && <span className="ml-2 text-sm text-gray-400 line-through">{Number(p.original_price).toLocaleString()}</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.in_stock ? 'En stock' : 'Rupture'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedProduct(p); setProductModalOpen(true); }} className="p-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => { setSelectedProduct(p); setDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // ── COMMANDES ───────────────────────────────────────────
      case 'orders':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Référence ou client..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
              </div>
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white">
                <option value="all">Tous les statuts</option>
                {['delivered','processing','pending','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>{['Référence','Client','Date','Statut','Paiement','Total','Action'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{o.reference}</td>
                        <td className="px-6 py-4 text-gray-700">{o.user?.first_name} {o.user?.last_name}</td>
                        <td className="px-6 py-4 text-gray-600">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${o.payment_method === 'MTN' ? 'bg-yellow-100 text-yellow-700' : o.payment_method === 'ORANGE' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {o.payment_method} Money
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{Number(o.total).toLocaleString()} FCFA</td>
                        <td className="px-6 py-4">
                          {/* Dropdown changement statut */}
                          <div className="relative group">
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors">
                              Changer <ChevronDown className="w-3 h-3" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              {(['pending','processing','delivered','cancelled'] as Order['status'][])
                                .filter(s => s !== o.status)
                                .map(s => (
                                  <button key={s} onClick={() => handleOrderStatus(o, s)}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    <StatusBadge status={s} />
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // ── CLIENTS ─────────────────────────────────────────────
      case 'customers':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Nom, email..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>{['Client','Email','Téléphone','Rôle','Inscrit le','Commandes'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                              {c.first_name?.[0]}{c.last_name?.[0]}
                            </div>
                            <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{c.email}</td>
                        <td className="px-6 py-4 text-gray-600">{c.phone ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.role === 'admin' ? 'Admin' : 'Client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{c.orders_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun client trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ── NEWSLETTER ──────────────────────────────────────────
      case 'newsletter':
        return (
          <div className="space-y-6 animate-fadeIn max-w-3xl">
            {nlSent ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Newsletter envoyée !</h2>
                <p className="text-gray-600 mb-6">Votre newsletter a été mise en file d'attente et sera envoyée à tous vos clients actifs.</p>
                <button onClick={() => { setNlSent(false); setNewsletter({ subject: '', headline: '', intro: '', body: '', cta_label: 'Voir toutes les offres', cta_url: '', product_ids: [] }); }}
                  className="btn-primary mx-auto">
                  <Mail className="w-5 h-5" /><span>Nouvelle newsletter</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendNewsletter} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Composer une newsletter</h2>
                    <p className="text-sm text-gray-500">Sera envoyée à <strong>{customers.length}</strong> clients</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Sujet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de l'email *</label>
                    <input required type="text" value={newsletter.subject} onChange={e => setNewsletter({ ...newsletter, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                      placeholder="Ex: 🔥 Offres exclusives de la semaine" />
                  </div>

                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre principal *</label>
                    <input required type="text" value={newsletter.headline} onChange={e => setNewsletter({ ...newsletter, headline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                      placeholder="Ex: Nos meilleures offres du mois" />
                  </div>

                  {/* Intro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Introduction (sous le titre) *</label>
                    <input required type="text" value={newsletter.intro} onChange={e => setNewsletter({ ...newsletter, intro: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                      placeholder="Ex: Des produits exceptionnels à prix réduits, rien que pour vous." />
                  </div>

                  {/* Corps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Corps du message *</label>
                    <textarea required value={newsletter.body} onChange={e => setNewsletter({ ...newsletter, body: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none"
                      rows={4} placeholder="Rédigez votre message principal ici..." />
                  </div>

                  {/* Produits à inclure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produits à mettre en avant <span className="text-gray-400">(optionnel — max 6)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                      {products.map(p => {
                        const img = p.images?.find(i => i.is_primary) ?? p.images?.[0];
                        const selected = newsletter.product_ids.includes(p.id);
                        return (
                          <button key={p.id} type="button"
                            onClick={() => {
                              if (selected) {
                                setNewsletter({ ...newsletter, product_ids: newsletter.product_ids.filter(id => id !== p.id) });
                              } else if (newsletter.product_ids.length < 6) {
                                setNewsletter({ ...newsletter, product_ids: [...newsletter.product_ids, p.id] });
                              } else {
                                toast.warning('Maximum 6 produits');
                              }
                            }}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <img src={img?.url_thumbnail ?? '/placeholder.png'} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-blue-600 font-semibold">{Number(p.price).toLocaleString()} F</p>
                            </div>
                            {selected && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                    {newsletter.product_ids.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">{newsletter.product_ids.length} produit(s) sélectionné(s)</p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Texte du bouton</label>
                      <input type="text" value={newsletter.cta_label} onChange={e => setNewsletter({ ...newsletter, cta_label: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL du bouton <span className="text-gray-400">(optionnel)</span></label>
                      <input type="url" value={newsletter.cta_url} onChange={e => setNewsletter({ ...newsletter, cta_url: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                        placeholder="https://..." />
                    </div>
                  </div>

                  {/* Aperçu destinataires */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Cette newsletter sera envoyée automatiquement à <strong>{customers.length} clients</strong> via Resend.
                      Chaque client recevra un lien de désinscription.
                    </p>
                  </div>

                  <button type="submit" disabled={nlSending}
                    className="w-full btn-primary justify-center py-4 text-base">
                    {nlSending ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>Envoi en cours...</span></> : <><Send className="w-5 h-5" /><span>Envoyer la newsletter</span></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      // ── PARAMÈTRES ──────────────────────────────────────────
      case 'settings':
        return (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            {/* Apparence */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Apparence</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Mode sombre</p>
                    <p className="text-sm text-gray-500">Changer le thème de l'interface</p>
                  </div>
                  <button onClick={toggleDark}
                    className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Infos boutique */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Informations de la boutique</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  ['Nom de la boutique', "Vanny's Touch"],
                  ['Email de contact', 'contact@vannystouch.com'],
                  ['Téléphone', '+237 670 000 000'],
                  ['Adresse', 'Yaoundé, Cameroun'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <input type="text" defaultValue={value}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
                  </div>
                ))}
                <button className="btn-primary">
                  <CheckCircle className="w-5 h-5" /><span>Sauvegarder</span>
                </button>
              </div>
            </div>

            {/* Paiements */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Méthodes de paiement acceptées</h2>
              </div>
              <div className="p-6 space-y-3">
                {[['MTN', 'bg-yellow-100 text-yellow-700'], ['MOOV', 'bg-blue-100 text-blue-700'], ['ORANGE', 'bg-orange-100 text-orange-700']].map(([name, cls]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>{name} Money</span>
                    <span className="text-green-600 font-medium text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Activé</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Vanny's Touch</h2>
              <span className="text-xs text-gray-500 font-medium">Admin Panel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          <div className="space-y-1">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'}`}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" />Connecté</p>
            </div>
            <button onClick={async () => { await logout(); navigate('/'); }} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 bg-gray-50">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{sidebarItems.find(i => i.id === activeTab)?.label}</h1>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <button onClick={loadAll} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Actualiser">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="p-6">{renderContent()}</div>
      </main>

      <ProductModal product={selectedProduct} categories={categories} isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} name={selectedProduct?.name ?? ''} />
    </div>
  );
}
