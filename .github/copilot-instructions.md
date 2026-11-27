# Fixer Backend - Core Rules

- **Stack:** Node.js 22, NestJS, TypeScript (`strict: true`), Prisma ORM, PostgreSQL 16 + PostGIS, Redis, Socket.io, `pnpm`.
- **Architecture:** Modular monolith divided exclusively into 5 domains under `src/modules/`: `iam`, `kyc`, `marketplace`, `wallet`, `trust`.
- **Domain Isolation:** Do not import repositories or directly access Prisma tables from another domain. All communication between modules must be done by injecting the public `Service` exported by the target module.
- **Financial Integrity:** Do not use `number` or `Float` for monetary amounts. Use `Prisma.Decimal` (`NUMERIC(12,2)`).
- **Code Style:** Avoid obvious comments. Use `kebab-case` for file names. Validate inputs with `class-validator` and document endpoints with `@nestjs/swagger`.
