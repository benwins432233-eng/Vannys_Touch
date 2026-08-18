import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/api/categories.api';
import { getErrorMessage } from '@/utils';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  InputField,
  SkeletonList,
  Table,
  Td,
  TextareaField,
  Tr,
} from '@/components/ui';
import type { Category } from '@/types';

/** `create` pour une nouvelle catégorie, la catégorie elle-même pour une modification. */
type ModalState = null | 'create' | Category;

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalState>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: categoriesApi.getAllAdmin,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories-admin'] });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Catégorie créée');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Category>) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setModal(null);
      toast.success('Catégorie mise à jour');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast.success('Catégorie supprimée');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
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
    if (modal === 'create') create(form);
    else if (modal) update({ id: modal.id, ...form });
  };

  const isEditing = modal !== null && modal !== 'create';

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Catégories</h1>
        <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
          Nouvelle catégorie
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonList count={4} label="Chargement des catégories" />
          </div>
        ) : categories?.length === 0 ? (
          <EmptyState
            title="Aucune catégorie"
            description="Créez une première catégorie pour organiser le catalogue."
            action={<Button onClick={openCreate}>Nouvelle catégorie</Button>}
          />
        ) : (
          <Table
            caption="Liste des catégories du catalogue"
            columns={['Nom', 'Slug', 'Produits', 'Statut', 'Actions']}
          >
            {categories?.map((cat) => (
              <Tr key={cat.id}>
                <Td className="font-medium text-foreground">{cat.name}</Td>
                <Td className="font-mono text-xs">{cat.slug}</Td>
                <Td>{cat._count?.products ?? 0}</Td>
                <Td>
                  <Badge tone={cat.isActive ? 'success' : 'neutral'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <IconButton
                      label={`Modifier ${cat.name}`}
                      tone="primary"
                      icon={<Pencil className="w-4 h-4" />}
                      onClick={() => openEdit(cat)}
                    />
                    <IconButton
                      label={`Supprimer ${cat.name}`}
                      tone="destructive"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setToDelete(cat)}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Création / modification */}
      <Dialog
        open={modal !== null}
        onClose={() => setModal(null)}
        title={isEditing ? `Modifier : ${modal.name}` : 'Nouvelle catégorie'}
        description={
          isEditing
            ? 'Modifiez le nom, la description ou la visibilité de cette catégorie.'
            : 'Renseignez le nom de la catégorie ; son identifiant est généré automatiquement.'
        }
      >
        <form id="form-categorie" onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Nom"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextareaField
            label="Description"
            hint="Facultatif."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-input accent-[hsl(var(--primary))]"
            />
            Visible dans la boutique
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModal(null)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={isCreating || isUpdating}>
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Suppression */}
      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Supprimer la catégorie"
        description={
          toDelete
            ? `« ${toDelete.name} » sera définitivement supprimée. Cette action est irréversible.`
            : ''
        }
        footer={
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setToDelete(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              isLoading={isDeleting}
              onClick={() => toDelete && remove(toDelete.id)}
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Les produits rattachés à cette catégorie ne seront pas supprimés, mais ils n'apparaîtront
          plus dans ce classement.
        </p>
      </Dialog>
    </div>
  );
}
