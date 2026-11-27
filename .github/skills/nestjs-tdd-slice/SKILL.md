---
name: nestjs-tdd-slice
description: Construye una funcionalidad vertical en NestJS siguiendo el orden estricto: DTOs -> Pruebas unitarias Jest -> Service -> Controller/Gateway.
---

# Flujo de Implementación Vertical (TDD)

Cuando se solicite implementar un caso de uso en un módulo de Fixer, ejecuta exactamente estos 4 pasos sin saltarte ninguno:

1. **Contratos (DTOs):** Define los DTOs de entrada/salida con `class-validator` y decoradores `@ApiProperty()` de Swagger.
2. **Pruebas Unitarias (`.spec.ts`):** Crea primero los tests en Jest cubriendo el camino feliz y los casos límite críticos (saldos insuficientes, concurrencia, DNI duplicado/baneado).
3. **Lógica de Negocio (`.service.ts`):** Implementa el servicio mínimo necesario para que las pruebas pasen.
4. **Capa de Transporte (`.controller.ts` o `.gateway.ts`):** Expón el endpoint REST o evento Socket.io aplicando `@UseGuards(JwtAuthGuard)` y validación de roles.
