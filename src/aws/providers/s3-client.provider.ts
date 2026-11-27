import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import { AwsConfigService } from "../aws-config.service.js";

/**
 * Provider for S3Client instances.
 * Automatically configures the client based on emulator/production settings.
 */
@Injectable()
export class S3ClientProvider {
  private s3Client: S3Client | null = null;

  constructor(private awsConfigService: AwsConfigService) {}

  /**
   * Get or create S3Client instance.
   * Configuration is applied based on AWS_EMULATOR_ENABLED setting.
   */
  getClient(): S3Client {
    if (!this.s3Client) {
      const config = this.awsConfigService.getClientConfig();
      this.s3Client = new S3Client({
        region: config.region,
        ...(config.endpoint && { endpoint: config.endpoint }),
        ...(config.credentials && { credentials: config.credentials }),
        ...(config.requestHandler && { requestHandler: config.requestHandler }),
      });
    }

    return this.s3Client;
  }

  /**
   * Close the S3Client connection.
   * Useful for cleanup during application shutdown.
   */
  async closeClient(): Promise<void> {
    if (this.s3Client) {
      this.s3Client.destroy();
      this.s3Client = null;
    }
  }
}
