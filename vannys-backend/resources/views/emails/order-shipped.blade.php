<x-mail::message>
<div style="text-align:center; padding: 10px 0 24px;">
  <span style="font-size:2rem;">🚚</span>
  <h1 style="color:#673AB7; font-size:1.6rem; margin:8px 0 0;">Votre commande est en route !</h1>
</div>

Bonjour **{{ $firstName }}**,

Bonne nouvelle ! Votre commande **#{{ $orderNumber }}** vient d'être expédiée et est en chemin vers vous.

@if($trackingNumber)
---

**Numéro de suivi :** `{{ $trackingNumber }}`

---
@endif

<x-mail::button :url="$orderUrl" color="primary">
Suivre ma commande
</x-mail::button>

---

**Quelques infos utiles :**

- 📦 La livraison est généralement effectuée sous 2 à 5 jours ouvrés
- 📞 En cas de problème, répondez à cet email
- 🏠 Assurez-vous qu'une personne est disponible pour réceptionner le colis

---

Merci pour votre achat,
**L'équipe Vanny's Touch**

<x-mail::subcopy>
Référence commande : #{{ $orderNumber }}
</x-mail::subcopy>
</x-mail::message>
