import { IsObject, IsNotEmptyObject } from 'class-validator';

/**
 * Mise à jour partielle des réglages.
 *
 * Les clés ne sont pas déclarées ici mais validées contre le catalogue
 * (`settings-catalog.ts`) : lister chaque réglage dans un DTO obligerait à le
 * faire deux fois, et les deux listes finiraient par diverger.
 */
export class UpdateSettingsDto {
  @IsObject()
  @IsNotEmptyObject()
  settings: Record<string, unknown>;
}
