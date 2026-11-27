# 🚀 AWS Emulator Integration - Quick Start

## 1️⃣ Setup Inicial (3 minutos)

### Verificar que todo está listo
```bash
# Build debe compilar sin errores
pnpm run build
# Output: ✓ Compilación exitosa

# Tests deben pasar
pnpm test
# Output: ✓ 7 tests passed
```

### Crear archivo `.env`
```bash
cp .env.example .env
```

**Contenido para desarrollo (emulator habilitado):**
```env
AWS_EMULATOR_ENABLED=true
AWS_EMULATOR_ENDPOINT=https://127.0.0.1:9297
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
NODE_ENV=development
```

## 2️⃣ Usar en tus Servicios (Copiar & Pegar)

### Opción A: Usar Storage Service ya implementado

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from './storage/storage.service';

@Injectable()
export class MyService {
  constructor(private storageService: StorageService) {}

  async saveFile(bucket: string, fileName: string, content: Buffer) {
    await this.storageService.uploadFile(
      bucket,
      fileName,
      content,
      'application/octet-stream'
    );
  }

  async getFile(bucket: string, fileName: string) {
    return await this.storageService.downloadFile(bucket, fileName);
  }
}
```

### Opción B: Usar S3 directamente

```typescript
import { Injectable } from '@nestjs/common';
import { S3ClientProvider } from './aws/providers/s3-client.provider';
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class MyService {
  constructor(private s3ClientProvider: S3ClientProvider) {}

  async uploadFile(bucket: string, key: string, body: Buffer) {
    const s3 = this.s3ClientProvider.getClient();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    }));
  }
}
```

### Opción C: Crear un nuevo servicio con DynamoDB

```typescript
import { Injectable } from '@nestjs/common';
import { DynamoDBClientProvider } from './aws/providers/dynamodb-client.provider';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoService {
  constructor(private dynamodbClientProvider: DynamoDBClientProvider) {}

  async getItem(tableName: string, key: { id: string }) {
    const dynamodb = this.dynamodbClientProvider.getClient();
    const result = await dynamodb.send(new GetItemCommand({
      TableName: tableName,
      Key: { id: { S: key.id } },
    }));
    return result.Item;
  }
}
```

## 3️⃣ Importar módulos

En tu módulo donde uses estos servicios:

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { MyService } from './my.service';

@Module({
  imports: [StorageModule],  // AwsModule se importa automáticamente dentro de StorageModule
  providers: [MyService],
})
export class MyModule {}
```

**Nota:** `app.module.ts` ya tiene `AwsModule` y `ConfigModule` configurados.

## 4️⃣ Iniciar la app

```bash
# Desarrollo con reloading automático
pnpm start:dev

# Output esperado:
# [StorageService] S3 Storage initialized with emulator at https://127.0.0.1:9297
```

## 5️⃣ Cambiar a Producción (AWS Real)

Cambiar en `.env`:

```env
AWS_EMULATOR_ENABLED=false
AWS_REGION=us-east-1
NODE_ENV=production
# No necesitas agregar credenciales - AWS SDK las obtiene de IAM roles
```

**Eso es todo.** El código no cambia, la configuración es automática.

---

## 📋 Cheatsheet de Clientes AWS SDK v3

### S3 - Almacenamiento de objetos
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = this.s3ClientProvider.getClient();

// Upload
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: Buffer.from('content'),
}));

// Download
const response = await s3.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
}));
const data = await response.Body?.transformToByteArray();
```

### DynamoDB - Base de datos NoSQL
```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = this.dynamodbClientProvider.getClient();

await dynamodb.send(new PutItemCommand({
  TableName: 'Users',
  Item: {
    userId: { S: '123' },
    name: { S: 'John' },
  },
}));
```

### Para agregar más clientes (SQS, Secrets Manager, etc.)

Ver: [`src/aws/AWS_INTEGRATION_GUIDE.md`](./src/aws/AWS_INTEGRATION_GUIDE.md#agregar-nuevos-clientes-aws)

---

## ✅ Checklist

- [ ] Compilación sin errores: `pnpm run build`
- [ ] Tests pasando: `pnpm test`
- [ ] `.env` creado con configuración correcta
- [ ] `AWS_EMULATOR_ENABLED=true` para desarrollo
- [ ] App inicia con log de emulator: `pnpm start:dev`
- [ ] Archivo de emulator corriendo en `https://127.0.0.1:9297`
- [ ] Puedo crear clientes en mis servicios

---

## 🆘 Troubleshooting

### "Cannot find module '@aws-sdk/client-s3'"
```bash
# Reinstalar dependencias
pnpm install
pnpm run build
```

### "self signed certificate rejected"
```env
# Asegúrate de que esto esté en .env:
AWS_EMULATOR_ENABLED=true
```

### "Failed to connect to emulator"
```bash
# Verifica que el emulator esté corriendo:
curl -k https://127.0.0.1:9297  # Debe responder algo

# Si no, inicia tu emulator (consulta su documentación)
```

### Cambios en `.env` no se aplican
Reinicia la app:
```bash
# Detener (Ctrl+C)
pnpm start:dev  # Iniciar de nuevo
```

---

## 📚 Documentación Completa

- **Arquitectura**: [`src/aws/ARCHITECTURE.md`](./src/aws/ARCHITECTURE.md)
- **Guía Completa**: [`src/aws/AWS_INTEGRATION_GUIDE.md`](./src/aws/AWS_INTEGRATION_GUIDE.md)
- **Ejemplo de Controlador**: [`src/storage/files.controller.example.ts`](./src/storage/files.controller.example.ts)
- **Tests**: [`src/aws/aws.module.spec.ts`](./src/aws/aws.module.spec.ts)

---

## 🎯 Resumen

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Configuración | `.env.example` | ✅ Creado |
| Módulo AWS | `src/aws/aws.module.ts` | ✅ Listo |
| Servicio Config | `src/aws/aws-config.service.ts` | ✅ Listo |
| S3 Provider | `src/aws/providers/s3-client.provider.ts` | ✅ Listo |
| DynamoDB Provider | `src/aws/providers/dynamodb-client.provider.ts` | ✅ Listo |
| Storage Service | `src/storage/storage.service.ts` | ✅ Listo |
| Tests | `src/aws/aws.module.spec.ts` | ✅ Pasando (7/7) |
| Build | — | ✅ Exitoso |

---

**¿Listo?** Crea `.env` y empieza a usar: `pnpm start:dev` 🚀
