<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nouvelle commande</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        {{-- ── En-tête ── --}}
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#c4b5fd;text-transform:uppercase;letter-spacing:2px;">Vanny's Touch</p>
            <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;">🛍️ Nouvelle Commande !</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#e0d7ff;">{{ $order->reference }}</p>
          </td>
        </tr>

        {{-- ── Alerte urgence ── --}}
        <tr>
          <td style="padding:0 40px;">
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin:24px 0 0;">
              <p style="margin:0;font-size:14px;color:#92400e;">
                ⚡ <strong>Action requise :</strong> Contactez le client pour finaliser le paiement et organiser la livraison.
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">

            {{-- ── Infos client ── --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f8fafc;border-radius:12px;padding:20px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">👤 Informations client</p>
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6b7280;width:40%;">Nom complet</td>
                      <td style="font-size:13px;color:#111827;font-weight:600;">{{ $order->user->first_name }} {{ $order->user->last_name }}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Email</td>
                      <td style="font-size:13px;color:#111827;"><a href="mailto:{{ $order->user->email }}" style="color:#4f46e5;">{{ $order->user->email }}</a></td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Téléphone paiement</td>
                      <td style="font-size:13px;color:#111827;font-weight:600;">
                        <a href="tel:{{ $order->phone_number }}" style="color:#059669;">{{ $order->phone_number }}</a>
                        <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;
                          background:{{ $order->payment_method === 'MTN' ? '#fef3c7' : ($order->payment_method === 'MOOV' ? '#dbeafe' : '#ede9fe') }};
                          color:{{ $order->payment_method === 'MTN' ? '#92400e' : ($order->payment_method === 'MOOV' ? '#1d4ed8' : '#5b21b6') }};">
                          {{ $order->payment_method }}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            {{-- ── Adresse de livraison ── --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:20px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">📦 Adresse de livraison</p>
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6b7280;width:40%;">Destinataire</td>
                      <td style="font-size:13px;color:#111827;font-weight:700;">{{ $order->delivery_full_name }}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Téléphone livraison</td>
                      <td style="font-size:13px;color:#111827;font-weight:600;">
                        <a href="tel:{{ $order->delivery_phone }}" style="color:#059669;">{{ $order->delivery_phone }}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Ville</td>
                      <td style="font-size:13px;color:#111827;">{{ $order->delivery_city }}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Quartier / Zone</td>
                      <td style="font-size:13px;color:#111827;">{{ $order->delivery_district }}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Adresse précise</td>
                      <td style="font-size:14px;color:#111827;font-weight:600;">{{ $order->delivery_address }}</td>
                    </tr>
                    @if($order->delivery_landmark)
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Point de repère</td>
                      <td style="font-size:13px;color:#111827;font-style:italic;">{{ $order->delivery_landmark }}</td>
                    </tr>
                    @endif
                  </table>
                </td>
              </tr>
            </table>

            {{-- ── Produits commandés ── --}}
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">🛒 Produits commandés</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Produit</td>
                <td style="padding:10px 8px;font-size:12px;font-weight:700;color:#6b7280;text-align:center;">Qté</td>
                <td style="padding:10px 8px;font-size:12px;font-weight:700;color:#6b7280;text-align:center;">Variante</td>
                <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#6b7280;text-align:right;">Prix</td>
              </tr>
              @foreach($order->items as $item)
              <tr style="border-top:1px solid #f3f4f6;">
                <td style="padding:12px 16px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    @if($item->product_image_url)
                    <img src="{{ $item->product_image_url }}" width="48" height="48"
                         style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;" />
                    @endif
                    <span style="font-size:13px;font-weight:600;color:#111827;">{{ $item->product_name }}</span>
                  </div>
                </td>
                <td style="padding:12px 8px;text-align:center;font-size:13px;color:#374151;">{{ $item->quantity }}</td>
                <td style="padding:12px 8px;text-align:center;font-size:12px;color:#6b7280;">
                  {{ $item->variant_color ? $item->variant_color : '' }}
                  {{ ($item->variant_color && $item->variant_size) ? ' · ' : '' }}
                  {{ $item->variant_size ? $item->variant_size : '' }}
                  {{ (!$item->variant_color && !$item->variant_size) ? '—' : '' }}
                </td>
                <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#111827;">
                  {{ number_format($item->subtotal, 0, ',', ' ') }} FCFA
                </td>
              </tr>
              @endforeach

              {{-- Totaux --}}
              <tr style="border-top:1px solid #e5e7eb;background:#f9fafb;">
                <td colspan="3" style="padding:10px 16px;font-size:13px;color:#6b7280;text-align:right;">Sous-total</td>
                <td style="padding:10px 16px;font-size:13px;color:#374151;text-align:right;">{{ number_format($order->subtotal, 0, ',', ' ') }} FCFA</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td colspan="3" style="padding:10px 16px;font-size:13px;color:#6b7280;text-align:right;">Livraison</td>
                <td style="padding:10px 16px;font-size:13px;color:#374151;text-align:right;">
                  {{ $order->shipping_fee == 0 ? 'Gratuite' : number_format($order->shipping_fee, 0, ',', ' ') . ' FCFA' }}
                </td>
              </tr>
              <tr style="background:#ede9fe;">
                <td colspan="3" style="padding:12px 16px;font-size:15px;font-weight:700;color:#4f46e5;text-align:right;">TOTAL</td>
                <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#4f46e5;text-align:right;">{{ number_format($order->total, 0, ',', ' ') }} FCFA</td>
              </tr>
            </table>

            @if($order->notes)
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400e;"><strong>📝 Note du client :</strong> {{ $order->notes }}</p>
            </div>
            @endif

          </td>
        </tr>

        {{-- ── Pied de page ── --}}
        <tr>
          <td style="padding:24px 40px;background:#f8fafc;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Vanny's Touch · Commande reçue le {{ now()->format('d/m/Y à H:i') }}
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
