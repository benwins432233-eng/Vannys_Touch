import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '@/hooks/use-auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button, InputField } from '@/components/ui';

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(form);
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez la communauté Vannys Touch"
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Prénom"
            required
            autoComplete="given-name"
            placeholder="Marie"
            value={form.firstName}
            onChange={set('firstName')}
          />
          <InputField
            label="Nom"
            required
            autoComplete="family-name"
            placeholder="Dupont"
            value={form.lastName}
            onChange={set('lastName')}
          />
        </div>

        <InputField
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={form.email}
          onChange={set('email')}
        />

        <InputField
          label="Téléphone"
          type="tel"
          autoComplete="tel"
          hint="Facultatif — utile pour le suivi de livraison."
          placeholder="+229 01 XX XX XX XX"
          value={form.phone}
          onChange={set('phone')}
        />

        <PasswordField
          label="Mot de passe"
          required
          minLength={8}
          autoComplete="new-password"
          hint="8 caractères minimum."
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
        />

        <Button type="submit" isLoading={isPending} className="w-full">
          {isPending ? 'Création du compte...' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthShell>
  );
}
