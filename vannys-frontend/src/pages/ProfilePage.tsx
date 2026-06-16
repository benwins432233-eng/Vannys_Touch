import { useState } from 'react';
import { Loader2, User, Package, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { apiClient } from '@/api/client';

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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon profil</h1>

        <div className="space-y-5">
          {/* Avatar card */}
          <div className="card p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ background: 'var(--color-gold)' }}>
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              }`}>
                {user?.role === 'admin' ? 'Administrateur' : 'Client'}
              </span>
            </div>
          </div>

          {/* Edit form */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
              Modifier mes informations
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); update(form); }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="label">Prénom</label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Nom</label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Téléphone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour...</> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/orders" className="card p-5 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <Package className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
              <span className="font-medium text-gray-900">Mes commandes</span>
            </Link>
            <button
              onClick={() => logout()}
              className="card p-5 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
