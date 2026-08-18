import { useMutation } from '@tanstack/react-query';
import { MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button, Card } from '@/components/ui';
import { getErrorMessage } from '@/utils';

/**
 * Rappel de vérification d'adresse.
 *
 * Affiché tant que l'adresse n'est pas confirmée, parce que la commande
 * l'exige : découvrir l'obligation au moment de payer serait le pire moment.
 * Rien ne s'affiche pour un compte déjà vérifié.
 */
export function EmailVerificationNotice() {
  const user = useAuthStore((s) => s.user);

  const { mutate: resend, isPending } = useMutation({
    mutationFn: authApi.requestEmailVerification,
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!user || user.email_verified_at) return null;

  return (
    <Card className="p-5 border-accent bg-accent/10" role="status">
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        <MailWarning className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">Confirmez votre adresse email</h2>
          <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
            Un lien a été envoyé à <strong>{user.email}</strong>. La confirmation est nécessaire
            pour passer commande.
          </p>
        </div>
        <Button variant="outline" size="sm" isLoading={isPending} onClick={() => resend()}>
          Renvoyer le lien
        </Button>
      </div>
    </Card>
  );
}
