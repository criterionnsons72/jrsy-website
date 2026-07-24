import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { validateConfigDefinition } from './schema.validation';

@Injectable()
export class ConfigSchemaAdminService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.configSchema.findMany({
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
      select: { id: true, name: true, version: true, isPublished: true, updatedAt: true },
    });
  }

  async get(id: string) {
    const schema = await this.prisma.configSchema.findUnique({ where: { id } });
    if (!schema) throw new NotFoundException('Schema not found.');
    return schema;
  }

  /** Create a brand-new schema (version 1) after validating its definition. */
  async create(name: string, definition: unknown) {
    const result = validateConfigDefinition(definition);
    if (!result.ok) {
      throw new BadRequestException({
        message: 'Invalid schema definition',
        errors: result.errors,
      });
    }
    return this.prisma.configSchema.create({
      data: { name, version: 1, definition: result.value as Prisma.InputJsonValue },
    });
  }

  /**
   * Save edits as a NEW version (never mutate a published one) so existing
   * orders keep the schema they were built with.
   */
  async saveNewVersion(id: string, definition: unknown) {
    const current = await this.get(id);
    const result = validateConfigDefinition(definition);
    if (!result.ok) {
      throw new BadRequestException({
        message: 'Invalid schema definition',
        errors: result.errors,
      });
    }
    const latest = await this.prisma.configSchema.findFirst({
      where: { name: current.name },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? current.version) + 1;
    return this.prisma.configSchema.create({
      data: {
        name: current.name,
        version: nextVersion,
        definition: result.value as Prisma.InputJsonValue,
      },
    });
  }

  async publish(id: string) {
    await this.get(id);
    return this.prisma.configSchema.update({ where: { id }, data: { isPublished: true } });
  }
}
