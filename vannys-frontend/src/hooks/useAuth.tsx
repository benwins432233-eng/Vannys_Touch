import {
  createContext, useContext, useState,
  useCallback, useEffect, type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { authService } from '@/api/services';
import { tokenStorage, ApiException } from '@/api/client';
import { useCart } from '@/hooks/useCart';
import type { User, LoginPayload, RegisterPayload } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { loadCartForUser }   = useCart();

  // ---- Au montage : vérifier si un token valide existe ----
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }

    authService.me()
      .then((authUser) => {
        setUser(authUser);
        loadCartForUser(authUser.id);  // ← restaurer le panier
      })
      .catch(() => tokenStorage.remove())
      .finally(() => setLoading(false));

    const onExpired = () => {
      setUser(null);
      loadCartForUser(null);
      toast.error('Session expirée, veuillez vous reconnecter.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // ---- Connexion ----
  const login = useCallback(async (payload: LoginPayload): Promise<boolean> => {
    try {
      const { user: authUser, token } = await authService.login(payload);
      tokenStorage.set(token);
      setUser(authUser);
      loadCartForUser(authUser.id);  // ← fusionner panier invité
      toast.success(`Bienvenue, ${authUser.first_name} !`);
      return true;
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Erreur de connexion';
      toast.error(msg);
      return false;
    }
  }, [loadCartForUser]);

  // ---- Inscription ----
  const register = useCallback(async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const { user: authUser, token } = await authService.register(payload);
      tokenStorage.set(token);
      setUser(authUser);
      loadCartForUser(authUser.id);  // ← fusionner panier invité
      toast.success('Compte créé avec succès !');
      return true;
    } catch (err) {
      if (err instanceof ApiException && err.errors) {
        const firstError = Object.values(err.errors)[0]?.[0];
        toast.error(firstError ?? err.message);
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
      return false;
    }
  }, [loadCartForUser]);

  // ---- Déconnexion ----
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Déconnexion locale même si erreur réseau
    } finally {
      tokenStorage.remove();
      setUser(null);
      loadCartForUser(null);  // ← vider l'affichage panier
      toast.info('Déconnexion réussie');
    }
  }, [loadCartForUser]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}