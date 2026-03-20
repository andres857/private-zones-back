# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant LMS (Learning Management System) backend — **Kalm System**. NestJS + TypeORM + PostgreSQL. Migrating from a legacy Laravel system to this new stack. Spanish-speaking development team.

## Commands

```bash
# Development
yarn install            # Install dependencies
yarn start:dev          # Dev server with hot-reload (port 3000)
yarn start:debug        # Debug mode with hot-reload

# Build & Production
yarn build              # Compile to dist/
yarn start:prod         # Run compiled app

# Testing
yarn test               # Unit tests (jest)
yarn test:watch         # Unit tests with watch
yarn test:cov           # Unit tests with coverage
yarn test:e2e           # E2E tests (jest --config ./test/jest-e2e.json)

# Code Quality
yarn lint               # ESLint with auto-fix
yarn format             # Prettier formatting

# Docker
docker compose --profile dev up      # Dev: PostgreSQL 16 + app with hot-reload
docker compose --profile prod up     # Prod: optimized build
```

## Architecture

### API Configuration
- Global prefix: `/v1` (all routes start with `/v1/`)
- Swagger docs: `/api`
- CORS: allows `*.klmsystem.online`, `*.klmsystem.com`, `*.kalmsystem.com`, and localhost dev origins
- Global `ValidationPipe`: whitelist mode, strips unknown properties, transforms DTOs
- Timezone: `America/Bogota`
- WebSocket: Socket.io adapter with CORS support

### Multi-tenancy
Every request is tenant-scoped. The `TenantValidationInterceptor` extracts tenant from multiple sources (priority order): `X-Tenant-Domain` header, `X-Tenant-ID` header, request body, or origin domain. Most domain entities have a `tenantId` FK to the `Tenant` entity.

### Authentication & Authorization
- **JWT + Refresh Tokens**: Passport strategy with `JwtAuthGuard` applied globally
- **Public routes**: Use `@Public()` decorator to bypass auth
- **User extraction**: Use `@GetUser()` decorator to get authenticated user
- **RBAC**: `PermissionGuard` checks roles/permissions. Use `@RequiredRoles()` or `@RequiredPermissions()` decorators
- **Tenant isolation**: `TenantOwnershipGuard` ensures users access only their tenant's data

### Database (TypeORM, Code-first)
- PostgreSQL with `synchronize: true` (auto-sync schema from entities)
- All new entities use UUID primary keys via `@PrimaryGeneratedColumn('uuid')`
- Soft deletes via `@DeleteDateColumn()` on many entities
- Internationalization: separate `*_translations` tables with `languageCode` column (courses, activities, assessments, assessment questions/options)
- Full schema documented in `DATABASE_SCHEMA.md`

### Module Organization Pattern
Each feature module follows: `module.ts`, `controller.ts`, `service.ts`, `entities/`, `dto/`. Key modules:
- **auth/**: JWT strategy, guards (`JwtAuthGuard`), interceptors (`TenantValidationInterceptor`, `DefaultRoleInterceptor`), decorators (`@Public()`, `@GetUser()`)
- **courses/**: Core course entity plus config, translations, modules, module items, views config, user enrollments (via `CoursesUsers` join entity)
- **assessments/**: Evaluations/surveys with questions, options, attempts, answers — all with translation support. Includes session tokens for secure access
- **activities/**: Didactic games (word search, crossword, hanging, complete phrase) — each game type has its own entity linked 1:1 to `Activity`
- **tasks/**: Assignments with submissions, grading, file attachments
- **forums/**: Discussion forums with nested comments (self-referential), reactions on both forums and comments
- **progress/**: Three-level tracking: `UserCourseProgress` → `UserModuleProgress` → `UserItemProgress`, plus `UserSession` for time tracking
- **gateway-payment/**: Stripe integration for subscriptions
- **storage/**: AWS S3 file storage
- **private-zones/**: Legacy entity mapping (reads from original Laravel `courses` table with integer PKs)

### Key Patterns
- **Polymorphic references**: `ModuleItem` uses `type` enum + `referenceId` to point to different entity types (content, forum, task, quiz, survey, activity)
- **Polymorphic logging**: `UserActivityLog` uses `referenceType` + `referenceId` pattern
- **Configuration entities**: Many core entities have a companion `*Configuration`/`*Config` entity in a 1:1 relationship (courses, modules, tasks, activities, assessments)
- **Cascade behavior**: Parent entities cascade to translations, configurations, and child collections. `onDelete: CASCADE` used on tenant-scoped entities
- **Legacy coexistence**: `src/private-zones/entities/course.entity.ts` maps to the same `courses` table with integer PKs for legacy data access; `src/auth/entities/user.entity.ts` is a duplicate User entity used within the auth module

### Environment Variables
Key env vars (see `.env.example`): `APP_PORT`, `DATABASE_HOST/PORT/NAME`, `POSTGRES_USER/PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRATION`, `STRIPE_SECRET_KEY`, `SMTP_USER/SMTP_PASS` (SMTP2GO).
