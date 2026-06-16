import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-products';
import { apiClient } from '@/api/client';
import { formatPrice } from '@/utils';
import type { Product } from '@/types';

export function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | 'create' | Product>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await apiClient.get(`/products?${params}`);
      return res.data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const res = await apiClient.get('/categories/admin/all');
      return res.data.data;
    },
  });

  const { mutate: create, isPending: isCreating } = useCreateProduct();
  const { mutate: update, isPending: isUpdating } = useUpdateProduct();
  const { mutate: remove } = useDeleteProduct();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();

    // Champs texte simples
    const textFields = ['name', 'description', 'badge', 'categoryId'] as const;
    textFields.forEach((field) => {
      const el = form.elements.namedItem(field) as HTMLInputElement | null;
      if (el?.value) fd.append(field, el.value);
    });

    // Champs numériques
    const priceEl = form.elements.namedItem('price') as HTMLInputElement | null;
    const originalPriceEl = form.elements.namedItem('originalPrice') as HTMLInputElement | null;
    if (priceEl?.value) fd.append('price', priceEl.value);
    if (originalPriceEl?.value) fd.append('originalPrice', originalPriceEl.value);

    // Checkboxes
    const inStockEl = form.elements.namedItem('inStock') as HTMLInputElement | null;
    const isFeaturedEl = form.elements.namedItem('isFeatured') as HTMLInputElement | null;
    fd.append('inStock', inStockEl?.checked ? 'true' : 'false');
    fd.append('isFeatured', isFeaturedEl?.checked ? 'true' : 'false');

    // Colors et sizes : envoyés comme string CSV
    // Le backend les splitte avec le Transform toStringArray
    const colorsEl = form.elements.namedItem('colors') as HTMLInputElement | null;
    const sizesEl = form.elements.namedItem('sizes') as HTMLInputElement | null;
    if (colorsEl?.value.trim()) fd.append('colors', colorsEl.value.trim());
    if (sizesEl?.value.trim()) fd.append('sizes', sizesEl.value.trim());

    // Images
    const imagesEl = form.elements.namedItem('images') as HTMLInputElement | null;
    if (imagesEl?.files) {
      Array.from(imagesEl.files).forEach((file) => fd.append('images', file));
    }

    if (modal === 'create') {
      create(fd, { onSuccess: () => setModal(null) });
    } else if (modal) {
      update({ id: (modal as Product).id, data: fd }, { onSuccess: () => setModal(null) });
    }
  };

  const handleDelete = (product: Product) => {
    if (!confirm(`Supprimer "${product.name}" ?`)) return;
    remove(product.id);
  };

  const editing = modal !== null && modal !== 'create' ? modal as Product : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <button onClick={() => setModal('create')} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none w-full max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Image', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.map((product: Product) => {
                  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100">
                          {img && <img src={img.urlThumbnail || img.url} alt="" className="w-full h-full object-cover" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        {product.badge && (
                          <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ background: 'var(--color-gold)' }}>
                            {product.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{product.category?.name}</td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {product.inStock ? 'En stock' : 'Épuisé'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setModal(product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.meta.lastPage > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Précédent</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data.meta.lastPage}</span>
          <button disabled={page >= data.meta.lastPage} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">
                {editing ? `Modifier : ${editing.name}` : 'Nouveau produit'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input name="name" required defaultValue={editing?.name} className="input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prix (FCFA) *</label>
                  <input name="price" type="number" required defaultValue={Number(editing?.price) || ''} className="input" />
                </div>
                <div>
                  <label className="label">Prix original (barré)</label>
                  <input name="originalPrice" type="number" defaultValue={Number(editing?.originalPrice) || ''} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Catégorie *</label>
                <select name="categoryId" required defaultValue={editing?.category?.id ?? ''} className="input">
                  <option value="">Sélectionner...</option>
                  {(categories as any[])?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea name="description" rows={3} defaultValue={editing?.description ?? ''} className="input resize-none" />
              </div>

              <div>
                <label className="label">Badge (ex : Nouveau, Promo)</label>
                <input name="badge" defaultValue={editing?.badge ?? ''} className="input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Couleurs (séparées par des virgules)</label>
                  <input
                    name="colors"
                    defaultValue={editing?.variants.filter(v => v.type === 'COLOR').map(v => v.value).join(', ')}
                    className="input"
                    placeholder="Rouge, Bleu, Vert"
                  />
                </div>
                <div>
                  <label className="label">Tailles (séparées par des virgules)</label>
                  <input
                    name="sizes"
                    defaultValue={editing?.variants.filter(v => v.type === 'SIZE').map(v => v.value).join(', ')}
                    className="input"
                    placeholder="XS, S, M, L, XL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="inStock"
                    id="inStock"
                    defaultChecked={editing?.inStock ?? true}
                    className="rounded"
                  />
                  <label htmlFor="inStock" className="text-sm font-medium text-gray-700">En stock</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    id="isFeatured"
                    defaultChecked={editing?.isFeatured ?? false}
                    className="rounded"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Coup de cœur</label>
                </div>
              </div>

              <div>
                <label className="label">
                  Images{!editing ? ' *' : ' (laisser vide pour garder les actuelles)'}
                </label>
                <input type="file" name="images" multiple accept="image/*" className="input py-2 text-sm" />
                {editing?.images && editing.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editing.images.map(img => (
                      <img key={img.id} src={img.urlThumbnail || img.url} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Annuler</button>
                <button type="submit" disabled={isCreating || isUpdating} className="btn-primary flex-1">
                  {(isCreating || isUpdating)
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : editing ? 'Enregistrer' : 'Créer le produit'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
