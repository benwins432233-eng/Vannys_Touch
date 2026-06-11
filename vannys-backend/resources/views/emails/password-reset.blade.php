<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">🔑</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">Mot de passe modifié</h1>
</div>

Bonjour **{{ $firstName }}**,

Votre mot de passe a été **modifié avec succès** sur Vanny's Touch.

Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.

<x-mail::button :url="$loginUrl" color="primary">
Se connecter
</x-mail::button>

---

> ⚠️ **Ce n'était pas vous ?**
> Si vous n'avez pas effectué cette modification, contactez-nous immédiatement en répondant à cet email.

---

À bientôt,
**L'équipe Vanny's Touch**

<x-mail::subcopy>
Vous recevez cet email car une modification de mot de passe a été effectuée sur votre compte.
</x-mail::subcopy>
</x-mail::message>
