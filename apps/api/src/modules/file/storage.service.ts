import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ApiConfigService } from "../../config/config.service";

/**
 * Thin S3-compatible object storage port. Works with AWS S3 and MinIO
 * (set S3_ENDPOINT + S3_FORCE_PATH_STYLE=true for MinIO).
 */
@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ApiConfigService) {
    const s3 = config.s3;
    this.bucket = s3.bucket;
    this.client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      forcePathStyle: s3.forcePathStyle,
      credentials:
        s3.accessKeyId && s3.secretAccessKey
          ? { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
          : undefined,
    });
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  async upload(params: { objectKey: string; body: Buffer; contentType: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.objectKey,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
    this.logger.debug(`Uploaded s3://${this.bucket}/${params.objectKey}`);
  }

  async delete(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }

  async presignDownload(objectKey: string, originalName: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
      }),
      { expiresIn: this.config.s3.presignTtlSeconds },
    );
  }
}
