import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/api/categories.api';
import type { Category } from '@/types';

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<null | 'create' | Category>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: categoriesApi.getAllAdmin,
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-admin'] }); setModal(null); toast.success('Catégorie créée'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Category>) => categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-admin'] }); setModal(null); toast.success('Catégorie mise à jour'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-admin'] }); toast.success('Catégorie supprimée'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
  });

  const openCreate = () => {
    setForm({ name: '', description: '', isActive: true });
    setModal('create');
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description ?? '', isActive: cat.isActive });
    setModal(cat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'create') {
      create(form);
    } else if (typeof modal === 'object' && modal !== null) {
       update({ id: modal.id, ...form });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nom', 'Slug', 'Produits', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{cat._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirm(`Supprimer "${cat.name}" ?`) && remove(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold">{modal === 'create' ? 'Nouvelle catégorie' : `Modifier : ${(modal as Category).name}`}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Annuler</button>
                <button type="submit" disabled={isCreating || isUpdating} className="btn-primary flex-1">
                  {(isCreating || isUpdating) ? <Loader2 className="w-4 h-4 animate-spin" /> : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
