<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">👤</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">Nouvel inscrit</h1>
</div>

Un nouvel utilisateur vient de s'inscrire sur Vanny's Touch.

---

| Champ | Détail |
|:------|:-------|
| Nom complet | {{ $fullName }} |
| Email | {{ $email }} |
| Téléphone | {{ $phone }} |
| Inscrit le | {{ $registeredAt }} |

---

<x-mail::button :url="$dashboardUrl" color="primary">
Voir les utilisateurs
</x-mail::button>

**L'équipe Vanny's Touch**
</x-mail::message>
