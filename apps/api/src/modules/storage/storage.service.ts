import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_URL_TTL = 300; // seconds
const VIEW_URL_TTL = 300;

/**
 * S3-compatible object storage (MinIO in dev, S3 in prod). Uploads use
 * short-lived presigned PUT URLs so image bytes never pass through the API.
 * Downloads use short-lived presigned GET URLs — assets are never public.
 * (Server-side malware scanning is a follow-up worker step.)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket?: string;
  private readonly client?: S3Client;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    const bucket = config.get<string>('S3_BUCKET');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = config.get<string>('S3_SECRET_KEY');

    if (endpoint && bucket && accessKeyId && secretAccessKey) {
      this.bucket = bucket;
      this.client = new S3Client({
        endpoint,
        region: config.get<string>('S3_REGION', 'us-east-1'),
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true, // required for MinIO
      });
    } else {
      this.logger.warn('Storage not configured — presign/delete will error until S3_* env is set.');
    }
  }

  private ensure(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      throw new BadRequestException('Object storage is not configured on this environment.');
    }
    return { client: this.client, bucket: this.bucket };
  }

  buildKey(purpose: 'tryon' | 'scan' | 'attachment', contentType: string): string {
    const ext = contentType.split('/')[1] ?? 'bin';
    return `${purpose}/${randomUUID()}.${ext}`;
  }

  /** Presigned URL the browser PUTs the file to directly. */
  async presignUpload(
    purpose: 'tryon' | 'scan' | 'attachment',
    contentType: string,
  ): Promise<{ url: string; key: string; method: 'PUT'; headers: Record<string, string> }> {
    if ((purpose === 'tryon' || purpose === 'scan') && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new BadRequestException('Only JPEG, PNG or WebP images are allowed.');
    }
    const { client, bucket } = this.ensure();
    const key = this.buildKey(purpose, contentType);
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: UPLOAD_URL_TTL },
    );
    return { url, key, method: 'PUT', headers: { 'Content-Type': contentType } };
  }

  /** Short-lived URL for viewing an asset (never public). */
  async presignView(key: string): Promise<string> {
    const { client, bucket } = this.ensure();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: VIEW_URL_TTL,
    });
  }

  /** Store raw bytes and return the object key. */
  async putBuffer(
    purpose: 'tryon' | 'scan' | 'attachment',
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const { client, bucket } = this.ensure();
    const key = this.buildKey(purpose, contentType);
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return key;
  }

  /** Download a remote image and store it, returning the object key. */
  async storeFromUrl(purpose: 'tryon' | 'scan' | 'attachment', url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch result image: ${res.status}`);
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await res.arrayBuffer());
    return this.putBuffer(purpose, buffer, contentType);
  }

  async deleteObject(key: string | null | undefined): Promise<void> {
    if (!key || !this.client || !this.bucket) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.error(`Failed to delete ${key}: ${err instanceof Error ? err.message : err}`);
    }
  }

  get configured(): boolean {
    return Boolean(this.client && this.bucket);
  }
}
