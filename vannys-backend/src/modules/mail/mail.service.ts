import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Order, User } from '@prisma/client';

type OrderWithItems = Order & {
  items: Array<{
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: any;
    subtotal: any;
    variantColor: string | null;
    variantSize: string | null;
  }>;
  user: User;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly adminAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromName = config.get('MAIL_FROM_NAME', 'Vannys Touch');
    this.fromAddress = config.get('MAIL_FROM_ADDRESS', 'noreply@vannystouch.com');
    this.adminAddress = config.getOrThrow<string>('MAIL_ADMIN_ADDRESS');
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:5173');
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend error → ${to}: ${JSON.stringify(error)}`);
      } else {
        this.logger.log(`Email sent → ${to}: ${subject}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message}`);
    }
  }

  async sendWelcome(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
          <h1 style="color:#c8a96e;margin-top:0;">Bienvenue chez Vannys Touch 🎉</h1>
          <p style="color:#444;">Bonjour <strong>${user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Votre compte a été créé avec succès. Vous pouvez dès maintenant découvrir notre collection et passer vos premières commandes.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${this.frontendUrl}/products"
               style="background:#c8a96e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Découvrir la boutique
            </a>
          </div>
          <p style="color:#999;font-size:13px;margin-bottom:0;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, 'Bienvenue chez Vannys Touch ! 🎉', html);
  }

  async sendAdminNewUser(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h2 style="color:#333;margin-top:0;">👤 Nouvel utilisateur inscrit</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#888;width:120px;">Nom</td><td><strong>${user.firstName} ${user.lastName}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td>${user.email}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Téléphone</td><td>${user.phone ?? '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Date</td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
          </table>
          <div style="margin-top:24px;">
            <a href="${this.frontendUrl}/admin/users"
               style="background:#333;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
              Voir dans l'admin
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.send(this.adminAddress, `👤 Nouvel utilisateur : ${user.firstName} ${user.lastName}`, html);
  }

  /**
   * Lien de vérification d'adresse. Pas d'image distante : une image bloquée
   * par la messagerie ne doit pas cacher le bouton d'action.
   */
  async sendEmailVerification(user: User, link: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h2 style="color:#8a6c3c;margin-top:0;">Confirmez votre adresse email</h2>
          <p style="color:#444;">Bonjour <strong>${user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Une dernière étape avant de commander : confirmez que cette adresse est bien la vôtre.
            Ce lien est valable <strong>24 heures</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="background:#8a6c3c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Confirmer mon adresse
            </a>
          </div>
          <p style="color:#777;font-size:13px;line-height:1.6;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
            <span style="word-break:break-all;color:#8a6c3c;">${link}</span>
          </p>
          <p style="color:#999;font-size:13px;margin-bottom:0;">
            Vous n'êtes pas à l'origine de cette inscription ? Ignorez simplement cet email.
          </p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, 'Confirmez votre adresse email — Vannys Touch', html);
  }

  /** Lien de réinitialisation de mot de passe, valable 2 heures. */
  async sendPasswordResetLink(user: User, link: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h2 style="color:#8a6c3c;margin-top:0;">Réinitialiser votre mot de passe</h2>
          <p style="color:#444;">Bonjour <strong>${user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Vous avez demandé à choisir un nouveau mot de passe. Ce lien est valable
            <strong>2 heures</strong> et ne fonctionne qu'une fois.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="background:#8a6c3c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Choisir un nouveau mot de passe
            </a>
          </div>
          <p style="color:#777;font-size:13px;line-height:1.6;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
            <span style="word-break:break-all;color:#8a6c3c;">${link}</span>
          </p>
          <p style="color:#999;font-size:13px;margin-bottom:0;">
            Vous n'avez rien demandé ? Ignorez cet email, votre mot de passe reste inchangé.
          </p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, 'Réinitialiser votre mot de passe — Vannys Touch', html);
  }

  async sendPasswordReset(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h2 style="color:#c8a96e;margin-top:0;">🔐 Mot de passe modifié</h2>
          <p style="color:#444;">Bonjour <strong>${user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Votre mot de passe a été modifié avec succès.
            Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.
          </p>
          <p style="color:#999;font-size:13px;margin-bottom:0;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, '🔐 Mot de passe modifié — Vannys Touch', html);
  }

  async sendOrderConfirmed(order: OrderWithItems): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#444;">
            ${item.productName}
            ${item.variantColor ? `<br><span style="color:#999;font-size:12px;">Couleur : ${item.variantColor}</span>` : ''}
            ${item.variantSize ? `<br><span style="color:#999;font-size:12px;">Taille : ${item.variantSize}</span>` : ''}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0ebe3;text-align:center;color:#555;">${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0ebe3;text-align:right;color:#555;">${Number(item.unitPrice).toLocaleString('fr-FR')} FCFA</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0ebe3;text-align:right;font-weight:600;">${Number(item.subtotal).toLocaleString('fr-FR')} FCFA</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h1 style="color:#c8a96e;margin-top:0;">Commande confirmée ✅</h1>
          <p style="color:#444;">Bonjour <strong>${order.user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Nous avons bien reçu votre commande <strong>${order.reference}</strong>.
            Notre équipe va la traiter et vous contactera pour la livraison.
          </p>

          <h3 style="color:#333;border-bottom:2px solid #f0ebe3;padding-bottom:8px;">Votre commande</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9f7f4;">
                <th style="padding:10px 8px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Produit</th>
                <th style="padding:10px 8px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;">Qté</th>
                <th style="padding:10px 8px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Prix unit.</th>
                <th style="padding:10px 8px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="margin-top:16px;text-align:right;">
            <p style="color:#888;font-size:14px;margin:4px 0;">Sous-total : ${Number(order.subtotal).toLocaleString('fr-FR')} FCFA</p>
            <p style="color:#888;font-size:14px;margin:4px 0;">
              Livraison : ${Number(order.shippingFee) === 0 ? '<span style="color:#22c55e;">Gratuite</span>' : Number(order.shippingFee).toLocaleString('fr-FR') + ' FCFA'}
            </p>
            <p style="font-size:18px;font-weight:700;color:#c8a96e;margin:8px 0 0;">
              Total : ${Number(order.total).toLocaleString('fr-FR')} FCFA
            </p>
          </div>

          <h3 style="color:#333;border-bottom:2px solid #f0ebe3;padding-bottom:8px;margin-top:28px;">Adresse de livraison</h3>
          <p style="color:#555;font-size:14px;line-height:1.8;margin:0;">
            <strong>${order.deliveryFullName}</strong><br>
            ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}<br>
            ${order.deliveryLandmark ? `Repère : ${order.deliveryLandmark}<br>` : ''}
            📞 ${order.deliveryPhone}
          </p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${this.frontendUrl}/orders/${order.id}"
               style="background:#c8a96e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Suivre ma commande
            </a>
          </div>
          <p style="color:#999;font-size:13px;margin-top:32px;margin-bottom:0;">
            Merci de votre confiance — L'équipe Vannys Touch
          </p>
        </div>
      </body>
      </html>
    `;
    await this.send(
      order.user.email,
      `✅ Commande ${order.reference} confirmée — Vannys Touch`,
      html,
    );
  }

  async sendAdminNewOrder(order: OrderWithItems): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#444;">
            ${item.productName}
            ${item.variantColor ? ` <span style="color:#888;">(${item.variantColor}${item.variantSize ? '/' + item.variantSize : ''})</span>` : item.variantSize ? ` <span style="color:#888;">(${item.variantSize})</span>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #f0ebe3;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #f0ebe3;text-align:right;font-weight:600;">${Number(item.subtotal).toLocaleString('fr-FR')} FCFA</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:620px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h2 style="color:#c8a96e;margin-top:0;">🛍️ Nouvelle commande : ${order.reference}</h2>

          <div style="background:#f9f7f4;border-radius:8px;padding:16px;margin-bottom:24px;">
            <h3 style="margin:0 0 8px;color:#333;font-size:14px;">CLIENT</h3>
            <p style="margin:0;font-size:14px;color:#555;line-height:1.8;">
              <strong>${order.user.firstName} ${order.user.lastName}</strong><br>
              ${order.user.email}<br>
              📞 ${order.user.phone ?? '—'}
            </p>
          </div>

          <h3 style="color:#333;border-bottom:2px solid #f0ebe3;padding-bottom:8px;">Articles commandés</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9f7f4;">
                <th style="padding:8px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Produit</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;">Qté</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:right;margin-top:12px;">
            <p style="color:#888;font-size:14px;margin:4px 0;">
              Livraison : ${Number(order.shippingFee) === 0 ? 'Gratuite' : Number(order.shippingFee).toLocaleString('fr-FR') + ' FCFA'}
            </p>
            <p style="font-size:20px;font-weight:700;color:#c8a96e;margin:8px 0 0;">
              TOTAL : ${Number(order.total).toLocaleString('fr-FR')} FCFA
            </p>
          </div>

          <h3 style="color:#333;border-bottom:2px solid #f0ebe3;padding-bottom:8px;margin-top:28px;">Adresse de livraison</h3>
          <p style="color:#555;font-size:14px;line-height:1.8;margin:0;">
            <strong>${order.deliveryFullName}</strong><br>
            📍 ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}<br>
            ${order.deliveryLandmark ? `Repère : ${order.deliveryLandmark}<br>` : ''}
            📞 ${order.deliveryPhone}
          </p>

          ${order.notes ? `
          <div style="background:#fff8e1;border-left:4px solid #c8a96e;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:20px;">
            <h4 style="margin:0 0 4px;font-size:13px;color:#888;">NOTES DU CLIENT</h4>
            <p style="margin:0;font-size:14px;color:#555;">${order.notes}</p>
          </div>` : ''}

          <div style="text-align:center;margin-top:32px;">
            <a href="${this.frontendUrl}/admin/orders/${order.id}"
               style="background:#333;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Gérer la commande →
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.send(
      this.adminAddress,
      `🛍️ Nouvelle commande ${order.reference} — ${Number(order.total).toLocaleString('fr-FR')} FCFA`,
      html,
    );
  }

  async sendOrderShipped(order: OrderWithItems): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Inter,Arial,sans-serif;background:#f9f7f4;margin:0;padding:24px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;">
          <h1 style="color:#c8a96e;margin-top:0;">Votre commande est en route 🚚</h1>
          <p style="color:#444;">Bonjour <strong>${order.user.firstName}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Votre commande <strong>${order.reference}</strong> a été expédiée et est en cours de livraison.
          </p>
          ${order.trackingNumber ? `
          <div style="background:#f9f7f4;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-size:14px;color:#555;">
              Numéro de suivi : <strong>${order.trackingNumber}</strong>
            </p>
          </div>` : ''}
          <p style="color:#555;font-size:14px;line-height:1.8;">
            <strong>Adresse de livraison :</strong><br>
            ${order.deliveryFullName}<br>
            ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}
          </p>
          <div style="text-align:center;margin-top:32px;">
            <a href="${this.frontendUrl}/orders/${order.id}"
               style="background:#c8a96e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Voir ma commande
            </a>
          </div>
          <p style="color:#999;font-size:13px;margin-top:32px;margin-bottom:0;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(order.user.email, `🚚 Votre commande ${order.reference} est en route !`, html);
  }
}
