import { Module } from '@nestjs/common';
import { ConfiguratorController } from './configurator.controller';
import { ConfigSchemaService } from './config-schema.service';
import { RulesEngineService } from './rules-engine.service';

@Module({
  controllers: [ConfiguratorController],
  providers: [ConfigSchemaService, RulesEngineService],
  exports: [ConfigSchemaService, RulesEngineService],
})
export class ConfiguratorModule {}
