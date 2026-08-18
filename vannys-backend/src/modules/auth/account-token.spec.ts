import {
  expiryFor,
  generateToken,
  hashToken,
  isCoolingDown,
  isTokenUsable,
  RESEND_COOLDOWN_MINUTES,
  TOKEN_TTL_MINUTES,
} from './account-token';

describe('generateToken', () => {
  it('produit un jeton de 256 bits en hexadécimal', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ne répète pas le même jeton', () => {
    const tokens = new Set(Array.from({ length: 200 }, generateToken));
    expect(tokens.size).toBe(200);
  });
});

describe('hashToken', () => {
  it('produit une empreinte stable de 64 caractères', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toHaveLength(64);
  });

  it('ne laisse pas deviner le jeton', () => {
    // Deux jetons voisins doivent donner des empreintes sans rapport.
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('tient dans la colonne VARCHAR(64)', () => {
    expect(hashToken(generateToken()).length).toBeLessThanOrEqual(64);
  });
});

describe('expiryFor', () => {
  const now = new Date('2026-08-18T10:00:00Z');

  it('donne 24 heures à une vérification d’email', () => {
    expect(TOKEN_TTL_MINUTES.email_verification).toBe(24 * 60);
    expect(expiryFor('email_verification', now).toISOString()).toBe('2026-08-19T10:00:00.000Z');
  });

  it('donne 2 heures à une réinitialisation de mot de passe', () => {
    // Plus court : un lien de réinitialisation est bien plus sensible.
    expect(TOKEN_TTL_MINUTES.password_reset).toBe(2 * 60);
    expect(expiryFor('password_reset', now).toISOString()).toBe('2026-08-18T12:00:00.000Z');
  });
});

describe('isTokenUsable', () => {
  const now = new Date('2026-08-18T10:00:00Z');
  const future = new Date('2026-08-18T11:00:00Z');
  const past = new Date('2026-08-18T09:00:00Z');

  it('accepte un jeton neuf et non expiré', () => {
    expect(isTokenUsable({ expiresAt: future, usedAt: null }, now)).toBe(true);
  });

  it('refuse un jeton déjà consommé', () => {
    expect(isTokenUsable({ expiresAt: future, usedAt: past }, now)).toBe(false);
  });

  it('refuse un jeton expiré', () => {
    expect(isTokenUsable({ expiresAt: past, usedAt: null }, now)).toBe(false);
  });

  it('refuse un jeton qui expire à l’instant même', () => {
    expect(isTokenUsable({ expiresAt: now, usedAt: null }, now)).toBe(false);
  });
});

describe('isCoolingDown', () => {
  const now = new Date('2026-08-18T10:00:00Z');

  it('laisse passer une première demande', () => {
    expect(isCoolingDown(null, now)).toBe(false);
    expect(isCoolingDown(undefined, now)).toBe(false);
  });

  it('bloque une demande immédiatement répétée', () => {
    // Sans ce délai, une seule adresse suffit à noyer une boîte mail.
    const justNow = new Date(now.getTime() - 30_000);
    expect(isCoolingDown(justNow, now)).toBe(true);
  });

  it('laisse repasser une demande une fois le délai écoulé', () => {
    const old = new Date(now.getTime() - (RESEND_COOLDOWN_MINUTES * 60_000 + 1000));
    expect(isCoolingDown(old, now)).toBe(false);
  });
});
