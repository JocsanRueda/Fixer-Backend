---
applyTo: "src/modules/wallet/**"
---

# Reglas Financieras Estrictas (Wallet)

- Toda operación que modifique saldos (`accounts`) o inserte asientos (`ledger_entries`) debe ejecutarse dentro de `prisma.$transaction`.
- Usar bloqueo pesimista a nivel de fila mediante `$queryRaw` con `SELECT * FROM wallet.accounts WHERE worker_id = $1::uuid FOR UPDATE` antes de validar o descontar saldo.
- Regla de Onboarding: si `completed_free_jobs_count < 5`, la comisión es `0.00`, se incrementa el contador y se registra asiento `PROMO_EXEMPTION`. A partir del 6to trabajo, debitar exactamente el `10%` (`COMMISSION_DEBIT`).
- Los webhooks de pasarelas locales (CompraClick/PixelPay/Tengo) deben validar firma HMAC y garantizar idempotencia mediante `external_reference_id` único antes de acreditar saldo.
