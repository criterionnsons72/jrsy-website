import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConfigSchemaDefinition } from './schema.types';

@Injectable()
export class ConfigSchemaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fetch the published configuration schema for a product (by slug). */
  async forProductSlug(slug: string): Promise<{
    productId: string;
    schemaId: string;
    version: number;
    definition: ConfigSchemaDefinition;
  }> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { configSchema: true },
    });
    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found.`);
    }
    if (!product.configSchema) {
      throw new NotFoundException(`Product "${slug}" has no configuration schema.`);
    }
    return {
      productId: product.id,
      schemaId: product.configSchema.id,
      version: product.configSchema.version,
      definition: product.configSchema.definition as unknown as ConfigSchemaDefinition,
    };
  }
}
