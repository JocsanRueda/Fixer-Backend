/**
 * Arquitectura AWS Emulator Integration
 * 
 * FLUJO DE CONFIGURACIÓN:
 * 
 * 1. AL INICIAR LA APP
 *    ├─ ConfigModule carga .env
 *    ├─ AwsConfigService lee AWS_EMULATOR_ENABLED
 *    └─ Determina si usar emulator o AWS real
 * 
 * 2. CUANDO CREAS UN CLIENTE (Lazy instantiation)
 *    ├─ S3ClientProvider.getClient() es llamado
 *    ├─ Si no existe el cliente (null), lo crea
 *    ├─ Aplica AwsConfigService.getClientConfig()
 *    └─ Retorna instancia singleton
 * 
 * 3. ENVIANDO COMANDOS AWS
 *    ├─ Tu servicio obtiene cliente: const s3 = provider.getClient()
 *    ├─ Crea comando AWS SDK v3: new PutObjectCommand(...)
 *    ├─ Envía: await s3.send(command)
 *    └─ Si es emulator, usa certificado autofirmado; si AWS real, validación TLS normal
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * FLUJO CON AWS_EMULATOR_ENABLED=true (Desarrollo Local)
 * ═════════════════════════════════════════════════════════
 * 
 *  .env
 *  │
 *  ├─ AWS_EMULATOR_ENABLED=true
 *  ├─ AWS_EMULATOR_ENDPOINT=https://127.0.0.1:9297
 *  ├─ AWS_ACCESS_KEY_ID=test
 *  └─ AWS_SECRET_ACCESS_KEY=test
 *      │
 *      ▼
 *  AwsConfigService.getClientConfig()
 *      │
 *      ├─ endpoint: "https://127.0.0.1:9297"
 *      ├─ credentials: { accessKeyId: "test", secretAccessKey: "test" }
 *      └─ requestHandler: NodeHttpHandler with https.Agent({ rejectUnauthorized: false })
 *      │
 *      ▼
 *  S3ClientProvider.getClient()
 *      │
 *      ▼
 *  new S3Client({
 *    region: "us-east-1",
 *    endpoint: "https://127.0.0.1:9297",        // ✅ Fuerza endpoint local
 *    credentials: {...},                         // ✅ Credenciales de test
 *    requestHandler: NodeHttpHandler({...})      // ✅ Acepta cert autofirmado
 *  })
 *      │
 *      ▼
 *  TU SERVICIO
 *  │
 *  ├─ uploadFile(bucket, key, body)
 *  ├─ downloadFile(bucket, key)
 *  └─ deleteFile(bucket, key)
 *      │
 *      ▼
 *  AWS Emulator en https://127.0.0.1:9297
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * FLUJO CON AWS_EMULATOR_ENABLED=false (Producción AWS)
 * ════════════════════════════════════════════════════════
 * 
 *  .env (producción)
 *  │
 *  ├─ AWS_EMULATOR_ENABLED=false              (key: deshabilitado)
 *  ├─ AWS_REGION=us-east-1
 *  └─ [SIN credenciales hardcodeadas]
 *      │
 *      ▼
 *  AwsConfigService.getClientConfig()
 *      │
 *      ├─ region: "us-east-1"
 *      ├─ endpoint: undefined                   (no fuerza)
 *      ├─ credentials: undefined                (AWS SDK usa su cadena de proveedores)
 *      └─ requestHandler: undefined             (usa NodeHttpHandler por defecto)
 *      │
 *      ▼
 *  S3ClientProvider.getClient()
 *      │
 *      ▼
 *  new S3Client({
 *    region: "us-east-1"                       // ✅ Solo región
 *    // endpoint: NO configurado                // ✅ Usa AWS real
 *    // credentials: NO configurado             // ✅ Usa IAM roles/env
 *    // requestHandler: NO configurado          // ✅ HTTPS estándar (rejectUnauthorized: true)
 *  })
 *      │
 *      ▼
 *  TU SERVICIO
 *  │
 *  ├─ uploadFile(bucket, key, body)
 *  ├─ downloadFile(bucket, key)
 *  └─ deleteFile(bucket, key)
 *      │
 *      ▼
 *  AWS S3 Real en AWS
 *  (con validación TLS y credenciales de IAM)
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * COMPARATIVA: Emulator vs Production
 * ════════════════════════════════════
 * 
 * ┌─────────────────────┬─────────────────────────────┬──────────────────────────────┐
 * │ Aspecto              │ Emulator (AWS_EMULATOR...) │ Production (Real AWS)        │
 * ├─────────────────────┼─────────────────────────────┼──────────────────────────────┤
 * │ Endpoint            │ https://127.0.0.1:9297     │ AWS S3 real                   │
 * │ Credentials         │ test / test (hardcoded)     │ IAM roles / env variables     │
 * │ HTTPS Certificate   │ Autofirmado (aceptado)      │ Validado (CA chains)          │
 * │ rejectUnauthorized  │ false                       │ true (default)                │
 * │ requestHandler      │ Personalizado               │ Default (NodeHttpHandler)     │
 * │ Configuración       │ Automática                  │ Automática                    │
 * │ Cambio de código    │ No requerido                │ No requerido                  │
 * └─────────────────────┴─────────────────────────────┴──────────────────────────────┘
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * CONFIGURACIÓN AUTOMÁTICA
 * ════════════════════════
 * 
 * El valor de AWS_EMULATOR_ENABLED es el ÚNICO switch que controla todo:
 * 
 *  AWS_EMULATOR_ENABLED=true
 *  │
 *  ├─ ✅ Lee AWS_EMULATOR_ENDPOINT
 *  ├─ ✅ Lee AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY
 *  ├─ ✅ Crea https.Agent({ rejectUnauthorized: false })
 *  ├─ ✅ Envuelve en NodeHttpHandler
 *  └─ ✅ Pasa a S3Client
 * 
 *  AWS_EMULATOR_ENABLED=false
 *  │
 *  ├─ ✅ No fuerza AWS_EMULATOR_ENDPOINT
 *  ├─ ✅ No fuerza credenciales
 *  ├─ ✅ No crea https.Agent personalizado
 *  └─ ✅ AWS SDK usa comportamiento normal (IAM roles, etc.)
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * SINGLETON PATTERN
 * ═════════════════
 * 
 * Cada proveedor (S3ClientProvider, DynamoDBClientProvider, etc.) mantiene
 * una única instancia del cliente para toda la aplicación:
 * 
 *  First call:
 *    provider.getClient()
 *    └─ this.s3Client === null
 *       └─ new S3Client({...})
 *          └─ this.s3Client = instance
 *             └─ return instance
 * 
 *  Subsequent calls:
 *    provider.getClient()
 *    └─ this.s3Client !== null
 *       └─ return this.s3Client (reutilizado)
 * 
 * Ventaja: Conexiones reutilizadas, menor overhead de red
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * ESCALABILIDAD: Agregar nuevos clientes AWS
 * ══════════════════════════════════════════
 * 
 * Para agregar, por ejemplo, SQSClient:
 * 
 *  1. Crear archivo sqs-client.provider.ts
 *     (copiar s3-client.provider.ts, cambiar S3Client por SQSClient)
 * 
 *  2. Agregar a aws.module.ts:
 *     providers: [..., SQSClientProvider]
 *     exports: [..., SQSClientProvider]
 * 
 *  3. Usar en servicios:
 *     constructor(private sqsClientProvider: SQSClientProvider) {}
 *     const sqs = this.sqsClientProvider.getClient()
 * 
 *  Configuración automática se hereda de AwsConfigService - SIN cambios adicionales
 * 
 */
