import { Injectable, Logger } from "@nestjs/common";
import { S3ClientProvider } from "../aws/providers/s3-client.provider.js";
import { AwsConfigService } from "../aws/aws-config.service.js";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Example service demonstrating how to use AWS SDK v3 clients
 * configured for both emulator and production environments.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private s3ClientProvider: S3ClientProvider,
    private awsConfigService: AwsConfigService,
  ) {
    if (this.awsConfigService.isEmulatorActive()) {
      this.logger.debug(
        `S3 Storage initialized with emulator at ${this.awsConfigService.getEmulatorEndpoint()}`,
      );
    } else {
      this.logger.debug("S3 Storage initialized with AWS production endpoint");
    }
  }

  /**
   * Upload a file to S3.
   */
  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
  ): Promise<void> {
    const s3Client = this.s3ClientProvider.getClient();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    this.logger.debug(`File uploaded to S3: s3://${bucket}/${key}`);
  }

  /**
   * Download a file from S3.
   */
  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const s3Client = this.s3ClientProvider.getClient();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const bodyBytes = await response.Body?.transformToByteArray();

    if (!bodyBytes) {
      throw new Error(`Failed to download file from S3: s3://${bucket}/${key}`);
    }

    return Buffer.from(bodyBytes);
  }

  /**
   * Delete a file from S3.
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    const s3Client = this.s3ClientProvider.getClient();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
    this.logger.debug(`File deleted from S3: s3://${bucket}/${key}`);
  }
}
