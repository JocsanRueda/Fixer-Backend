# ✅ AWS Emulator Integration - Checklist de Integración

## Fase 1: Verificación Inicial ✓ COMPLETADA

- [x] Dependencias instaladas
  - [x] @nestjs/config@12.1.1
  - [x] @aws-sdk/client-s3@3.1178.0
  - [x] @aws-sdk/client-dynamodb@3.1178.0
  - [x] @smithy/node-http-handler@4.14.2

- [x] Proyecto compila sin errores
  ```bash
  pnpm run build  # ✓ Exitoso
  ```

- [x] Tests pasan
  ```bash
  pnpm test       # ✓ 7/7 Pasando
  ```

## Fase 2: Configuración Local (TODO - 5 minutos)

- [ ] Crear archivo `.env`
  ```bash
  cp .env.example .env
  ```

- [ ] Verificar contenido de `.env` para desarrollo
  ```env
  AWS_EMULATOR_ENABLED=true
  AWS_EMULATOR_ENDPOINT=https://127.0.0.1:9297
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=test
  AWS_SECRET_ACCESS_KEY=test
  NODE_ENV=development
  ```

- [ ] Verificar que el AWS Emulator corre en https://127.0.0.1:9297
  ```bash
  curl -k https://127.0.0.1:9297  # Debe responder algo
  ```

## Fase 3: Iniciar la Aplicación (TODO)

- [ ] Iniciar en modo desarrollo
  ```bash
  pnpm start:dev
  ```

- [ ] Esperar log de inicialización
  ```
  [StorageService] S3 Storage initialized with emulator at https://127.0.0.1:9297
  ```

- [ ] Verificar que no hay errores de conexión

## Fase 4: Usar en tus Servicios (TODO)

Elegir una opción:

### Opción A: Usar Storage Service (Recomendado para comenzar)
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
}
```
- [ ] Importar StorageService en tu módulo
- [ ] Usar en tu servicio
- [ ] Probar que funciona

### Opción B: Usar S3ClientProvider directamente
```typescript
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
- [ ] Inyectar S3ClientProvider
- [ ] Obtener cliente: `this.s3ClientProvider.getClient()`
- [ ] Crear comandos AWS SDK v3 y enviarlos

### Opción C: Crear nuevo servicio con DynamoDB
```typescript
import { DynamoDBClientProvider } from './aws/providers/dynamodb-client.provider';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoService {
  constructor(private dynamodbClientProvider: DynamoDBClientProvider) {}

  async saveItem(tableName: string, item: any) {
    const dynamodb = this.dynamodbClientProvider.getClient();
    await dynamodb.send(new PutItemCommand({
      TableName: tableName,
      Item: item,
    }));
  }
}
```
- [ ] Inyectar DynamoDBClientProvider
- [ ] Usar en tu lógica

## Fase 5: Cambiar a Producción (TODO - Cuando esté listo)

- [ ] Actualizar `.env` para producción
  ```env
  AWS_EMULATOR_ENABLED=false
  AWS_REGION=us-east-1
  NODE_ENV=production
  # NO AGREGAR credenciales - AWS SDK las obtiene de IAM roles
  ```

- [ ] Verificar que el código funciona igual
  - [ ] Los clientes se instancian sin errores
  - [ ] Las conexiones se hacen a AWS real
  - [ ] No hay logs del emulator

- [ ] Probar en staging/producción
  - [ ] Verificar que tiene permisos IAM
  - [ ] Verificar que puede conectar a AWS
  - [ ] Probar operaciones básicas (upload, download)

## Fase 6: Agregar Nuevos Clientes AWS (Opcional)

Cuando necesites agregar más servicios AWS (SQS, Secrets Manager, Lambda, etc.):

- [ ] Crear archivo `src/aws/providers/[nombre]-client.provider.ts`
  - [ ] Copiar estructura de `s3-client.provider.ts`
  - [ ] Cambiar `S3Client` por tu cliente
  - [ ] Implementar `getClient()` y `closeClient()`

- [ ] Actualizar `src/aws/aws.module.ts`
  - [ ] Importar nuevo provider
  - [ ] Agregar a `providers` array
  - [ ] Agregar a `exports` array

- [ ] Usar en tus servicios
  - [ ] Inyectar provider
  - [ ] Obtener cliente
  - [ ] Usar comandos AWS SDK v3

Ejemplo: SQS
```typescript
// src/aws/providers/sqs-client.provider.ts
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

// En aws.module.ts
@Module({
  providers: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider, SQSClientProvider],
  exports: [AwsConfigService, S3ClientProvider, DynamoDBClientProvider, SQSClientProvider],
})
export class AwsModule {}
```

## 📚 Documentación de Referencia

| Documento | Ubicación | Propósito |
|-----------|-----------|----------|
| Quick Start | `QUICKSTART.md` | Comienza aquí (5 minutos) |
| Guía Completa | `src/aws/AWS_INTEGRATION_GUIDE.md` | Referencia detallada |
| Arquitectura | `src/aws/ARCHITECTURE.md` | Detalles técnicos |
| Ejemplos | `src/storage/files.controller.example.ts` | Código de ejemplo |
| Tests | `src/aws/aws.module.spec.ts` | Cómo testear |

## 🆘 Troubleshooting

### Error: "Cannot find module '@aws-sdk/client-s3'"
```bash
pnpm install
pnpm run build
```

### Error: "self signed certificate"
```env
Verificar que AWS_EMULATOR_ENABLED=true en .env
```

### Error: "Failed to connect to emulator"
```bash
# Verificar que el emulator corre
curl -k https://127.0.0.1:9297

# Si no responde, inicia tu emulator
# (consulta la documentación del emulator)
```

### Los cambios en `.env` no se aplican
```bash
# Reinicia la app - ConfigModule carga variables una sola vez
Ctrl+C
pnpm start:dev
```

### Certificado autofirmado rechazado en producción
```env
Esto NO debe pasar. Verifica:
✓ AWS_EMULATOR_ENABLED=false en .env
✓ No hay requestHandler personalizado
✓ Certificados de AWS se validan normalmente
```

## 🎯 Señales de Éxito

Cuando completes la integración, verás:

✅ **Logs**
```
[StorageService] S3 Storage initialized with emulator at https://127.0.0.1:9297
```

✅ **Build**
```bash
$ pnpm run build
# (sin errores)
```

✅ **Tests**
```bash
$ pnpm test
# Test Files 2 passed | Tests 7 passed
```

✅ **Código**
```typescript
const s3 = this.s3ClientProvider.getClient();
await s3.send(new PutObjectCommand({...}));
// ✓ Funciona sin cambios de código
```

✅ **Cambiar a Producción**
```env
AWS_EMULATOR_ENABLED=false
# ✓ Código sigue funcionando
# ✓ Conecta a AWS real
```

## 📋 Requisitos Mínimos

Para que todo funcione:

- [ ] `.env` creado con `AWS_EMULATOR_ENABLED=true`
- [ ] AWS Emulator corriendo en https://127.0.0.1:9297
- [ ] Node.js 18+ (con pnpm)
- [ ] TypeScript 6.0+
- [ ] NestJS 12.0+

## 🚀 Resumen Rápido

```bash
# 1. Setup (ya completado)
pnpm install
pnpm run build      # ✓
pnpm test          # ✓

# 2. Tu configuración (TODO)
cp .env.example .env

# 3. Desarrollo
pnpm start:dev
# ↓ Esperar log de inicialización

# 4. Usar en servicios
# constructor(private s3ClientProvider: S3ClientProvider) {}

# 5. Cambiar a producción
# Cambiar AWS_EMULATOR_ENABLED=false en .env
```

---

**Estado**: ✅ Integración completada y lista para usar
**Inicio**: 5 minutos (crear `.env` y arrancar app)
**Producción**: Sin cambios de código, solo cambiar configuración
