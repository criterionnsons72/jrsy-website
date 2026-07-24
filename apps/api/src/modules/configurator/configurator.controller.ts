import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigSchemaService } from './config-schema.service';
import { RulesEngineService } from './rules-engine.service';
import { EvaluateDto } from './dto/evaluate.dto';

@ApiTags('configurator')
@Controller('configurator')
export class ConfiguratorController {
  constructor(
    private readonly schemas: ConfigSchemaService,
    private readonly rules: RulesEngineService,
  ) {}

  /** The option groups + rules a product's configurator should render. */
  @Get('products/:slug/schema')
  async schema(@Param('slug') slug: string) {
    const { schemaId, version, definition } = await this.schemas.forProductSlug(slug);
    return { schemaId, version, definition };
  }

  /**
   * Evaluate a set of selections: disabled options, validation errors,
   * price/lead-time adjustments, and whether tailor approval is required.
   */
  @Post('evaluate')
  async evaluate(@Body() dto: EvaluateDto) {
    const { definition } = await this.schemas.forProductSlug(dto.productSlug);
    return this.rules.evaluate(definition, dto.selections);
  }
}
