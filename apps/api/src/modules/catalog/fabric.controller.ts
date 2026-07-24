import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('catalog')
@Controller('fabrics')
export class FabricController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.fabric.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
