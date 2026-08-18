import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/api/notifications.api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/utils';

/** Le navigateur sait-il faire du push ? Safari iOS ne le peut qu'en PWA installée. */
const browserSupportsPush = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** La clé VAPID voyage en base64url ; l'API navigateur veut un Uint8Array. */
const decodeVapidKey = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return '';
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

export interface PushState {
  /** Le push est-il proposable ici et maintenant ? */
  available: boolean;
  subscribed: boolean;
  isBusy: boolean;
  /** Pourquoi le push n'est pas proposé, quand il ne l'est pas. */
  unavailableReason?: string;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Abonnement de cet appareil aux notifications push.
 *
 * Facultatif de bout en bout : sans clés VAPID côté serveur, sans service
 * worker, ou avec une permission refusée, l'application se comporte exactement
 * pareil — les notifications restent consultables dans l'application.
 */
export function usePush(): PushState {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [subscribed, setSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['push-config'],
    queryFn: notificationsApi.pushConfig,
    enabled: isAuthenticated && browserSupportsPush(),
    staleTime: Infinity,
  });

  // État réel de l'abonnement : la permission peut avoir été révoquée depuis
  // les réglages du navigateur, sans que l'application en soit informée.
  useEffect(() => {
    if (!browserSupportsPush()) return;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .catch(() => setSubscribed(false));
  }, [config]);

  const subscribe = useCallback(async () => {
    if (!config?.enabled || !config.publicKey) return;
    setIsBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast('Notifications refusées. Vous pouvez les réactiver depuis votre navigateur.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(config.publicKey),
      });

      await notificationsApi.subscribePush({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
        userAgent: navigator.userAgent.slice(0, 255),
      });

      setSubscribed(true);
      toast.success('Notifications activées sur cet appareil.');
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible d'activer les notifications ici."));
    } finally {
      setIsBusy(false);
    }
  }, [config]);

  const unsubscribe = useCallback(async () => {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Le serveur d'abord : si le navigateur se désabonne et que l'appel
        // échoue, le serveur enverrait dans le vide jusqu'à expiration.
        await notificationsApi.unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast.success('Notifications désactivées sur cet appareil.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, []);

  if (!browserSupportsPush()) {
    return {
      available: false,
      subscribed: false,
      isBusy: false,
      unavailableReason:
        "Ce navigateur ne prend pas en charge les notifications push. Sur iPhone, installez d'abord la boutique sur votre écran d'accueil.",
      subscribe: async () => {},
      unsubscribe: async () => {},
    };
  }

  return {
    available: Boolean(config?.enabled),
    subscribed,
    isBusy,
    unavailableReason: config && !config.enabled ? 'Les notifications push ne sont pas encore activées sur la boutique.' : undefined,
    subscribe,
    unsubscribe,
  };
}
