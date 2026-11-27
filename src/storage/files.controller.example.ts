/**
 * Ejemplo de uso del módulo AWS en un controlador
 * Este ejemplo muestra cómo usar Storage Service para subir y descargar archivos
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "../storage/storage.service.js";

@Controller("files")
export class FilesController {
  constructor(private storageService: StorageService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: any,
    @Body("bucket") bucket: string,
    @Body("key") key: string,
  ): Promise<{ message: string; location: string }> {
    if (!file || !bucket || !key) {
      throw new HttpException("Missing required fields: file, bucket, key", HttpStatus.BAD_REQUEST);
    }

    try {
      await this.storageService.uploadFile(bucket, key, file.buffer, file.mimetype);

      return {
        message: "File uploaded successfully",
        location: `s3://${bucket}/${key}`,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("download/:bucket/:key")
  async downloadFile(
    @Param("bucket") bucket: string,
    @Param("key") key: string,
  ): Promise<{ data: Buffer; size: number }> {
    if (!bucket || !key) {
      throw new HttpException("Missing required parameters: bucket, key", HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await this.storageService.downloadFile(bucket, key);

      return {
        data,
        size: data.length,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete("delete/:bucket/:key")
  async deleteFile(
    @Param("bucket") bucket: string,
    @Param("key") key: string,
  ): Promise<{ message: string }> {
    if (!bucket || !key) {
      throw new HttpException("Missing required parameters: bucket, key", HttpStatus.BAD_REQUEST);
    }

    try {
      await this.storageService.deleteFile(bucket, key);

      return {
        message: "File deleted successfully",
      };
    } catch (error) {
      throw new HttpException(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
