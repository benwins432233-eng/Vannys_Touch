import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-products';
import { apiClient } from '@/api/client';
import { formatPrice } from '@/utils';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  InputField,
  SelectField,
  SkeletonList,
  Table,
  Td,
  TextareaField,
  Tr,
} from '@/components/ui';
import type { Category, PaginatedResponse, Product } from '@/types';

/** `create` pour un nouveau produit, le produit lui-même pour une modification. */
type ModalState = null | 'create' | Product;

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await apiClient.get<{ data: PaginatedResponse<Product> }>(`/products?${params}`);
      return res.data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Category[] }>('/categories/admin/all');
      return res.data.data;
    },
  });

  const { mutate: create, isPending: isCreating } = useCreateProduct();
  const { mutate: update, isPending: isUpdating } = useUpdateProduct();
  const { mutate: remove, isPending: isDeleting } = useDeleteProduct();

  const editing = modal !== null && modal !== 'create' ? modal : null;

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

    // Cases à cocher
    const inStockEl = form.elements.namedItem('inStock') as HTMLInputElement | null;
    const isFeaturedEl = form.elements.namedItem('isFeatured') as HTMLInputElement | null;
    fd.append('inStock', inStockEl?.checked ? 'true' : 'false');
    fd.append('isFeatured', isFeaturedEl?.checked ? 'true' : 'false');

    // Couleurs et tailles : envoyées en chaîne séparée par des virgules,
    // que le backend découpe via le Transform toStringArray
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
    } else if (editing) {
      update({ id: editing.id, data: fd }, { onSuccess: () => setModal(null) });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Produits</h1>
        <Button
          onClick={() => setModal('create')}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
        >
          Nouveau produit
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative mb-5 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Rechercher un produit"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input pl-9 py-2.5"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonList count={5} label="Chargement des produits" />
          </div>
        ) : data?.data.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun produit ne correspond' : 'Aucun produit'}
            description={
              search
                ? 'Essayez un autre mot-clé.'
                : 'Ajoutez un premier article pour remplir la boutique.'
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Effacer la recherche
                </Button>
              ) : (
                <Button onClick={() => setModal('create')}>Nouveau produit</Button>
              )
            }
          />
        ) : (
          <Table
            caption="Liste des produits du catalogue"
            columns={['Image', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Actions']}
          >
            {data?.data.map((product) => {
              const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
              return (
                <Tr key={product.id}>
                  <Td>
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-muted">
                      {img && (
                        <img
                          src={img.urlThumbnail || img.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Td>
                  <Td>
                    <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                    {product.badge && (
                      <Badge tone="gold" className="mt-1">
                        {product.badge}
                      </Badge>
                    )}
                  </Td>
                  <Td>{product.category?.name}</Td>
                  <Td className="font-semibold text-foreground whitespace-nowrap">
                    {formatPrice(product.price)}
                  </Td>
                  <Td>
                    <Badge tone={product.inStock ? 'success' : 'destructive'}>
                      {product.inStock ? 'En stock' : 'Épuisé'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <IconButton
                        label={`Modifier ${product.name}`}
                        tone="primary"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={() => setModal(product)}
                      />
                      <IconButton
                        label={`Supprimer ${product.name}`}
                        tone="destructive"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => setToDelete(product)}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>

      {data && data.meta.lastPage > 1 && (
        <nav className="flex justify-end items-center gap-2 mt-4" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
            Page {page} sur {data.meta.lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </nav>
      )}

      {/* Création / modification */}
      <Dialog
        open={modal !== null}
        onClose={() => setModal(null)}
        title={editing ? `Modifier : ${editing.name}` : 'Nouveau produit'}
        description={
          editing
            ? 'Modifiez la fiche produit. Les images actuelles sont conservées si vous n’en ajoutez pas.'
            : 'Renseignez la fiche du produit : nom, prix, catégorie et au moins une photo.'
        }
      >
        {/* La clé force la réinitialisation des champs non contrôlés d'un produit à l'autre. */}
        <form key={editing?.id ?? 'create'} onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Nom" name="name" required defaultValue={editing?.name} />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Prix (FCFA)"
              name="price"
              type="number"
              min={0}
              required
              defaultValue={Number(editing?.price) || ''}
            />
            <InputField
              label="Prix original (barré)"
              name="originalPrice"
              type="number"
              min={0}
              hint="Facultatif."
              defaultValue={Number(editing?.originalPrice) || ''}
            />
          </div>

          <SelectField
            label="Catégorie"
            name="categoryId"
            required
            defaultValue={editing?.category?.id ?? ''}
          >
            <option value="">Sélectionner...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <TextareaField
            label="Description"
            name="description"
            rows={3}
            defaultValue={editing?.description ?? ''}
          />

          <InputField
            label="Badge"
            name="badge"
            hint="Par exemple : Nouveau, Promo."
            defaultValue={editing?.badge ?? ''}
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Couleurs"
              name="colors"
              hint="Séparées par des virgules."
              placeholder="Rouge, Bleu, Vert"
              defaultValue={editing?.variants
                .filter((v) => v.type === 'COLOR')
                .map((v) => v.value)
                .join(', ')}
            />
            <InputField
              label="Tailles"
              name="sizes"
              hint="Séparées par des virgules."
              placeholder="XS, S, M, L, XL"
              defaultValue={editing?.variants
                .filter((v) => v.type === 'SIZE')
                .map((v) => v.value)
                .join(', ')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="inStock"
                defaultChecked={editing?.inStock ?? true}
                className="rounded border-input accent-[hsl(var(--primary))]"
              />
              En stock
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={editing?.isFeatured ?? false}
                className="rounded border-input accent-[hsl(var(--primary))]"
              />
              Coup de cœur
            </label>
          </div>

          <div>
            <InputField
              label="Images"
              name="images"
              type="file"
              multiple
              accept="image/*"
              required={!editing}
              hint={
                editing
                  ? 'Laisser vide pour conserver les images actuelles.'
                  : 'Au moins une photo du produit.'
              }
              className="py-2 text-sm"
            />
            {editing?.images && editing.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {editing.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.urlThumbnail || img.url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-border"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModal(null)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={isCreating || isUpdating}>
              {editing ? 'Enregistrer' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Suppression */}
      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Supprimer le produit"
        description={
          toDelete
            ? `« ${toDelete.name} » sera retiré du catalogue. Cette action est irréversible.`
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
              onClick={() =>
                toDelete && remove(toDelete.id, { onSuccess: () => setToDelete(null) })
              }
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Les commandes déjà passées conservent le nom et le prix de l'article : leur historique
          n'est pas modifié.
        </p>
      </Dialog>
    </div>
  );
}
