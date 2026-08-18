import { useState } from 'react';
import { User, Package, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { apiClient } from '@/api/client';
import { Badge, Button, Card, InputField } from '@/components/ui';
import { AddressBook } from '@/components/account/AddressBook';
import { EmailVerificationNotice } from '@/components/account/EmailVerificationNotice';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { mutate: logout } = useLogout();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiClient.patch('/users/me', data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Profil mis à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  return (
    <div className="section">
      <div className="page-container max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">Mon profil</h1>

        <div className="space-y-5">
          <EmailVerificationNotice />

          {/* Identité */}
          <Card className="p-6 flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0
                         bg-primary text-primary-foreground text-2xl font-bold"
              aria-hidden="true"
            >
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <Badge tone={user?.role === 'admin' ? 'gold' : 'success'} className="mt-1.5">
                {user?.role === 'admin' ? 'Administrateur' : 'Client'}
              </Badge>
            </div>
          </Card>

          {/* Informations modifiables */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" aria-hidden="true" />
              Modifier mes informations
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update(form);
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <InputField
                label="Prénom"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <InputField
                label="Nom"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Téléphone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={isPending}>
                  {isPending ? 'Mise à jour...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Card>

          <AddressBook />

          {/* Raccourcis */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/orders"
              className="card p-5 flex items-center gap-3 transition-shadow hover:shadow-card-hover"
            >
              <Package className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">Mes commandes</span>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="card p-5 flex items-center gap-3 text-destructive transition-shadow hover:shadow-card-hover"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
