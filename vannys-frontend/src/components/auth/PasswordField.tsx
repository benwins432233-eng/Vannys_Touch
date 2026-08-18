import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputField } from '@/components/ui';
import type { InputFieldProps } from '@/components/ui';

/**
 * Champ mot de passe avec bascule d'affichage. Le bouton porte un aria-label
 * explicite : une icône seule ne dit rien à un lecteur d'écran (§4.4).
 */
export function PasswordField(props: Omit<InputFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <InputField {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute right-3 top-9 p-1 rounded text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
