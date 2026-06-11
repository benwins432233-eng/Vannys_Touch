<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">✅</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">Commande confirmée !</h1>
</div>

Bonjour **{{ $firstName }}**,

Votre commande **#{{ $orderNumber }}** a bien été reçue et est en cours de traitement. Merci pour votre confiance !

---

<x-mail::table>
| Produit | Qté | Prix |
|:--------|:---:|-----:|
@foreach($orderItems as $item)
| {{ $item->product->name ?? $item->product_name }} | {{ $item->quantity }} | {{ number_format($item->unit_price, 0, ',', ' ') }} FCFA |
@endforeach
</x-mail::table>

<div style="text-align:right; font-weight:bold; font-size:1.1rem; color:#673AB7; margin-top:8px;">
  Total : {{ number_format($total, 0, ',', ' ') }} FCFA
</div>

---

<x-mail::button :url="$orderUrl" color="primary">
Suivre ma commande
</x-mail::button>

Nous vous informerons dès que votre commande sera expédiée.

À bientôt,
**L'équipe Vanny's Touch**

<x-mail::subcopy>
Référence commande : #{{ $orderNumber }}
</x-mail::subcopy>
</x-mail::message>
