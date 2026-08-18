import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '@/api/settings.api';
import { getErrorMessage } from '@/utils';
import type { ShopSettings } from '@/types';

export const SETTINGS_KEY = 'settings';

/**
 * Valeurs de repli.
 *
 * Utilisées uniquement le temps du premier chargement, ou si l'API est
 * injoignable : mieux vaut un tarif qui s'affiche qu'un écran vide. Le serveur
 * recalcule de toute façon tous les montants à la commande, ces valeurs ne
 * servent qu'à l'affichage.
 */
export const FALLBACK_SETTINGS: ShopSettings = {
  'shipping.fee': 2500,
  'shipping.freeThreshold': 50000,
  'shipping.message': 'Livraison à domicile dans tout le Bénin.',
  'shop.name': 'Vannys Touch',
  'shop.phone': '',
  'shop.whatsapp': '',
  'shop.email': '',
  'shop.address': '',
  'payment.methods': ['CASH_ON_DELIVERY'],
};

/**
 * Réglages de boutique.
 *
 * Publics et rarement modifiés : gardés longtemps en cache plutôt que relus à
 * chaque page. Un changement en administration invalide la clé.
 */
export const useSettings = (): ShopSettings => {
  const { data } = useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: settingsApi.get,
    staleTime: 10 * 60 * 1000,
  });

  return data ?? FALLBACK_SETTINGS;
};

export const useAdminSettings = () =>
  useQuery({
    queryKey: [SETTINGS_KEY, 'admin'],
    queryFn: settingsApi.getForAdmin,
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<ShopSettings>) => settingsApi.update(settings),
    onSuccess: () => {
      // La boutique publique doit refléter le changement immédiatement.
      qc.invalidateQueries({ queryKey: [SETTINGS_KEY] });
      toast.success('Réglages enregistrés.');
    },
    // Le serveur renvoie la liste des valeurs refusées : son message est plus
    // utile qu'un « erreur » générique.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
