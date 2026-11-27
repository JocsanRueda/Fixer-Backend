---
agent: agent
description: Implementa un corte vertical completo siguiendo la skill nestjs-tdd-slice
---

Usa la skill `nestjs-tdd-slice` para implementar el siguiente requerimiento en el dominio indicado:

- **Dominio:** ${input:dominio:iam | kyc | marketplace | wallet | trust}
- **Caso de uso:** ${input:caso_uso:Describe la operación exacta}

Lee únicamente el archivo `#file:prisma/schema.prisma` y los archivos existentes dentro de `src/modules/${input:dominio}/` antes de escribir código. No modifiques otros módulos.
