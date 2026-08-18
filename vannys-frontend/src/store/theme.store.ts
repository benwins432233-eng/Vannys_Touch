import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** Choix de l'utilisateur. 'system' suit la préférence du système d'exploitation. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Applique (ou retire) la classe `dark` sur <html> — Tailwind est en darkMode: ['class']. */
export const applyTheme = (mode: ThemeMode): void => {
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Au premier chargement, on suit la préférence du système (§4.2).
      mode: 'system',
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
    }),
    {
      name: 'vannys-theme',
      // Au rechargement, réappliquer le choix mémorisé avant le premier rendu utile.
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.mode ?? 'system');
      },
    },
  ),
);

/**
 * Suit les changements de préférence système tant que l'utilisateur est en mode
 * 'system'. Renvoie la fonction de désabonnement.
 */
export const watchSystemTheme = (): (() => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (useThemeStore.getState().mode === 'system') applyTheme('system');
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
