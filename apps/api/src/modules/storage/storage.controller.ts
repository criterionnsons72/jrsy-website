import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';

class PresignDto {
  @IsIn(['tryon', 'scan', 'attachment'])
  purpose!: 'tryon' | 'scan' | 'attachment';

  @IsString()
  contentType!: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /** Get a short-lived URL to upload a file directly to object storage. */
  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.storage.presignUpload(dto.purpose, dto.contentType);
  }
}
