import { Module } from '@nestjs/common';
import { ConfiguratorController } from './configurator.controller';
import { ConfigSchemaService } from './config-schema.service';
import { RulesEngineService } from './rules-engine.service';
import { ConfigSchemaAdminController } from './config-schema-admin.controller';
import { ConfigSchemaAdminService } from './config-schema-admin.service';

@Module({
  controllers: [ConfiguratorController, ConfigSchemaAdminController],
  providers: [ConfigSchemaService, RulesEngineService, ConfigSchemaAdminService],
  exports: [ConfigSchemaService, RulesEngineService],
})
export class ConfiguratorModule {}
