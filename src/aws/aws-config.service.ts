import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

export interface AwsClientConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  requestHandler?: NodeHttpHandler;
}

/**
 * Service to manage AWS SDK v3 client configuration.
 * Handles both emulator (local) and production (AWS) configurations.
 */
@Injectable()
export class AwsConfigService {
  private readonly isEmulatorEnabled: boolean;
  private readonly emulatorEndpoint: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(private configService: ConfigService) {
    this.isEmulatorEnabled =
      this.configService.get<string>("AWS_EMULATOR_ENABLED", "false") === "true";
    this.emulatorEndpoint =
      this.configService.get<string>("AWS_EMULATOR_ENDPOINT") || "https://127.0.0.1:9297";
    this.region = this.configService.get<string>("AWS_REGION") || "us-east-1";
    this.accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID") || "test";
    this.secretAccessKey = this.configService.get<string>("AWS_SECRET_ACCESS_KEY") || "test";
  }

  /**
   * Get AWS client configuration based on emulator setting.
   * Automatically configures credentials and endpoint when emulator is enabled.
   */
  getClientConfig(): AwsClientConfig {
    const config: AwsClientConfig = {
      region: this.region,
    };

    if (this.isEmulatorEnabled) {
      config.endpoint = this.emulatorEndpoint;
      config.credentials = {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      };
      config.requestHandler = this.createInsecureRequestHandler();
    }

    return config;
  }

  /**
   * Create an HTTPS request handler that accepts self-signed certificates.
   * Only used when connecting to the local emulator.
   */
  private createInsecureRequestHandler(): NodeHttpHandler {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    return new NodeHttpHandler({
      httpsAgent,
    });
  }

  /**
   * Check if AWS emulator is enabled.
   */
  isEmulatorActive(): boolean {
    return this.isEmulatorEnabled;
  }

  /**
   * Get the emulator endpoint URL.
   */
  getEmulatorEndpoint(): string {
    return this.emulatorEndpoint;
  }
}
