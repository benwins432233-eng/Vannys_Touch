import { settings_type } from '@prisma/client';

/**
 * Catalogue des réglages de boutique.
 *
 * Une seule source de vérité : clé, type, valeur par défaut et validation.
 * Sans elle, `PUT /admin/settings` accepterait n'importe quelle clé et la
 * boutique se retrouverait avec des réglages fantômes que personne ne lit.
 */

export interface SettingDefinition {
  key: string;
  type: settings_type;
  /** Valeur appliquée tant que l'administration n'a rien saisi. */
  defaultValue: string;
  label: string;
  /** Message d'erreur si la valeur est refusée ; `null` si elle est acceptée. */
  validate?: (value: unknown) => string | null;
}

const positiveNumber = (label: string) => (value: unknown): string | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${label} doit être un nombre.`;
  if (parsed < 0) return `${label} ne peut pas être négatif.`;
  return null;
};

const nonEmptyText = (label: string, max: number) => (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return `${label} ne peut pas être vide.`;
  if (value.length > max) return `${label} dépasse ${max} caractères.`;
  return null;
};

const optionalText = (label: string, max: number) => (value: unknown): string | null => {
  if (typeof value !== 'string') return `${label} doit être un texte.`;
  if (value.length > max) return `${label} dépasse ${max} caractères.`;
  return null;
};

/** Modes de règlement acceptés par le tunnel de commande. */
const KNOWN_PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'MTN', 'MOOV', 'ORANGE', 'CELTIIS'];

export const SETTINGS: SettingDefinition[] = [
  // ── Livraison ────────────────────────────────────────────────
  {
    key: 'shipping.fee',
    type: settings_type.number,
    // Valeur historique de render.yaml : la migration part de là pour que rien
    // ne change le jour du déploiement.
    defaultValue: '2500',
    label: 'Frais de livraison',
    validate: positiveNumber('Les frais de livraison'),
  },
  {
    key: 'shipping.freeThreshold',
    type: settings_type.number,
    defaultValue: '50000',
    label: 'Seuil de livraison gratuite',
    validate: positiveNumber('Le seuil de livraison gratuite'),
  },
  {
    key: 'shipping.message',
    type: settings_type.string,
    defaultValue: 'Livraison à domicile dans tout le Bénin sous 24 à 72 heures.',
    label: 'Message de livraison',
    validate: optionalText('Le message de livraison', 300),
  },

  // ── Identité de la boutique ──────────────────────────────────
  {
    key: 'shop.name',
    type: settings_type.string,
    defaultValue: 'Vannys Touch',
    label: 'Nom de la boutique',
    validate: nonEmptyText('Le nom de la boutique', 100),
  },
  {
    key: 'shop.phone',
    type: settings_type.string,
    defaultValue: '+229 01 41 19 66 51',
    label: 'Téléphone',
    validate: optionalText('Le téléphone', 30),
  },
  {
    key: 'shop.whatsapp',
    type: settings_type.string,
    defaultValue: '2290141196651',
    label: 'Numéro WhatsApp',
    validate: (value) => {
      if (typeof value !== 'string') return 'Le numéro WhatsApp doit être un texte.';
      if (value && !/^\d{8,15}$/.test(value)) {
        // wa.me n'accepte que des chiffres : un « + » ou des espaces cassent le lien.
        return 'Le numéro WhatsApp ne doit contenir que des chiffres, indicatif compris.';
      }
      return null;
    },
  },
  {
    key: 'shop.email',
    type: settings_type.string,
    defaultValue: 'vannystouch.shop@gmail.com',
    label: 'Email de contact',
    validate: (value) => {
      if (typeof value !== 'string') return "L'email doit être un texte.";
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "L'email est invalide.";
      return null;
    },
  },
  {
    key: 'shop.address',
    type: settings_type.string,
    defaultValue: 'F82W+4P8, Abomey-Calavi, Bénin',
    label: 'Adresse',
    validate: optionalText("L'adresse", 200),
  },

  // ── Paiement ─────────────────────────────────────────────────
  {
    key: 'payment.methods',
    type: settings_type.json,
    defaultValue: JSON.stringify(['CASH_ON_DELIVERY']),
    label: 'Modes de paiement activés',
    validate: (value) => {
      if (!Array.isArray(value)) return 'Les modes de paiement doivent être une liste.';
      if (!value.length) return 'Au moins un mode de paiement doit rester activé.';
      const unknown = value.filter((method) => !KNOWN_PAYMENT_METHODS.includes(method));
      if (unknown.length) return `Mode de paiement inconnu : ${unknown.join(', ')}.`;
      return null;
    },
  },
];

export const SETTINGS_BY_KEY = new Map(SETTINGS.map((setting) => [setting.key, setting]));

/** Convertit la valeur stockée en texte vers son type déclaré. */
export const parseSettingValue = (
  raw: string,
  type: settings_type,
): string | number | boolean | unknown => {
  switch (type) {
    case settings_type.number: {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    case settings_type.boolean:
      return raw === 'true' || raw === '1';
    case settings_type.json:
      try {
        return JSON.parse(raw);
      } catch {
        // Une valeur illisible ne doit pas faire tomber la boutique entière.
        return null;
      }
    default:
      return raw;
  }
};

/** Sérialise une valeur typée pour la colonne TEXT. */
export const serializeSettingValue = (value: unknown, type: settings_type): string => {
  if (type === settings_type.json) return JSON.stringify(value);
  if (type === settings_type.boolean) return value ? 'true' : 'false';
  return String(value);
};

/** Réglages par défaut, sous la forme renvoyée par l'API. */
export const defaultSettings = (): Record<string, unknown> =>
  Object.fromEntries(
    SETTINGS.map((setting) => [
      setting.key,
      parseSettingValue(setting.defaultValue, setting.type),
    ]),
  );
