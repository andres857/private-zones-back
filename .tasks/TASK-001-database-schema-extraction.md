# TASK-001: Extracción del Mapa de Esquema y Relaciones de Base de Datos

## Metadata
- **ID:** TASK-001
- **Tipo:** Documentación / Reverse Engineering
- **Prioridad:** Critical Path — Bloqueante para todas las tareas subsiguientes
- **Output esperado:** `DATABASE_SCHEMA.md`
- **Auditoría externa:** ⚠️ El artefacto generado será validado por un sistema de revisión automatizada (OpenAI Codex). La precisión, completitud y adherencia al formato son requisitos no negociables. Cualquier inconsistencia entre el código fuente y el documento generado será detectada y reportada como fallo.

---

## Contexto del Negocio

Este proyecto es una **migración del sistema core de la compañía** desde una arquitectura legacy hacia **NestJS/TypeScript**. El proyecto es completamente nuevo en su stack tecnológico — no existe documentación previa del esquema de datos en el destino.

Estamos estableciendo las **bases de infraestructura de IA para desarrollo con agentes**. Esta tarea es el primer paso fundacional: sin un mapa preciso del esquema de datos, ningún agente puede tomar decisiones arquitectónicas correctas.

El archivo `DATABASE_SCHEMA.md` resultante será la **fuente de verdad compartida** entre todos los agentes de desarrollo durante la migración. Si este documento es incorrecto, toda decisión arquitectónica posterior estará comprometida.

**No se asume conocimiento previo del dominio de negocio.** El agente debe descubrir el dominio exclusivamente a partir del código fuente (nombres de entidades, relaciones, campos, enums). El contexto de negocio debe documentarse tal como emerge del código, sin invenciones ni suposiciones externas.

---

## Objetivo

Analizar **exhaustivamente** todas las entidades del proyecto NestJS y producir un único archivo `DATABASE_SCHEMA.md` que documente:

1. Las reglas generales de la base de datos.
2. El mapa completo de relaciones entre entidades.
3. La definición resumida de cada entidad core.

---

## Fuente de Verdad

La fuente de verdad son **exclusivamente las entidades del código** (decoradores de TypeORM, Prisma schema, o MikroORM — identificar cuál aplica). No inferir relaciones desde controllers, services o DTOs. Si existe discrepancia entre un service y una entidad, la entidad prevalece.

Archivos a inspeccionar (en orden de prioridad):
1. `**/*.entity.ts` — Definiciones de entidad (TypeORM)
2. `prisma/schema.prisma` — Si el proyecto usa Prisma
3. `**/*.schema.ts` — Si usa MikroORM o Mongoose
4. Archivos de migración (`**/migrations/*.ts`) — Para validar constraints y defaults
5. `**/*.module.ts` — Para confirmar qué entidades están registradas

---

## Formato de Salida Obligatorio

El archivo `DATABASE_SCHEMA.md` **debe** seguir esta estructura exacta. No usar diagramas Mermaid. Usar notación de flechas en texto plano.

```markdown
# DATABASE ARCHITECTURE & SCHEMA MAP

## 1. General Database Rules
*   **Strategy:** [Code-first/Schema-first] ([ORM utilizado]).
*   **IDs:** [Estrategia de IDs detectada — BigInt, UUID, o híbrida].
*   **Naming:** Tables (`convención`), Columns (`convención`), Models (`convención`).
*   **FK Convention:** `convención detectada`.

## 2. Relationship Map (The Truth)

*   **[Nombre del Contexto]:**
    *   `EntityA` (1) <--> (N) `EntityB` (via `foreign_key_column`)
    *   `EntityA` (1) <--> (1) `EntityB` (via `foreign_key_column`)
    *   `EntityA` (N) <--> (N) `EntityB` (via `join_table_name`)

## 3. Core Entity Definitions (Summary)

### `ModelName` — table: `table_name` — path: `relative/path/to/entity.ts`
*   **PK:** `column` (type)
*   **FK:** `column` (type) -> `TargetEntity` — `relationType`
*   **Key Data:** `column` (type, constraints), ...
*   **Timestamps:** `created_at`, `updated_at`
*   **Indexes:** listado de índices
*   **Business Logic:** notas relevantes si las hay (nullable, defaults, enum values)
```

### Reglas del formato:
- Cada relación debe indicar cardinalidad exacta: `(1) <--> (1)`, `(1) <--> (N)`, `(N) <--> (N)`.
- Cada relación debe indicar la columna FK o tabla join: `(via column_name)`.
- Agrupar relaciones por contexto de dominio. Los contextos se **descubren del código**, no se inventan ni se asumen de fuentes externas.
- En las definiciones de entidad, incluir **todos** los campos, no solo los "importantes".
- Documentar valores de enums entre paréntesis.
- Documentar nullable, unique, default values.
- Documentar cascade behaviors cuando estén definidos explícitamente.

---

## Reglas de Negocio a Capturar

Si al inspeccionar las entidades o sus decoradores detectas alguna de estas piezas, documéntalas en la sección `Business Logic` de la entidad correspondiente:

- Constraints unique compuestos.
- Campos con valores calculados o derivados.
- Soft deletes (`deletedAt`, `@DeleteDateColumn`).
- Relaciones polimórficas (`tokenable_type` / `tokenable_id` pattern).
- Campos JSON con estructura conocida (documentar el shape esperado si es inferible).
- Event listeners o subscribers vinculados a entidades (`@BeforeInsert`, `@AfterUpdate`, etc.).
- Guards o validaciones a nivel de entidad.

---

## Criterios de Aceptación

| # | Criterio | Obligatorio |
|---|----------|:-----------:|
| 1 | El archivo sigue el formato de 3 secciones exacto | ✅ |
| 2 | Todas las entidades del proyecto están documentadas | ✅ |
| 3 | Todas las relaciones están mapeadas con cardinalidad y FK | ✅ |
| 4 | Los tipos de columna coinciden con los decoradores del código | ✅ |
| 5 | Los enums listan todos sus valores posibles | ✅ |
| 6 | Las constraints (unique, nullable, default) están documentadas | ✅ |
| 7 | Los índices están listados | ✅ |
| 8 | No hay entidades inventadas ni relaciones inferidas sin evidencia en código | ✅ |
| 9 | El path relativo a cada entidad es correcto y verificable | ✅ |
| 10 | Los contextos de dominio fueron descubiertos del código, no asumidos | ✅ |

---

## Notas sobre Auditoría

> **IMPORTANTE:** Este documento será sometido a validación cruzada automatizada.
> El sistema auditor (OpenAI Codex) recibirá acceso al código fuente y al `DATABASE_SCHEMA.md` generado.
> Se verificará:
> - Que cada entidad listada exista en el código.
> - Que cada relación documentada corresponda a un decorador real.
> - Que no haya entidades presentes en el código y ausentes en el documento.
> - Que los tipos, constraints e índices sean exactos.
> - Que no se haya inyectado contexto de dominio externo al proyecto (información de ejemplos, documentación de referencia, o conversaciones previas).
>
> **Tolerancia a errores: cero.** Un documento incompleto, con discrepancias, o con información inventada será rechazado.