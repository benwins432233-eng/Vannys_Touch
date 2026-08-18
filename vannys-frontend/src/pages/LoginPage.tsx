import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/use-auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button, InputField } from '@/components/ui';

export function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form);
  };

  return (
    <AuthShell
      title="Bienvenue !"
      subtitle="Connectez-vous à votre compte"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            S'inscrire
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <PasswordField
          label="Mot de passe"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button type="submit" isLoading={isPending} className="w-full">
          {isPending ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
    </AuthShell>
  );
}
