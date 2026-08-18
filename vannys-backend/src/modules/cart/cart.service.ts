import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { shippingFeeFor } from '../orders/order-rules';
import { AddCartItemDto, MergeCartItemDto } from './dto/cart.dto';
import { clampQuantity, lineStatus, MAX_QUANTITY_PER_LINE } from './cart-rules';

const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

/** Tout ce qu'il faut pour afficher et chiffrer une ligne, relu en base. */
const ITEM_INCLUDE = {
  variant: {
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  },
} as const;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  // ── Lecture ───────────────────────────────────────────────────

  async getCart(userId: string) {
    const cart = await this.findOrCreateCart(toId(userId));
    return this.serialize(cart.id);
  }

  // ── Écriture ──────────────────────────────────────────────────

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.findOrCreateCart(toId(userId));
    const variantId = toId(dto.variantId);
    const variant = await this.loadSellableVariant(variantId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    // Un deuxième ajout du même article incrémente la ligne : deux lignes
    // identiques dans un panier n'ont aucun sens pour la cliente.
    const wanted = (existing?.quantity ?? 0) + dto.quantity;
    const quantity = clampQuantity(wanted, {
      stock: variant.stock,
      variantActive: variant.isActive,
      productActive: variant.product.isActive,
    });

    if (quantity === 0) {
      throw new ConflictException(`« ${variant.product.name} » est épuisé.`);
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, variantId, quantity },
      update: { quantity },
    });

    return this.serialize(cart.id, this.capNotice(wanted, quantity, variant.stock));
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.findOrCreateCart(toId(userId));
    const item = await this.ownedItem(cart.id, toId(itemId));

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return this.serialize(cart.id);
    }

    const variant = await this.loadSellableVariant(item.variantId);
    const capped = clampQuantity(quantity, {
      stock: variant.stock,
      variantActive: variant.isActive,
      productActive: variant.product.isActive,
    });

    if (capped === 0) {
      throw new ConflictException(`« ${variant.product.name} » est épuisé.`);
    }

    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: capped } });
    return this.serialize(cart.id, this.capNotice(quantity, capped, variant.stock));
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.findOrCreateCart(toId(userId));
    const item = await this.ownedItem(cart.id, toId(itemId));

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.serialize(cart.id);
  }

  async clear(userId: string) {
    const cart = await this.findOrCreateCart(toId(userId));
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.serialize(cart.id);
  }

  /**
   * Fusionne le panier local d'un visiteur qui vient de se connecter.
   *
   * Les lignes s'ajoutent à celles déjà en compte plutôt que de les remplacer :
   * une cliente qui retrouve son panier d'hier ne doit pas perdre ce qu'elle
   * vient de choisir. Une ligne devenue introuvable est ignorée, jamais fatale —
   * échouer ici viderait un panier pour un seul article retiré du catalogue.
   */
  async merge(userId: string, items: MergeCartItemDto[]) {
    const cart = await this.findOrCreateCart(toId(userId));
    let skipped = 0;

    for (const item of items) {
      const variant = await this.resolveMergeVariant(item);
      if (!variant) {
        skipped += 1;
        continue;
      }

      const existing = await this.prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      });

      const quantity = clampQuantity((existing?.quantity ?? 0) + item.quantity, {
        stock: variant.stock,
        variantActive: variant.isActive,
        productActive: variant.product.isActive,
      });

      if (quantity === 0) {
        skipped += 1;
        continue;
      }

      await this.prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
        create: { cartId: cart.id, variantId: variant.id, quantity },
        update: { quantity },
      });
    }

    const cartView = await this.serialize(cart.id);
    return {
      ...cartView,
      skipped,
      ...(skipped > 0 && {
        notice: `${skipped} article(s) de votre panier ne sont plus disponibles.`,
      }),
    };
  }

  // ─── Private helpers ─────────────────────────────────────────

  private async findOrCreateCart(userId: bigint) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { userId } });
  }

  private async ownedItem(cartId: bigint, itemId: bigint) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    // Le panier d'un autre client doit répondre « introuvable », pas « interdit » :
    // une réponse différente confirmerait l'existence de la ligne.
    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('Ligne de panier introuvable.');
    }
    return item;
  }

  private async loadSellableVariant(variantId: bigint) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException('Cette déclinaison est introuvable.');
    return variant;
  }

  /** Retrouve la variante d'une ligne locale, quelle que soit sa génération. */
  private async resolveMergeVariant(item: MergeCartItemDto) {
    if (item.variantId) {
      const byId = await this.prisma.productVariant.findUnique({
        where: { id: toId(item.variantId) },
        include: { product: true },
      });
      if (byId) return byId;
    }

    if (!item.productId) return null;

    const productId = toId(item.productId);
    const byAttributes = await this.prisma.productVariant.findFirst({
      where: {
        productId,
        color: item.color ?? null,
        size: item.size ?? null,
        isActive: true,
      },
      include: { product: true },
    });
    if (byAttributes) return byAttributes;

    // Panier enregistré avant le lot L1 sur un produit qui ne se décline pas :
    // la variante unique porte tout le stock, la couleur envoyée n'existe plus.
    const variants = await this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      include: { product: true },
    });
    if (variants.length === 1 && !variants[0].color && !variants[0].size) return variants[0];
    return null;
  }

  private capNotice(requested: number, applied: number, stock: number): string | undefined {
    if (applied >= requested) return undefined;
    return applied === MAX_QUANTITY_PER_LINE
      ? `${MAX_QUANTITY_PER_LINE} articles maximum par ligne.`
      : `Quantité ajustée : il ne reste que ${stock} article(s).`;
  }

  /**
   * Vue du panier renvoyée par toutes les routes.
   * Les prix sont relus en base à chaque appel : le client n'en fournit jamais,
   * et le serveur seul calcule les totaux (§2.3).
   */
  private async serialize(cartId: bigint, notice?: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: ITEM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });

    const lines = items.map((item) => {
      const { variant } = item;
      const { product } = variant;
      const unitPrice = Number(product.price);
      const status = lineStatus(item.quantity, {
        stock: variant.stock,
        variantActive: variant.isActive,
        productActive: product.isActive,
      });

      return {
        id: item.id,
        variantId: variant.id,
        quantity: item.quantity,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        available: status.available,
        alert: status.alert,
        unitPrice,
        subtotal: unitPrice * status.effectiveQuantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.images[0]?.urlThumbnail || product.images[0]?.url || null,
        },
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    // Le tarif est relu à chaque affichage : un changement en administration
    // doit se voir dans les paniers ouverts, pas au prochain redéploiement.
    const shipping = await this.settings.getShipping();
    const shippingFee = shippingFeeFor(subtotal, shipping.freeThreshold, shipping.fee);

    return {
      items: lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      freeShippingThreshold: shipping.freeThreshold,
      /** Vrai dès qu'une ligne bloque la commande : à l'interface de le dire. */
      hasIssues: lines.some((l) => !l.available),
      ...(notice && { notice }),
    };
  }
}
