import { Module } from "@nestjs/common";
import { AwsConfigService } from "./aws-config.service.js";
import { S3ClientProvider } from "./providers/s3-client.provider.js";
import { DynamoDBClientProvider } from "./providers/dynamodb-client.provider.js";

@Module({
  providers: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider],
  exports: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider],
})
export class AwsModule {}
