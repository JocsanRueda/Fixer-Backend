# AWS Emulator Integration Guide

## Overview

Este módulo proporciona una integración profesional con AWS Emulator local y AWS SDK v3, con soporte automático para certificados autofirmados en entornos de desarrollo.

## Estructura

```
src/
├── aws/
│   ├── aws.module.ts                 # Módulo principal
│   ├── aws-config.service.ts         # Servicio de configuración
│   ├── providers/
│   │   ├── s3-client.provider.ts     # Proveedor de S3Client
│   │   └── dynamodb-client.provider.ts # Proveedor de DynamoDBClient (plantilla)
│   └── aws.module.spec.ts            # Tests
└── storage/
    ├── storage.module.ts             # Módulo de ejemplo
    └── storage.service.ts            # Servicio de ejemplo que usa S3
```

## Instalación de Dependencias

```bash
pnpm add @nestjs/config @aws-sdk/client-s3 @aws-sdk/client-dynamodb @smithy/node-http-handler
```

## Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```env
# AWS Emulator Configuration
AWS_EMULATOR_ENABLED=true
AWS_EMULATOR_ENDPOINT=https://127.0.0.1:9297
AWS_REGION=us-east-1

# AWS Credentials (only used when emulator is enabled)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

NODE_ENV=development
```

### Desactivar el Emulador (Producción)

Para usar AWS real, simplemente cambia:

```env
AWS_EMULATOR_ENABLED=false
```

No es necesario cambiar credenciales - AWS SDK usará IAM roles o variables de entorno de AWS.

## Uso en Servicios

### Usando S3

```typescript
import { Injectable } from '@nestjs/common';
import { S3ClientProvider } from './aws/providers/s3-client.provider';

@Injectable()
export class MyService {
  constructor(private s3ClientProvider: S3ClientProvider) {}

  async uploadFile(bucket: string, key: string, body: Buffer) {
    const s3Client = this.s3ClientProvider.getClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    await s3Client.send(command);
  }
}
```

### Usando DynamoDB

```typescript
import { Injectable } from '@nestjs/common';
import { DynamoDBClientProvider } from './aws/providers/dynamodb-client.provider';

@Injectable()
export class MyService {
  constructor(private dynamodbClientProvider: DynamoDBClientProvider) {}

  async queryTable(tableName: string) {
    const dynamodbClient = this.dynamodbClientProvider.getClient();
    // Use AWS SDK v3 DynamoDB commands
  }
}
```

## Agregar Nuevos Clientes AWS

Para agregar un nuevo cliente (ej: SQSClient, SecretsManagerClient, etc.):

1. Crear un nuevo proveedor basado en el patrón `s3-client.provider.ts`:

```typescript
// src/aws/providers/sqs-client.provider.ts
import { Injectable } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { AwsConfigService } from '../aws-config.service';

@Injectable()
export class SQSClientProvider {
  private sqsClient: SQSClient | null = null;

  constructor(private awsConfigService: AwsConfigService) {}

  getClient(): SQSClient {
    if (!this.sqsClient) {
      const config = this.awsConfigService.getClientConfig();
      this.sqsClient = new SQSClient({
        region: config.region,
        ...(config.endpoint && { endpoint: config.endpoint }),
        ...(config.credentials && { credentials: config.credentials }),
        ...(config.requestHandler && { requestHandler: config.requestHandler }),
      });
    }
    return this.sqsClient;
  }

  async closeClient(): Promise<void> {
    if (this.sqsClient) {
      this.sqsClient.destroy();
      this.sqsClient = null;
    }
  }
}
```

2. Agregar el proveedor a `aws.module.ts`:

```typescript
import { SQSClientProvider } from './providers/sqs-client.provider';

@Module({
  providers: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider, SQSClientProvider],
  exports: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider, SQSClientProvider],
})
export class AwsModule {}
```

3. Usar el nuevo cliente en tus servicios:

```typescript
constructor(private sqsClientProvider: SQSClientProvider) {}

getClient(): SQSClient {
  return this.sqsClientProvider.getClient();
}
```

## Características Principales

✅ **Configuración Automática**: Los clientes se configuran automáticamente según `AWS_EMULATOR_ENABLED`

✅ **Certificados Autofirmados**: Acepta certificados autofirmados del emulador local sin requerir cambios de código

✅ **Singleton Pattern**: Cada cliente se instancia una sola vez y se reutiliza

✅ **TypeScript**: Totalmente tipado y seguro

✅ **Escalable**: Fácil de agregar nuevos clientes del AWS SDK v3

✅ **Sin Secretos Hardcodeados**: Todas las credenciales vienen de variables de entorno

## Testing

Ejecutar tests:

```bash
pnpm test
```

Los tests usan `.env.test` que habilita el emulador automáticamente para pruebas locales.

## Comportamiento en Diferentes Entornos

### Desarrollo Local (Emulator Habilitado)
- ✅ Conecta a `https://127.0.0.1:9297` (AWS Emulator)
- ✅ Usa credenciales de prueba (`test`/`test`)
- ✅ Acepta certificado autofirmado

### Producción (Emulator Deshabilitado)
- ✅ Conecta a AWS real
- ✅ Usa IAM roles o credenciales de AWS en variables de entorno
- ✅ Valida certificados TLS normalmente (rejectUnauthorized: true por defecto)

## Troubleshooting

### Error: "self signed certificate"

Asegúrate de que `AWS_EMULATOR_ENABLED=true` en tu `.env` y que el emulador esté corriendo en `https://127.0.0.1:9297`.

### Los cambios de `.env` no se aplican

Reinicia la aplicación. `ConfigModule` carga las variables de entorno una sola vez al arrancar.

### Cliente retorna null o undefined

Verifica que el proveedor está exportado en `AwsModule` y que tu módulo importa `AwsModule`.

## Referencia de API

### AwsConfigService

```typescript
// Obtener configuración del cliente
getClientConfig(): AwsClientConfig

// Verificar si el emulador está activo
isEmulatorActive(): boolean

// Obtener URL del emulador
getEmulatorEndpoint(): string
```

### S3ClientProvider / DynamoDBClientProvider

```typescript
// Obtener instancia del cliente (singleton)
getClient(): S3Client | DynamoDBClient

// Cerrar conexión (útil para cleanup)
async closeClient(): Promise<void>
```

## Notas de Seguridad

⚠️ **IMPORTANTE**: Las credenciales hardcodeadas en `.env` son SOLO para desarrollo local.

En producción:
- No uses `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY` como variables de entorno
- Usa IAM roles (ECS, Lambda, EC2 instance profiles)
- O credenciales temporales de STS (sts:AssumeRole)

El módulo detecta automáticamente `AWS_EMULATOR_ENABLED=false` y no fuerza credenciales, permitiendo que AWS SDK use la cadena de proveedores de credenciales estándar.
