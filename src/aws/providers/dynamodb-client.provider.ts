import { Injectable } from "@nestjs/common";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AwsConfigService } from "../aws-config.service.js";

/**
 * Provider for DynamoDBClient instances.
 * Automatically configures the client based on emulator/production settings.
 *
 * Example template for adding additional AWS SDK v3 clients.
 * Follow this pattern for SQSClient, SecretsManagerClient, etc.
 */
@Injectable()
export class DynamoDBClientProvider {
  private dynamodbClient: DynamoDBClient | null = null;

  constructor(private awsConfigService: AwsConfigService) {}

  /**
   * Get or create DynamoDBClient instance.
   * Configuration is applied based on AWS_EMULATOR_ENABLED setting.
   */
  getClient(): DynamoDBClient {
    if (!this.dynamodbClient) {
      const config = this.awsConfigService.getClientConfig();
      this.dynamodbClient = new DynamoDBClient({
        region: config.region,
        ...(config.endpoint && { endpoint: config.endpoint }),
        ...(config.credentials && { credentials: config.credentials }),
        ...(config.requestHandler && { requestHandler: config.requestHandler }),
      });
    }

    return this.dynamodbClient;
  }

  /**
   * Close the DynamoDBClient connection.
   * Useful for cleanup during application shutdown.
   */
  async closeClient(): Promise<void> {
    if (this.dynamodbClient) {
      this.dynamodbClient.destroy();
      this.dynamodbClient = null;
    }
  }
}
