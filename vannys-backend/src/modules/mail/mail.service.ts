import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly adminAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = config.get('MAIL_FROM_ADDRESS', 'noreply@vannystouch.com');
    this.fromName = config.get('MAIL_FROM_NAME', 'Vannys Touch');
    this.adminAddress = config.get('MAIL_ADMIN_ADDRESS', 'admin@vannystouch.com');
    this.frontendUrl = config.get('FRONTEND_URL', 'http://localhost:5173');

    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: config.get<number>('MAIL_PORT', 587),
      secure: config.get('MAIL_SECURE') === 'true',
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent → ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendWelcome(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #c8a96e;">Bienvenue chez Vannys Touch ! 🎉</h1>
          <p>Bonjour <strong>${user.firstName}</strong>,</p>
          <p>Votre compte a été créé avec succès. Vous pouvez dès maintenant explorer notre collection et passer vos premières commandes.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${this.frontendUrl}/products" style="background: #c8a96e; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Découvrir la boutique
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, 'Bienvenue chez Vannys Touch ! 🎉', html);
  }

  async sendAdminNewUser(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h2 style="color: #333;">👤 Nouvel utilisateur inscrit</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; color: #666;">Nom :</td><td><strong>${user.firstName} ${user.lastName}</strong></td></tr>
            <tr><td style="padding: 8px; color: #666;">Email :</td><td>${user.email}</td></tr>
            <tr><td style="padding: 8px; color: #666;">Téléphone :</td><td>${user.phone || '—'}</td></tr>
            <tr><td style="padding: 8px; color: #666;">Date :</td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${this.frontendUrl}/admin/users" style="background: #333; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
              Voir dans l'admin
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.send(this.adminAddress, `👤 Nouvel utilisateur : ${user.firstName} ${user.lastName}`, html);
  }

  async sendPasswordReset(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h2 style="color: #c8a96e;">🔐 Mot de passe modifié</h2>
          <p>Bonjour <strong>${user.firstName}</strong>,</p>
          <p>Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.</p>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(user.email, '🔐 Mot de passe modifié - Vannys Touch', html);
  }

  async sendOrderConfirmed(order: OrderWithItems): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.productName}
            ${item.variantColor ? `<br><small style="color:#888;">Couleur: ${item.variantColor}</small>` : ''}
            ${item.variantSize ? `<br><small style="color:#888;">Taille: ${item.variantSize}</small>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.unitPrice).toLocaleString('fr-FR')} FCFA</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.subtotal).toLocaleString('fr-FR')} FCFA</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #c8a96e;">Commande confirmée ✅</h1>
          <p>Bonjour <strong>${order.user.firstName}</strong>,</p>
          <p>Nous avons bien reçu votre commande <strong>${order.reference}</strong>. Notre équipe va la traiter et vous contactera pour la livraison.</p>

          <h3 style="margin-top: 28px;">Détails de la commande</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f0e8;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: center;">Qté</th>
                <th style="padding: 10px; text-align: right;">Prix</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="margin-top: 16px; text-align: right;">
            <p>Sous-total : <strong>${Number(order.subtotal).toLocaleString('fr-FR')} FCFA</strong></p>
            <p>Livraison : <strong>${Number(order.shippingFee) === 0 ? 'Gratuite' : Number(order.shippingFee).toLocaleString('fr-FR') + ' FCFA'}</strong></p>
            <h3 style="color: #c8a96e;">Total : ${Number(order.total).toLocaleString('fr-FR')} FCFA</h3>
          </div>

          <h3 style="margin-top: 28px;">Adresse de livraison</h3>
          <p>
            ${order.deliveryFullName}<br>
            ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}<br>
            📞 ${order.deliveryPhone}
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${this.frontendUrl}/orders/${order.id}" style="background: #c8a96e; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Suivre ma commande
            </a>
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">Merci de votre confiance — L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(order.user.email, `✅ Commande ${order.reference} confirmée - Vannys Touch`, html);
  }

  async sendAdminNewOrder(order: OrderWithItems): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}${item.variantColor ? ` (${item.variantColor}` : ''}${item.variantSize ? ` / ${item.variantSize})` : item.variantColor ? ')' : ''}</td>
          <td style="padding: 8px; text-align:center; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; text-align:right; border-bottom: 1px solid #eee;">${Number(item.subtotal).toLocaleString('fr-FR')} FCFA</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 620px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h2 style="color: #c8a96e;">🛍️ Nouvelle commande : ${order.reference}</h2>

          <h3>Client</h3>
          <p>${order.user.firstName} ${order.user.lastName} — ${order.user.email} — ${order.user.phone || '—'}</p>

          <h3>Articles commandés</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background:#f5f0e8;">
              <th style="padding:8px;text-align:left;">Produit</th>
              <th style="padding:8px;text-align:center;">Qté</th>
              <th style="padding:8px;text-align:right;">Sous-total</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:right; margin-top: 12px;">
            <p>Livraison : <strong>${Number(order.shippingFee) === 0 ? 'Gratuite' : Number(order.shippingFee).toLocaleString('fr-FR') + ' FCFA'}</strong></p>
            <h3 style="color:#c8a96e;">TOTAL : ${Number(order.total).toLocaleString('fr-FR')} FCFA</h3>
          </div>

          <h3>Livraison</h3>
          <p>
            <strong>${order.deliveryFullName}</strong><br>
            📍 ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}<br>
            ${order.deliveryLandmark ? `Repère : ${order.deliveryLandmark}<br>` : ''}
            📞 ${order.deliveryPhone}
          </p>

          ${order.notes ? `<h3>Notes</h3><p style="background:#fff8e1;padding:12px;border-radius:4px;">${order.notes}</p>` : ''}

          <div style="text-align: center; margin-top: 28px;">
            <a href="${this.frontendUrl}/admin/orders/${order.id}" style="background: #333; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Gérer la commande
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
    await this.send(this.adminAddress, `🛍️ Nouvelle commande ${order.reference} — ${Number(order.total).toLocaleString('fr-FR')} FCFA`, html);
  }

  async sendOrderShipped(order: OrderWithItems): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #c8a96e;">Votre commande est en route 🚚</h1>
          <p>Bonjour <strong>${order.user.firstName}</strong>,</p>
          <p>Votre commande <strong>${order.reference}</strong> a été expédiée et est en cours de livraison.</p>
          ${order.trackingNumber ? `<p>Numéro de suivi : <strong>${order.trackingNumber}</strong></p>` : ''}
          <p>Adresse de livraison :<br>
            <strong>${order.deliveryFullName}</strong><br>
            ${order.deliveryDistrict}, ${order.deliveryCity}<br>
            ${order.deliveryAddress}
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${this.frontendUrl}/orders/${order.id}" style="background: #c8a96e; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Voir ma commande
            </a>
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 32px;">L'équipe Vannys Touch</p>
        </div>
      </body>
      </html>
    `;
    await this.send(order.user.email, `🚚 Votre commande ${order.reference} est en route !`, html);
  }
}
