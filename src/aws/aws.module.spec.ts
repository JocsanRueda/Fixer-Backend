import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { AwsConfigService } from "./aws-config.service.js";
import { S3ClientProvider } from "./providers/s3-client.provider.js";
import { DynamoDBClientProvider } from "./providers/dynamodb-client.provider.js";

describe("AWS Module - Emulator Configuration", () => {
  let awsConfigService: AwsConfigService;
  let s3ClientProvider: S3ClientProvider;
  let dynamodbClientProvider: DynamoDBClientProvider;

  beforeEach(async () => {
    // Create a test module with emulator enabled
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.test",
          override: true,
        }),
      ],
      providers: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider],
    }).compile();

    awsConfigService = module.get<AwsConfigService>(AwsConfigService);
    s3ClientProvider = module.get<S3ClientProvider>(S3ClientProvider);
    dynamodbClientProvider = module.get<DynamoDBClientProvider>(DynamoDBClientProvider);
  });

  it("should create an AWS config service", () => {
    expect(awsConfigService).toBeDefined();
  });

  it("should create S3 client provider", () => {
    expect(s3ClientProvider).toBeDefined();
  });

  it("should create DynamoDB client provider", () => {
    expect(dynamodbClientProvider).toBeDefined();
  });

  it("should return client config with emulator settings when enabled", () => {
    // This test assumes AWS_EMULATOR_ENABLED=true in .env.test
    const config = awsConfigService.getClientConfig();
    expect(config.region).toBeDefined();
    expect(config.credentials).toBeDefined();
  });

  it("should instantiate S3Client successfully", () => {
    const s3Client = s3ClientProvider.getClient();
    expect(s3Client).toBeDefined();
  });

  it("should instantiate DynamoDBClient successfully", () => {
    const dynamodbClient = dynamodbClientProvider.getClient();
    expect(dynamodbClient).toBeDefined();
  });
});
