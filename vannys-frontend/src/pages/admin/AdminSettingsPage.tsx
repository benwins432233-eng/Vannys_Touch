import { useEffect, useState } from 'react';
import { Save, Store, Truck, Wallet } from 'lucide-react';
import { useAdminSettings, useUpdateSettings } from '@/hooks/use-settings';
import {
  Button,
  Card,
  ErrorState,
  InputField,
  SkeletonList,
  TextareaField,
} from '@/components/ui';
import type { PaymentMethod, ShopSettings } from '@/types';

/** Libellés des modes de règlement — l'API ne renvoie que les identifiants. */
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: 'Paiement à la livraison',
  MTN: 'MTN Mobile Money',
  MOOV: 'Moov Money',
  ORANGE: 'Orange Money',
  CELTIIS: 'Celtiis Cash',
};

const PAYMENT_ORDER: PaymentMethod[] = [
  'CASH_ON_DELIVERY',
  'MTN',
  'MOOV',
  'ORANGE',
  'CELTIIS',
];

export function AdminSettingsPage() {
  const { data, isLoading, isError, refetch } = useAdminSettings();
  const { mutate: save, isPending } = useUpdateSettings();
  const [form, setForm] = useState<ShopSettings | null>(null);

  // Le formulaire part des valeurs du serveur ; on ne le réinitialise pas à
  // chaque nouvelle réponse, sinon une saisie en cours serait écrasée.
  useEffect(() => {
    if (data && !form) setForm(data.values);
  }, [data, form]);

  if (isLoading || !form) {
    return <SkeletonList count={3} label="Chargement des réglages" />;
  }

  if (isError) {
    return (
      <ErrorState title="Les réglages n'ont pas pu être chargés" onRetry={() => refetch()} />
    );
  }

  const set = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setNumber = (key: 'shipping.fee' | 'shipping.freeThreshold') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Math.max(0, Number(e.target.value) || 0));

  const setText = (key: keyof ShopSettings) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => set(key, e.target.value as ShopSettings[typeof key]);

  const togglePayment = (method: PaymentMethod) => {
    const current = form['payment.methods'];
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    set('payment.methods', next);
  };

  // Le serveur refuse aussi une liste vide ; le dire ici évite l'aller-retour.
  const noPaymentMethod = form['payment.methods'].length === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Réglages</h1>
        <p className="text-muted-foreground mt-1">
          Ces valeurs s'appliquent immédiatement à la boutique, sans redéploiement.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(form);
        }}
        className="space-y-6 max-w-3xl"
      >
        {/* Livraison */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" aria-hidden="true" />
            Livraison
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Frais de livraison (FCFA)"
              type="number"
              min={0}
              value={form['shipping.fee']}
              onChange={setNumber('shipping.fee')}
            />
            <InputField
              label="Livraison gratuite à partir de (FCFA)"
              type="number"
              min={0}
              hint="Le seuil est inclus : atteint, la livraison est offerte."
              value={form['shipping.freeThreshold']}
              onChange={setNumber('shipping.freeThreshold')}
            />
            <div className="sm:col-span-2">
              <TextareaField
                label="Message de livraison"
                rows={2}
                hint="Affiché aux clientes pendant la commande."
                value={form['shipping.message']}
                onChange={setText('shipping.message')}
              />
            </div>
          </div>
        </Card>

        {/* Identité */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" aria-hidden="true" />
            Coordonnées de la boutique
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Nom de la boutique"
              required
              value={form['shop.name']}
              onChange={setText('shop.name')}
            />
            <InputField
              label="Email de contact"
              type="email"
              value={form['shop.email']}
              onChange={setText('shop.email')}
            />
            <InputField
              label="Téléphone affiché"
              value={form['shop.phone']}
              onChange={setText('shop.phone')}
            />
            <InputField
              label="Numéro WhatsApp"
              hint="Chiffres uniquement, indicatif compris : 2290141196651."
              value={form['shop.whatsapp']}
              onChange={setText('shop.whatsapp')}
            />
            <div className="sm:col-span-2">
              <InputField
                label="Adresse"
                value={form['shop.address']}
                onChange={setText('shop.address')}
              />
            </div>
          </div>
        </Card>

        {/* Paiement */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" aria-hidden="true" />
            Modes de paiement
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Au moins un mode doit rester activé, sans quoi personne ne peut commander.
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Modes de paiement activés</legend>
            {PAYMENT_ORDER.map((method) => (
              <label
                key={method}
                className="flex items-center gap-3 text-sm font-medium text-foreground"
              >
                <input
                  type="checkbox"
                  checked={form['payment.methods'].includes(method)}
                  onChange={() => togglePayment(method)}
                  className="rounded border-input accent-[hsl(var(--primary))]"
                />
                {PAYMENT_LABELS[method]}
              </label>
            ))}
          </fieldset>
          {noPaymentMethod && (
            <p className="text-sm text-destructive mt-3" role="alert">
              Activez au moins un mode de paiement.
            </p>
          )}
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            isLoading={isPending}
            disabled={noPaymentMethod}
            leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer les réglages'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => data && setForm(data.values)}
            disabled={isPending}
          >
            Annuler mes modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
