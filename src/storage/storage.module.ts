import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service.js";
import { AwsModule } from "../aws/aws.module.js";

@Module({
  imports: [AwsModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
