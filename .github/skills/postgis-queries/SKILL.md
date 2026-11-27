---
name: postgis-queries
description: Escribe y optimiza consultas geoespaciales en PostgreSQL + PostGIS con Prisma ORM para el radar de trabajos y cálculo de radios de cobertura.
---

# Procedimiento para Consultas PostGIS en Fixer

1. Prisma no soporta tipos espaciales nativos en su DSL; ejecutar consultas espaciales mediante `prisma.$queryRaw` parametrizado (nunca concatenar strings para evitar SQL Injection).
2. Usar siempre `geography(Point, 4326)` para distancias reales en metros.
3. **Orden estricto de coordenadas:** PostGIS exige `ST_MakePoint(longitude, latitude)` (primero longitud, luego latitud).
4. Para filtrar técnicos en radio de cobertura, usar `ST_DWithin(worker_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, radius_meters)` aprovechando el índice `GIST`.
