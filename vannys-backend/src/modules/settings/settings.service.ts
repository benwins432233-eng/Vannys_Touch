import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  defaultSettings,
  parseSettingValue,
  serializeSettingValue,
  SETTINGS,
  SETTINGS_BY_KEY,
} from './settings-catalog';

/** Montants de livraison, forme attendue par le panier et les commandes. */
export interface ShippingSettings {
  fee: number;
  freeThreshold: number;
}

/**
 * Durée de vie du cache mémoire.
 *
 * Les réglages sont relus à chaque calcul de panier : sans cache, chaque
 * affichage coûterait une requête de plus. Court, parce que plusieurs instances
 * ont chacune le leur — une modification met au plus une minute à se propager.
 */
const CACHE_TTL_MS = 60_000;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private cache: Record<string, unknown> | null = null;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tous les réglages, valeurs par défaut comprises.
   *
   * Une clé absente de la base prend sa valeur par défaut : la boutique doit
   * fonctionner sur une base fraîchement migrée, avant tout passage du seed.
   */
  async getAll(): Promise<Record<string, unknown>> {
    if (this.cache && Date.now() - this.cachedAt < CACHE_TTL_MS) return this.cache;

    const values = defaultSettings();
    try {
      const rows = await this.prisma.setting.findMany();
      for (const row of rows) {
        // Une clé retirée du catalogue reste en base sans être exposée :
        // la supprimer ferait perdre la valeur si le réglage revient.
        if (!SETTINGS_BY_KEY.has(row.key)) continue;
        values[row.key] = parseSettingValue(row.value, row.type);
      }
    } catch (error) {
      // Base injoignable : mieux vaut servir les valeurs par défaut qu'une
      // page d'erreur — le tarif affiché sera celui du catalogue.
      this.logger.error(`Réglages illisibles, valeurs par défaut utilisées : ${(error as Error).message}`);
    }

    this.cache = values;
    this.cachedAt = Date.now();
    return values;
  }

  /** Raccourci pour le calcul des frais, seul usage sur le chemin critique. */
  async getShipping(): Promise<ShippingSettings> {
    const settings = await this.getAll();
    return {
      fee: Number(settings['shipping.fee'] ?? 0),
      freeThreshold: Number(settings['shipping.freeThreshold'] ?? 0),
    };
  }

  /**
   * Applique une modification partielle.
   * Toute clé inconnue ou toute valeur refusée annule l'ensemble : une mise à
   * jour à moitié appliquée laisserait la boutique dans un état incohérent.
   */
  async update(changes: Record<string, unknown>): Promise<Record<string, unknown>> {
    const entries = Object.entries(changes);
    if (!entries.length) throw new BadRequestException('Aucun réglage à mettre à jour.');

    const errors: string[] = [];
    for (const [key, value] of entries) {
      const definition = SETTINGS_BY_KEY.get(key);
      if (!definition) {
        errors.push(`Réglage inconnu : ${key}.`);
        continue;
      }
      const error = definition.validate?.(value);
      if (error) errors.push(error);
    }
    if (errors.length) throw new BadRequestException(errors);

    await this.prisma.$transaction(
      entries.map(([key, value]) => {
        const definition = SETTINGS_BY_KEY.get(key)!;
        const serialized = serializeSettingValue(value, definition.type);
        return this.prisma.setting.upsert({
          where: { key },
          create: { key, value: serialized, type: definition.type },
          update: { value: serialized },
        });
      }),
    );

    this.invalidate();
    return this.getAll();
  }

  /** Catalogue exposé à l'administration : libellés et types des réglages. */
  describe() {
    return SETTINGS.map(({ key, type, label }) => ({ key, type, label }));
  }

  private invalidate(): void {
    this.cache = null;
    this.cachedAt = 0;
  }
}
