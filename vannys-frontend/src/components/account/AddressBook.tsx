import { useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '@/hooks/use-addresses';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  InputField,
  SkeletonList,
} from '@/components/ui';
import type { Address } from '@/types';

/** `create` pour une nouvelle adresse, l'adresse elle-même pour une modification. */
type Editing = null | 'create' | Address;

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  landmark: '',
};

type AddressForm = typeof emptyForm;

const formFrom = (address: Address): AddressForm => ({
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  city: address.city,
  district: address.district,
  address: address.address,
  landmark: address.landmark ?? '',
});

/** Carnet d'adresses : liste, ajout, modification, adresse par défaut. */
export function AddressBook() {
  const { data: addresses, isLoading } = useAddresses();
  const { mutate: create, isPending: isCreating } = useCreateAddress();
  const { mutate: update, isPending: isUpdating } = useUpdateAddress();
  const { mutate: setDefault } = useSetDefaultAddress();
  const { mutate: remove, isPending: isDeleting } = useDeleteAddress();

  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing('create');
  };

  const openEdit = (address: Address) => {
    setForm(formFrom(address));
    setEditing(address);
  };

  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, landmark: form.landmark || undefined };
    const done = { onSuccess: () => setEditing(null) };

    if (editing === 'create') create(payload, done);
    else if (editing) update({ id: editing.id, ...payload }, done);
  };

  const isEditing = editing !== null && editing !== 'create';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
          Mes adresses de livraison
        </h2>
        <Button
          size="sm"
          onClick={openCreate}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
        >
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList count={2} label="Chargement de vos adresses" />
      ) : !addresses?.length ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="Aucune adresse enregistrée"
          description="Enregistrez une adresse pour ne plus la ressaisir à chaque commande."
          action={<Button onClick={openCreate}>Ajouter une adresse</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex items-start justify-between gap-4 p-4 rounded-token border border-border"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{address.label}</span>
                  {address.isDefault && <Badge tone="gold">Par défaut</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {address.district}, {address.city}
                </p>
                <p className="text-sm text-muted-foreground">{address.address}</p>
                {address.landmark && (
                  <p className="text-sm text-muted-foreground">Repère : {address.landmark}</p>
                )}
                <p className="text-sm text-muted-foreground">{address.phone}</p>
              </div>

              <div className="flex gap-1 shrink-0">
                {!address.isDefault && (
                  <IconButton
                    label={`Définir « ${address.label} » comme adresse par défaut`}
                    tone="primary"
                    icon={<Star className="w-4 h-4" />}
                    onClick={() => setDefault(address.id)}
                  />
                )}
                <IconButton
                  label={`Modifier l'adresse « ${address.label} »`}
                  tone="primary"
                  icon={<Pencil className="w-4 h-4" />}
                  onClick={() => openEdit(address)}
                />
                <IconButton
                  label={`Supprimer l'adresse « ${address.label} »`}
                  tone="destructive"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setToDelete(address)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Ajout / modification */}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isEditing ? `Modifier « ${editing.label} »` : 'Nouvelle adresse'}
        description="Ces informations serviront à vous livrer. Les commandes déjà passées ne sont pas modifiées."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Nom de l'adresse"
            required
            maxLength={50}
            hint="Par exemple : Maison, Bureau."
            value={form.label}
            onChange={set('label')}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Nom complet"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={set('fullName')}
            />
            <InputField
              label="Téléphone"
              type="tel"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
            />
            <InputField
              label="Ville"
              required
              autoComplete="address-level2"
              placeholder="Cotonou"
              value={form.city}
              onChange={set('city')}
            />
            <InputField
              label="Arrondissement / Quartier"
              required
              placeholder="Cadjehoun"
              value={form.district}
              onChange={set('district')}
            />
          </div>
          <InputField
            label="Adresse complète"
            required
            autoComplete="street-address"
            placeholder="Rue, numéro..."
            value={form.address}
            onChange={set('address')}
          />
          <InputField
            label="Repère"
            hint="Facultatif — aide le livreur à vous trouver."
            placeholder="Près de la pharmacie..."
            value={form.landmark}
            onChange={set('landmark')}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setEditing(null)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" isLoading={isCreating || isUpdating}>
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Suppression */}
      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Supprimer cette adresse"
        description={
          toDelete
            ? `« ${toDelete.label} » sera retirée de votre carnet. Vos commandes passées gardent l'adresse à laquelle elles ont été livrées.`
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
          Si c'était votre adresse par défaut, la plus ancienne restante prend le relais.
        </p>
      </Dialog>
    </Card>
  );
}
