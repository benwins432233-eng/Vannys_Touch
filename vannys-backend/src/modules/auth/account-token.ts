import { createHash, randomBytes } from 'crypto';

/**
 * Jetons de compte : vérification d'email et réinitialisation de mot de passe.
 *
 * Le jeton part en clair dans l'email et n'est stocké que sous forme
 * d'empreinte. Une fuite de la base ne permet donc de prendre aucun compte :
 * SHA-256 n'est pas inversible, et les 256 bits d'aléa rendent toute recherche
 * exhaustive hors de portée. Un hachage lent type bcrypt serait inutile ici —
 * il protège des secrets faibles, pas des secrets tirés au sort.
 */

/** Durées de validité, en minutes. */
export const TOKEN_TTL_MINUTES = {
  email_verification: 24 * 60,
  password_reset: 2 * 60,
} as const;

/**
 * Délai minimal entre deux demandes du même type pour un même compte.
 * Sans lui, une seule adresse suffit à noyer une boîte mail sous les emails.
 */
export const RESEND_COOLDOWN_MINUTES = 2;

export const generateToken = (): string => randomBytes(32).toString('hex');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const expiryFor = (
  type: keyof typeof TOKEN_TTL_MINUTES,
  from: Date = new Date(),
): Date => new Date(from.getTime() + TOKEN_TTL_MINUTES[type] * 60_000);

interface StoredToken {
  expiresAt: Date;
  usedAt: Date | null;
}

/** Un jeton n'est utilisable qu'une fois, et seulement avant son expiration. */
export const isTokenUsable = (token: StoredToken, now: Date = new Date()): boolean =>
  token.usedAt === null && token.expiresAt.getTime() > now.getTime();

export const isCoolingDown = (
  lastRequestedAt: Date | null | undefined,
  now: Date = new Date(),
): boolean => {
  if (!lastRequestedAt) return false;
  return now.getTime() - lastRequestedAt.getTime() < RESEND_COOLDOWN_MINUTES * 60_000;
};
