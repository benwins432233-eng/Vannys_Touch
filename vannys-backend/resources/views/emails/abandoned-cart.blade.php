<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">🛒</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">Vous avez oublié quelque chose !</h1>
</div>

Bonjour **{{ $firstName }}**,

Il semblerait que vous ayez laissé des articles dans votre panier. Ils vous attendent toujours !

---

@foreach($cartItems as $item)
- **{{ $item['name'] }}** — {{ number_format($item['price'], 0, ',', ' ') }} FCFA
@endforeach

---

<x-mail::button :url="$cartUrl" color="primary">
Reprendre mon panier
</x-mail::button>

<x-mail::button :url="$shopUrl">
Continuer mes achats
</x-mail::button>

---

> 💡 Les articles dans votre panier ne sont pas réservés. Passez votre commande avant qu'ils ne soient plus disponibles !

À bientôt,
**L'équipe Vanny's Touch**

<x-mail::subcopy>
Vous recevez cet email car vous avez des articles non achetés dans votre panier Vanny's Touch.
</x-mail::subcopy>
</x-mail::message>
