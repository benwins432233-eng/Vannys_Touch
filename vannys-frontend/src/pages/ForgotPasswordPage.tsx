import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, InputField } from '@/components/ui';
import { getErrorMessage } from '@/utils';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const { mutate: requestReset, isPending, data } = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien pour en choisir un nouveau"
      footer={
        <>
          Vous vous en souvenez ?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {/* Le message de succès ne dit jamais si l'adresse existe : le contraire
          permettrait de dresser la liste des comptes de la boutique. */}
      {data ? (
        <div className="text-center" role="status">
          <MailCheck className="w-10 h-10 text-success mx-auto mb-4" aria-hidden="true" />
          <p className="text-foreground">{data.message}</p>
          <p className="text-sm text-muted-foreground mt-3">
            Le lien est valable 2 heures. Pensez à regarder vos indésirables.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(undefined);
            requestReset();
          }}
          className="space-y-5"
        >
          <InputField
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            error={error}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" isLoading={isPending} className="w-full">
            {isPending ? 'Envoi en cours...' : 'Recevoir le lien'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
