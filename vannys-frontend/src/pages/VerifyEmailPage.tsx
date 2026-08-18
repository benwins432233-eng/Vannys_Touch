import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/auth/AuthShell';
import { LinkButton } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/utils';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const attempted = useRef(false);

  const { mutate: confirm, isPending, isSuccess, error } = useMutation({
    mutationFn: () => authApi.confirmEmail(token),
    onSuccess: () => {
      // Le compte connecté doit refléter la vérification sans reconnexion.
      if (user) setUser({ ...user, email_verified_at: new Date().toISOString() });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  useEffect(() => {
    // Une seule tentative : le jeton est à usage unique, le rejouer échouerait
    // et afficherait une erreur alors que la vérification a réussi.
    if (!token || attempted.current) return;
    attempted.current = true;
    confirm();
  }, [token, confirm]);

  const body = () => {
    if (!token) {
      return {
        icon: <XCircle className="w-12 h-12 text-destructive" aria-hidden="true" />,
        message: 'Ce lien ne contient pas de jeton de vérification.',
        hint: 'Copiez le lien complet depuis votre email.',
      };
    }
    if (isPending) {
      return {
        icon: <Loader2 className="w-12 h-12 text-primary animate-spin" aria-hidden="true" />,
        message: 'Vérification en cours...',
      };
    }
    if (isSuccess) {
      return {
        icon: <CheckCircle2 className="w-12 h-12 text-success" aria-hidden="true" />,
        message: 'Votre adresse email est vérifiée. Merci !',
        hint: 'Vous pouvez maintenant passer commande.',
      };
    }
    return {
      icon: <XCircle className="w-12 h-12 text-destructive" aria-hidden="true" />,
      message: getErrorMessage(error),
      hint: 'Depuis votre profil, vous pouvez demander un nouveau lien.',
    };
  };

  const { icon, message, hint } = body();

  return (
    <AuthShell
      title="Vérification de votre email"
      subtitle="Une étape rapide, une seule fois"
      footer={
        <Link to="/profile" className="font-semibold text-primary hover:underline">
          Aller à mon profil
        </Link>
      }
    >
      <div className="text-center" role="status" aria-live="polite">
        <div className="flex justify-center mb-4">{icon}</div>
        <p className="text-foreground">{message}</p>
        {hint && <p className="text-sm text-muted-foreground mt-2">{hint}</p>}
        {isSuccess && (
          <LinkButton to="/products" className="mt-6">
            Découvrir la boutique
          </LinkButton>
        )}
      </div>
    </AuthShell>
  );
}
