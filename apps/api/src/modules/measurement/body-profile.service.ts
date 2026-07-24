import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class BodyProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerId(userId: string): Promise<string> {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ForbiddenException('Only customers have body profiles.');
    return customer.id;
  }

  async create(userId: string, dto: CreateProfileDto) {
    const customerId = await this.customerId(userId);
    return this.prisma.bodyProfile.create({
      data: {
        customerId,
        label: dto.label,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        fitPreference: dto.fitPreference ?? 'regular',
      },
    });
  }

  async list(userId: string) {
    const customerId = await this.customerId(userId);
    return this.prisma.bodyProfile.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      include: {
        measurements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { confidence: true, kind: true, lockedAt: true, createdAt: true },
        },
      },
    });
  }

  async get(userId: string, id: string) {
    const customerId = await this.customerId(userId);
    const profile = await this.prisma.bodyProfile.findFirst({
      where: { id, customerId },
      include: { measurements: { orderBy: { createdAt: 'desc' } } },
    });
    if (!profile) throw new NotFoundException('Profile not found.');
    return profile;
  }

  /** Ownership guard used by the measurement service. */
  async assertOwned(userId: string, profileId: string): Promise<void> {
    const customerId = await this.customerId(userId);
    const profile = await this.prisma.bodyProfile.findFirst({
      where: { id: profileId, customerId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Profile not found.');
  }
}
