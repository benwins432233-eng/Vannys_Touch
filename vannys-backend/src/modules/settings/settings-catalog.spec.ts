import {
  defaultSettings,
  parseSettingValue,
  serializeSettingValue,
  SETTINGS,
  SETTINGS_BY_KEY,
} from './settings-catalog';

describe('catalogue des réglages', () => {
  it('n’a pas deux fois la même clé', () => {
    // Une clé dupliquée ferait silencieusement gagner la dernière définition.
    expect(SETTINGS_BY_KEY.size).toBe(SETTINGS.length);
  });

  it('donne à chaque réglage une valeur par défaut exploitable', () => {
    // La boutique doit fonctionner sur une base migrée mais non semée.
    for (const setting of SETTINGS) {
      const parsed = parseSettingValue(setting.defaultValue, setting.type);
      expect(parsed).not.toBeNull();
      expect(parsed).not.toBeUndefined();
      expect(setting.validate?.(parsed) ?? null).toBeNull();
    }
  });

  it('reprend les montants historiques de render.yaml', () => {
    // Le jour du déploiement, rien ne doit changer pour les clientes.
    const defaults = defaultSettings();
    expect(defaults['shipping.fee']).toBe(2500);
    expect(defaults['shipping.freeThreshold']).toBe(50000);
  });
});

describe('parseSettingValue', () => {
  it('convertit un nombre', () => {
    expect(parseSettingValue('2500', 'number')).toBe(2500);
  });

  it('retombe sur zéro plutôt que sur NaN', () => {
    // NaN se propagerait jusqu'au total affiché à la cliente.
    expect(parseSettingValue('abc', 'number')).toBe(0);
  });

  it('convertit un booléen', () => {
    expect(parseSettingValue('true', 'boolean')).toBe(true);
    expect(parseSettingValue('false', 'boolean')).toBe(false);
  });

  it('retourne null sur un JSON illisible plutôt que de lever', () => {
    // Une valeur corrompue ne doit pas faire tomber toute la boutique.
    expect(parseSettingValue('{oops', 'json')).toBeNull();
  });

  it('fait l’aller-retour sur une liste', () => {
    const methods = ['CASH_ON_DELIVERY', 'MTN'];
    expect(parseSettingValue(serializeSettingValue(methods, 'json'), 'json')).toEqual(methods);
  });
});

describe('validation', () => {
  const validate = (key: string, value: unknown) => SETTINGS_BY_KEY.get(key)!.validate!(value);

  it('refuse des frais de livraison négatifs', () => {
    expect(validate('shipping.fee', -1)).toContain('négatif');
    expect(validate('shipping.fee', 0)).toBeNull();
  });

  it('refuse un nom de boutique vide', () => {
    expect(validate('shop.name', '   ')).toContain('vide');
  });

  it('refuse un WhatsApp autrement qu’en chiffres', () => {
    // wa.me n'accepte que des chiffres : un « + » casse le lien.
    expect(validate('shop.whatsapp', '+229 01 41 19 66 51')).toContain('chiffres');
    expect(validate('shop.whatsapp', '2290141196651')).toBeNull();
  });

  it('refuse un email mal formé', () => {
    expect(validate('shop.email', 'pas-un-email')).toContain('invalide');
    expect(validate('shop.email', 'contact@exemple.com')).toBeNull();
  });

  it('refuse de désactiver tous les modes de paiement', () => {
    // Sans mode de règlement, plus personne ne peut commander.
    expect(validate('payment.methods', [])).toContain('Au moins un');
  });

  it('refuse un mode de paiement inconnu', () => {
    expect(validate('payment.methods', ['BITCOIN'])).toContain('BITCOIN');
  });
});
