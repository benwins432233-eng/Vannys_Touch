<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">🏷️</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">{{ $title }}</h1>
</div>

{!! nl2br(e($body)) !!}

---

<x-mail::button :url="$ctaUrl" color="primary">
{{ $ctaText }}
</x-mail::button>

---

À bientôt,
**L'équipe Vanny's Touch**

<x-mail::subcopy>
Vous recevez cet email car vous êtes inscrit à la newsletter de Vanny's Touch. Pour vous désabonner, contactez-nous.
</x-mail::subcopy>
</x-mail::message>
