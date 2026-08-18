import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

/** Au-delà, ce n'est plus un carnet d'adresses mais un annuaire. */
const MAX_ADDRESSES_PER_USER = 10;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Adresse par défaut en tête : c'est celle que la commande proposera. */
  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId: toId(userId) },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const owner = toId(userId);

    const count = await this.prisma.address.count({ where: { userId: owner } });
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `Vous avez atteint la limite de ${MAX_ADDRESSES_PER_USER} adresses. Supprimez-en une pour en ajouter une autre.`,
      );
    }

    // La première adresse est forcément celle par défaut : sans elle, le tunnel
    // de commande n'aurait rien à proposer.
    const isDefault = dto.isDefault || count === 0;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: owner, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: owner,
          label: dto.label,
          fullName: dto.fullName,
          phone: dto.phone,
          city: dto.city,
          district: dto.district,
          address: dto.address,
          landmark: dto.landmark || null,
          isDefault,
        },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const owner = toId(userId);
    const existing = await this.owned(owner, toId(id));

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId: owner, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: existing.id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.fullName !== undefined && { fullName: dto.fullName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.district !== undefined && { district: dto.district }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.landmark !== undefined && { landmark: dto.landmark || null }),
          // Retirer soi-même le statut « par défaut » laisserait le carnet sans
          // adresse par défaut : seule la promotion d'une autre le déplace.
          ...(dto.isDefault === true && { isDefault: true }),
        },
      });
    });
  }

  async setDefault(userId: string, id: string) {
    const owner = toId(userId);
    const address = await this.owned(owner, toId(id));

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId: owner, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({ where: { id: address.id }, data: { isDefault: true } }),
    ]);

    return this.findAll(userId);
  }

  async remove(userId: string, id: string) {
    const owner = toId(userId);
    const address = await this.owned(owner, toId(id));

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: address.id } });

      // Le carnet ne doit jamais rester sans adresse par défaut : la plus
      // ancienne restante reprend le rôle.
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId: owner },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });

    return { message: 'Adresse supprimée.' };
  }

  // ─── Private helpers ─────────────────────────────────────────

  /**
   * L'adresse d'une autre cliente répond « introuvable », pas « interdit » :
   * une réponse différente confirmerait son existence.
   */
  private async owned(userId: bigint, id: bigint) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Adresse introuvable.');
    }
    return address;
  }
}
