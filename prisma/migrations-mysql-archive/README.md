# Historial anterior de MySQL

Estas migraciones corresponden a la etapa anterior del proyecto y se conservan
para consulta. Prisma ya no las ejecuta: su directorio activo es
`prisma/migrations`, que contiene el historial de PostgreSQL.

La migración `0_init_postgresql` reproduce el esquema actual para bases nuevas.
No convierte una base MySQL ni copia sus datos. Una base PostgreSQL existente
requiere revisar el esquema y establecer un baseline antes de utilizar el nuevo
historial; consulta las instrucciones del README principal.
