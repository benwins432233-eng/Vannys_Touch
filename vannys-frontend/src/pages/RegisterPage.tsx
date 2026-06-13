import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRegister } from '@/hooks/use-auth';

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>
            Vannys Touch
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez la communauté Vannys Touch</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input required className="input" placeholder="Marie" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label className="label">Nom</label>
                <input required className="input" placeholder="Dupont" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="vous@exemple.com" value={form.email} onChange={set('email')} />
            </div>

            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input type="tel" className="input" placeholder="+229 01 XX XX XX XX" value={form.phone} onChange={set('phone')} />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="input pr-12"
                  placeholder="Min. 8 caractères"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Création du compte...</>
              ) : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
