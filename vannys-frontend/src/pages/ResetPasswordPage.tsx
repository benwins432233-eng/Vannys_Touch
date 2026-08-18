import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/utils';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();

  const { mutate: reset, isPending } = useMutation({
    mutationFn: () => authApi.resetPassword(token, password),
    onSuccess: (data) => {
      toast.success(data.message);
      navigate('/login', { replace: true });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Vérifié ici et non côté serveur : la confirmation n'existe que dans ce
    // formulaire, elle n'a aucun sens pour l'API.
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setError(undefined);
    reset();
  };

  if (!token) {
    return (
      <AuthShell
        title="Lien incomplet"
        subtitle="Ce lien de réinitialisation ne contient pas de jeton"
        footer={
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground text-center">
          Copiez le lien complet depuis votre email, ou demandez-en un nouveau.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs"
      footer={
        <>
          Le lien a expiré ?{' '}
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            En demander un autre
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          label="Nouveau mot de passe"
          required
          minLength={8}
          autoComplete="new-password"
          hint="8 caractères minimum."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          required
          minLength={8}
          autoComplete="new-password"
          error={error}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button
          type="submit"
          isLoading={isPending}
          className="w-full"
          leftIcon={<ShieldCheck className="w-4 h-4" aria-hidden="true" />}
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Toutes vos sessions ouvertes seront déconnectées.
        </p>
      </form>
    </AuthShell>
  );
}
