# DATABASE ARCHITECTURE & SCHEMA MAP

## 1. General Database Rules
*   **Strategy:** Code-first (TypeORM).
*   **IDs:** UUID (`uuid`) via `@PrimaryGeneratedColumn('uuid')` for all new entities. One legacy entity (`Course` in `private-zones`) uses auto-increment integer `@PrimaryGeneratedColumn()`.
*   **Naming:** Tables (`snake_case` / `kebab-case` mixed — e.g., `courses_modules`, `user-config`), Columns (`camelCase` predominantly, some legacy `snake_case`), Models (`PascalCase`).
*   **FK Convention:** Column name matches relation property + `Id` suffix (e.g., `tenantId`, `courseId`, `userId`). Some legacy columns use `snake_case` (e.g., `tenant_id`, `product_id`).
*   **Soft Deletes:** Many entities use `@DeleteDateColumn()` for `deletedAt` / `deleted_at` soft-delete pattern.
*   **Timestamps:** Most entities use `@CreateDateColumn()` and `@UpdateDateColumn()`. Some legacy entities use manual `@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })`.
*   **Multi-tenancy:** Enforced via `tenantId` FK on most domain entities pointing to `Tenant`.
*   **Internationalization:** Translation pattern used across courses, activities, assessments, and assessment questions via separate `*_translations` tables with `languageCode` column.

## 2. Relationship Map (The Truth)

*   **Authentication & Users:**
    *   `User` (1) <--> (N) `RefreshToken` (via `userId`) — cascade on User
    *   `User` (N) <--> (N) `Role` (via `user_roles_role` join table — TypeORM auto-generated from `@JoinTable()` on User)
    *   `User` (1) <--> (1) `UserConfig` (via `UserConfig.userId` — auto-generated JoinColumn)
    *   `User` (1) <--> (1) `UserProfileConfig` (via `userId`)
    *   `User` (1) <--> (1) `UserNotificationConfig` (via `UserNotificationConfig.userId` — auto-generated JoinColumn)
    *   `User` (N) <--> (1) `Tenant` (via `tenantId`)

*   **Roles & Permissions:**
    *   `Role` (N) <--> (N) `Permission` (via `role_permissions` join table)
    *   `UserTenantPermission` (N) <--> (1) `User` (via `userId`)
    *   `UserTenantPermission` (N) <--> (1) `Tenant` (via `tenantId`)
    *   `UserTenantPermission` (N) <--> (1) `Permission` (via `permissionId`)

*   **Tenant Configuration:**
    *   `Tenant` (1) <--> (1) `TenantConfig` (via `TenantConfig.tenantId` — auto-generated JoinColumn)
    *   `Tenant` (1) <--> (1) `TenantContactInfo` (via `TenantContactInfo.tenantId` — auto-generated JoinColumn)
    *   `Tenant` (1) <--> (N) `TenantViewConfig` (via `TenantViewConfig.tenantId` — auto-generated JoinColumn)
    *   `Tenant` (1) <--> (N) `TenantComponentConfig` (via `TenantComponentConfig.tenantId` — auto-generated JoinColumn)
    *   `Tenant` (1) <--> (N) `TenantProduct` (via `tenant_id`)
    *   `Tenant` (1) <--> (N) `Subscription` (via `tenant_id`)
    *   `TenantProduct` (1) <--> (N) `Subscription` (via `product_id`)

*   **Courses Core:**
    *   `Tenant` (1) <--> (N) `Courses` (via `tenantId`)
    *   `Courses` (1) <--> (1) `CourseConfiguration` (via `courseId`)
    *   `Courses` (1) <--> (N) `CourseTranslation` (via `courseId`) — cascade, eager
    *   `Courses` (1) <--> (N) `CoursesViewsConfig` (via `courseId`) — cascade
    *   `Courses` (1) <--> (N) `CourseModule` (via `courseId`) — cascade
    *   `Courses` (1) <--> (N) `CoursesUsers` (via `courseId`) — onDelete CASCADE
    *   `User` (1) <--> (N) `CoursesUsers` (via `userId`) — onDelete CASCADE
    *   `Courses` (N) <--> (N) `Section` (via `courses_sections` join table)
    *   `Courses` (N) <--> (N) `ContentItem` (via `course_contents` join table)

*   **Sections:**
    *   `Tenant` (1) <--> (N) `Section` (via `tenantId`)
    *   `Section` (N) <--> (N) `Courses` (via `courses_sections` join table — owned by Section)

*   **Course Modules & Items:**
    *   `CourseModule` (1) <--> (1) `CourseModuleConfig` (via `courseModuleId`)
    *   `CourseModule` (1) <--> (N) `ModuleItem` (via `moduleId`)

*   **Contents:**
    *   `Tenant` (1) <--> (N) `ContentItem` (via `tenantId`)
    *   `Tenant` (1) <--> (N) `ContentCategory` (via `tenantId`) — onDelete CASCADE
    *   `Courses` (1) <--> (N) `ContentCategory` (via `courseId`) — onDelete CASCADE
    *   `ContentCategory` (N) <--> (N) `ContentItem` (via `content_category_items` join table)

*   **Tasks:**
    *   `Tenant` (1) <--> (N) `Task` (via `tenantId`) — onDelete CASCADE
    *   `Courses` (1) <--> (N) `Task` (via `courseId`) — onDelete CASCADE
    *   `User` (1) <--> (N) `Task` (via `createdBy`) — nullable
    *   `Task` (1) <--> (1) `TaskConfig` (via `taskId`) — cascade, onDelete CASCADE
    *   `Task` (1) <--> (N) `TaskSubmission` (via `taskId`) — cascade, onDelete CASCADE
    *   `Task` (1) <--> (N) `TaskAttachment` (via `taskId`) — cascade, onDelete CASCADE
    *   `TaskSubmission` (1) <--> (N) `TaskSubmissionFile` (via `submissionId`) — cascade, onDelete CASCADE
    *   `TaskSubmission` (N) <--> (1) `User` (via `userId`) — onDelete CASCADE
    *   `TaskSubmission` (N) <--> (1) `User` (via `gradedBy`) — nullable

*   **Forums:**
    *   `Tenant` (1) <--> (N) `Forum` (via `tenantId`)
    *   `Courses` (1) <--> (N) `Forum` (via `courseId`) — cascade, onDelete CASCADE
    *   `User` (1) <--> (N) `Forum` (via `authorId`)
    *   `Forum` (1) <--> (N) `ForumComment` (via `forumId`) — cascade, onDelete CASCADE
    *   `Forum` (1) <--> (N) `ForumReaction` (via `forumId`) — cascade, onDelete CASCADE
    *   `User` (1) <--> (N) `ForumComment` (via `authorId`)
    *   `ForumComment` (1) <--> (N) `ForumComment` (via `parentCommentId`) — self-referential, onDelete CASCADE
    *   `ForumComment` (1) <--> (N) `CommentReaction` (via `commentId`) — cascade, onDelete CASCADE
    *   `User` (1) <--> (N) `ForumReaction` (via `userId`)
    *   `User` (1) <--> (N) `CommentReaction` (via `userId`)

*   **Assessments:**
    *   `Tenant` (1) <--> (N) `Assessment` (via `tenantId`)
    *   `Courses` (1) <--> (N) `Assessment` (via `courseId`) — nullable
    *   `Assessment` (1) <--> (1) `AssessmentConfiguration` (via `assessmentId`) — cascade
    *   `Assessment` (1) <--> (N) `AssessmentTranslation` (via `assessmentId`) — cascade, eager, onDelete CASCADE
    *   `Assessment` (1) <--> (N) `AssessmentQuestion` (via `assessmentId`) — cascade, onDelete CASCADE
    *   `Assessment` (1) <--> (N) `AssessmentAttempt` (via `assessmentId`) — onDelete CASCADE
    *   `AssessmentQuestion` (1) <--> (N) `AssessmentQuestionOption` (via `questionId`) — cascade, onDelete CASCADE
    *   `AssessmentQuestion` (1) <--> (N) `AssessmentQuestionTranslation` (via `questionId`) — cascade, eager, onDelete CASCADE
    *   `AssessmentQuestionOption` (1) <--> (N) `AssessmentQuestionOptionTranslation` (via `optionId`) — cascade, eager, onDelete CASCADE
    *   `AssessmentAttempt` (1) <--> (N) `AssessmentAttemptAnswer` (via `attemptId`) — cascade, onDelete CASCADE
    *   `AssessmentAttempt` (N) <--> (1) `User` (via `userId`)
    *   `AssessmentAttemptAnswer` (N) <--> (1) `AssessmentQuestion` (via `questionId`)
    *   `AssessmentSession` (N) <--> (1) `Assessment` (via `assessmentId`)
    *   `AssessmentSession` (N) <--> (1) `User` (via `userId`)

*   **Activities (Didactic Games):**
    *   `Tenant` (1) <--> (N) `Activity` (via `tenantId`)
    *   `Courses` (1) <--> (N) `Activity` (via `courseId`) — nullable
    *   `Activity` (1) <--> (1) `ActivityConfiguration` (via `activityId`) — cascade
    *   `Activity` (1) <--> (N) `ActivityTranslation` (via `activityId`) — cascade, eager, onDelete CASCADE
    *   `Activity` (1) <--> (N) `ActivityAttempt` (via `activityId`)
    *   `ActivityAttempt` (N) <--> (1) `User` (via `userId`)
    *   `Activity` (1) <--> (1) `WordSearchGame` (via `activityId`)
    *   `Activity` (1) <--> (1) `CrosswordGame` (via `activityId`)
    *   `Activity` (1) <--> (1) `HangingGame` (via `activityId`)
    *   `Activity` (1) <--> (1) `CompletePhraseGame` (via `activityId`)

*   **Quizzes & Surveys (Standalone):**
    *   `Tenant` (1) <--> (N) `Quiz` (via `tenantId`)
    *   `Tenant` (1) <--> (N) `Survey` (via `tenantId`)

*   **Progress Tracking:**
    *   `User` (1) <--> (N) `UserCourseProgress` (via `userId`) — onDelete CASCADE
    *   `Courses` (1) <--> (N) `UserCourseProgress` (via `courseId`) — onDelete CASCADE
    *   `User` (1) <--> (N) `UserModuleProgress` (via `userId`) — onDelete CASCADE
    *   `CourseModule` (1) <--> (N) `UserModuleProgress` (via `moduleId`) — onDelete CASCADE
    *   `User` (1) <--> (N) `UserItemProgress` (via `userId`) — onDelete CASCADE
    *   `ModuleItem` (1) <--> (N) `UserItemProgress` (via `itemId`) — onDelete CASCADE
    *   `User` (1) <--> (N) `UserSession` (via `userId`) — onDelete CASCADE

*   **User Activity Logging:**
    *   `User` (1) <--> (N) `UserActivityLog` (via `userId`) — onDelete CASCADE

## 3. Core Entity Definitions (Summary)

---

### `User` — table: `users` — path: `src/users/entities/user.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `name` (varchar, nullable), `lastName` (varchar, nullable), `email` (varchar, not null), `password` (varchar, not null, @Exclude), `isActive` (boolean, default: true), `passwordResetToken` (varchar, nullable, @Exclude), `passwordResetExpires` (Date, nullable, @Exclude)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Composite unique index on [`email`, `tenantId`]
*   **Business Logic:** `@BeforeInsert` hook hashes password with bcrypt (salt rounds: 10). Password hash detection via `$2b$` prefix check. ManyToMany with `Role` uses `eager: true`.

---

### `RefreshToken` — table: `refresh_tokens` — path: `src/auth/entities/token.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE
*   **Key Data:** `token` (varchar, unique), `isRevoked` (boolean, default: false), `revokedAt` (Date, nullable), `revokedFromIp` (varchar, nullable), `expiresAt` (Date), `userAgent` (varchar, nullable), `ipAddress` (varchar, nullable), `deviceFingerprint` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit (unique on `token`)
*   **Business Logic:** Helper method `isActive()` checks `!isRevoked && expiresAt > now`.

---

### `Role` — table: `role` (TypeORM default) — path: `src/roles/entities/role.entity.ts`
*   **PK:** `id` (uuid)
*   **Key Data:** `name` (varchar, unique), `description` (varchar, nullable)
*   **Timestamps:** None
*   **Indexes:** Unique on `name`
*   **Business Logic:** ManyToMany with `User` (inverse side). ManyToMany with `Permission` via `role_permissions` join table (owning side).

---

### `Permission` — table: `permissions` — path: `src/permissions/entities/permission.entity.ts`
*   **PK:** `id` (uuid)
*   **Key Data:** `name` (varchar, unique), `resource` (enum: `users`, `courses`, `sections`, `tenants`, `roles`, `dashboard`, `settings`, `reports`, `content`, `enrollments`, `payments`), `action` (enum: `create`, `read`, `update`, `delete`, `assign`, `manage`, `view_all`, `export`, `import`), `description` (varchar, nullable), `requiresTenantOwnership` (boolean, default: false), `isSuperAdminOnly` (boolean, default: false)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Composite unique index on [`resource`, `action`]
*   **Business Logic:** None.

---

### `UserTenantPermission` — table: `user_tenant_permissions` — path: `src/permissions/entities/user-tenant-permission.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `permissionId` (uuid) -> `Permission` — ManyToOne, onDelete CASCADE
*   **Key Data:** `granted` (boolean, default: true), `grantedBy` (varchar, nullable), `expiresAt` (Date, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Composite unique index on [`userId`, `tenantId`, `permissionId`]
*   **Business Logic:** `granted: false` means explicitly denied permission. `expiresAt` supports time-limited permissions.

---

### `Tenant` — table: `tenant` (TypeORM default) — path: `src/tenants/entities/tenant.entity.ts`
*   **PK:** `id` (uuid)
*   **Key Data:** `name` (varchar, unique), `slug` (varchar, unique), `domain` (varchar, unique), `contactEmail` (varchar, nullable), `plan` (varchar, nullable), `client_id_mz` (varchar, nullable, unique)
*   **Timestamps:** `createdAt` (timestamp, default: CURRENT_TIMESTAMP), `updatedAt` (timestamp, default: CURRENT_TIMESTAMP, onUpdate: CURRENT_TIMESTAMP)
*   **Indexes:** Unique on `name`, `slug`, `domain`, `client_id_mz`
*   **Business Logic:** Central multi-tenancy entity. `client_id_mz` links to legacy Laravel system.

---

### `TenantConfig` — table: `tenant_config` (TypeORM default) — path: `src/tenants/entities/tenant-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (auto-generated JoinColumn) -> `Tenant` — OneToOne, onDelete CASCADE
*   **Key Data:** `status` (boolean, default: true), `primaryColor` (varchar, default: '#0052cc'), `secondaryColor` (varchar, default: '#ffffff'), `showLearningModule` (boolean, default: true), `enableChatSupport` (boolean, default: false), `allowGamification` (boolean, default: true), `timezone` (varchar, nullable), `maxUsers` (int, default: 1000), `storageLimit` (int, default: 100), `allowUserPasswordChange` (boolean, default: true), `enableEmailNotifications` (boolean, default: true), `faviconPath` (varchar, nullable), `logoPath` (varchar, nullable), `loginBackgroundPath` (varchar, nullable), `iconPath` (varchar, nullable), `allowSelfRegistration` (boolean, default: true), `allowGoogleLogin` (boolean, default: false), `allowFacebookLogin` (boolean, default: false), `loginMethod` (enum: `email`, `document`, `both`, default: `email`), `allowValidationStatusUsers` (boolean, default: true), `requireLastName` (boolean, default: true), `requirePhone` (boolean, default: true), `requireDocumentType` (boolean, default: true), `requireDocument` (boolean, default: true), `requireOrganization` (boolean, default: false), `requirePosition` (boolean, default: false), `requireGender` (boolean, default: false), `requireCity` (boolean, default: false), `requireAddress` (boolean, default: false), `language` (text, nullable)
*   **Timestamps:** None
*   **Indexes:** None explicit
*   **Business Logic:** Controls login/registration field requirements and authentication methods per tenant.

---

### `TenantContactInfo` — table: `tenant_contact_info` (TypeORM default) — path: `src/tenants/entities/tenant-contact-info.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (auto-generated JoinColumn) -> `Tenant` — OneToOne, onDelete CASCADE
*   **Key Data:** `contactPerson` (varchar), `contactEmail` (varchar), `phone` (varchar), `address` (varchar), `url_portal` (varchar, nullable), `nit` (varchar, nullable)
*   **Timestamps:** None
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `TenantViewConfig` — table: `tenant_view_config` (TypeORM default) — path: `src/tenants/entities/tenant-view-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (auto-generated JoinColumn) -> `Tenant` — ManyToOne, onDelete CASCADE
*   **Key Data:** `viewType` (enum: `login`, `register`, `home`, `metrics`, `options`, `customers`, `users`, `courses`, `sections`, `frequentlyask`, `documents`, `facetoface`, `videocalls`), `title` (varchar, nullable), `description` (text, nullable), `allowBackground` (boolean, default: false), `backgroundType` (enum: `image`, `color`, `none`, default: `color`), `backgroundImagePath` (varchar, nullable), `backgroundColor` (varchar, nullable, default: '#eff4ff'), `welcomeTitle` (varchar, nullable), `welcomeMessage` (text, nullable), `welcomeContentType` (enum: `text`, `html`, `video`, `image`, `carousel`, default: `text`), `introVideoUrl` (varchar, nullable), `tutorialVideoUrl` (varchar, nullable), `autoplayVideo` (boolean, default: false), `showVideoControls` (boolean, default: true), `instructionsText` (text, nullable), `helpText` (text, nullable), `disclaimerText` (text, nullable), `helpUrl` (varchar, nullable), `documentationUrl` (varchar, nullable), `supportUrl` (varchar, nullable), `additionalSettings` (jsonb, nullable), `isActive` (boolean, default: true)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `TenantComponentConfig` — table: `tenant_component_config` (TypeORM default) — path: `src/tenants/entities/tenant-component-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (auto-generated JoinColumn) -> `Tenant` — ManyToOne, onDelete CASCADE
*   **Key Data:** `componentType` (enum: `navbar`, `footer`, `sidebar`, `header`, `breadcrumb`, `search_bar`, `user_menu`, `notification_panel`, `chat_widget`, `loading_spinner`, `error_boundary`, `modal`, `toast`, `card`, `button`, `form`, `table`, `pagination`), `componentName` (varchar, nullable), `isVisible` (boolean, default: true), `visibleOnViews` (simple-array, nullable), `hiddenOnViews` (simple-array, nullable), `position` (enum: `top`, `bottom`, `left`, `right`, `center`, `fixed`, `sticky`, `absolute`, nullable), `zIndex` (int, nullable), `customPosition` (varchar, nullable), `backgroundColor` (varchar, nullable), `textColor` (varchar, nullable), `borderColor` (varchar, nullable), `borderRadius` (varchar, nullable), `padding` (varchar, nullable), `margin` (varchar, nullable), `width` (varchar, nullable), `height` (varchar, nullable), `fontSize` (varchar, nullable), `fontFamily` (varchar, nullable), `fontWeight` (varchar, nullable), `customCss` (text, nullable), `logoUrl` (varchar, nullable), `logoAlt` (varchar, nullable), `title` (varchar, nullable), `description` (text, nullable), `customHtml` (text, nullable), `componentProps` (json, nullable), `menuItems` (json, nullable), `brandText` (varchar, nullable), `showUserAvatar` (boolean, default: false), `showNotifications` (boolean, default: true), `showSearch` (boolean, default: true), `footerLinks` (json, nullable), `copyrightText` (varchar, nullable), `socialLinks` (json, nullable), `collapsible` (boolean, default: true), `collapsed` (boolean, default: false), `sidebarWidth` (varchar, nullable), `allowedRoles` (simple-array, nullable), `restrictedRoles` (simple-array, nullable), `isActive` (boolean, default: true), `notes` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Non-unique composite index on [`tenant`, `componentType`]
*   **Business Logic:** Role-based visibility via `allowedRoles`/`restrictedRoles`.

---

### `TenantProduct` — table: `tenant_product` (TypeORM default) — path: `src/tenants/entities/tenant-product.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenant_id` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE
*   **Key Data:** `laravel_plan_id` (varchar), `title` (varchar), `description` (varchar, nullable), `price` (decimal(10,2)), `currency` (varchar, default: 'USD'), `type_payment` (varchar), `recurring` (json, nullable), `features` (json, nullable), `max_users` (int, nullable), `max_storage_gb` (int, nullable), `modules_access` (json, nullable), `is_active` (boolean, default: true), `is_popular` (boolean, default: false), `is_featured` (boolean, default: false), `trial_period_days` (int, nullable), `setup_fee` (decimal(10,2), nullable), `stripe_product_id` (varchar, nullable), `stripe_price_id` (varchar, nullable), `stripe_metadata` (json, nullable), `status` (varchar, default: 'active')
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** Integration with Stripe and legacy Laravel billing system.

---

### `Subscription` — table: `subscription` (TypeORM default) — path: `src/tenants/entities/suscription-tenant.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenant_id` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `product_id` (uuid) -> `TenantProduct` — ManyToOne, onDelete CASCADE
*   **Key Data:** `laravel_user_id` (varchar), `user_email` (varchar, nullable), `stripe_subscription_id` (varchar), `stripe_customer_id` (varchar), `stripe_price_id` (varchar), `status` (varchar), `current_period_start` (timestamp), `current_period_end` (timestamp), `trial_start` (timestamp, nullable), `trial_end` (timestamp, nullable), `canceled_at` (timestamp, nullable), `ended_at` (timestamp, nullable), `amount` (decimal(10,2)), `currency` (varchar, default: 'USD'), `interval` (varchar), `interval_count` (int, default: 1), `stripe_metadata` (json, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `status` values: 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'. Integration with Stripe subscriptions.

---

### `Courses` — table: `courses` — path: `src/courses/entities/courses.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `slug` (varchar, unique), `isActive` (boolean, default: true)
*   **Timestamps:** `created_at`, `updated_at`
*   **Soft Delete:** `deleted_at` (@DeleteDateColumn)
*   **Indexes:** Unique on `slug`
*   **Business Logic:** ManyToMany with `ContentItem` via `course_contents` join table (owning side). ManyToMany with `Section` (inverse side). `translations` loaded with `eager: true`.

---

### `CourseConfiguration` — table: `courses_configurations` — path: `src/courses/entities/courses-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `courseId` (uuid) -> `Courses` — OneToOne
*   **Key Data:** `visibility` (enum: `public`, `private`, `restricted`, default: `private`), `isActive` (boolean, default: true), `isPublicGroup` (boolean, default: false), `status` (enum: `draft`, `published`, `archived`, `suspended`, default: `draft`), `coverImage` (varchar, nullable), `menuImage` (varchar, nullable), `thumbnailImage` (varchar, nullable), `colorTitle` (varchar), `acronym` (varchar(10), nullable), `code` (varchar, nullable), `category` (varchar, nullable), `subcategory` (varchar, nullable), `intensity` (int, default: 0), `estimatedHours` (int, nullable), `invitation_link` (varchar, nullable), `startDate` (Date, nullable), `endDate` (Date, nullable), `enrollmentStartDate` (Date, nullable), `enrollmentEndDate` (Date, nullable), `maxEnrollments` (int, nullable), `requiresApproval` (boolean, default: false), `allowSelfEnrollment` (boolean, default: true), `prerequisites` (jsonb, default: []), `metadata` (jsonb, default: {}), `order` (int)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `prerequisites` stores array of course IDs. `CourseIntensity` enum defined but not used (replaced by numeric `intensity`).

---

### `CourseTranslation` — table: `courses_translations` — path: `src/courses/entities/courses-translations.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `courseId` (uuid) -> `Courses` — ManyToOne
*   **Key Data:** `languageCode` (varchar(5)), `title` (varchar), `description` (text, nullable), `metadata` (jsonb, default: {} — shape: `{ tags?: string[], keywords?: string[], customFields?: Record<string, string> }`)
*   **Timestamps:** `create_at`, `updated_at`
*   **Indexes:** None explicit
*   **Business Logic:** ISO 639-1 language codes (e.g., 'es', 'en', 'pt-BR').

---

### `CoursesViewsConfig` — table: `courses_views_config` — path: `src/courses/entities/courses-view-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `courseId` (uuid) -> `Courses` — ManyToOne
*   **Key Data:** `viewType` (enum: `contents`, `forums`, `tasks`, `evaluations`, `surveys`, `thematic_rooms`, `live_sessions`, `didactic_activities`), `backgroundType` (enum: `color`, `image`, default: `color`), `backgroundColor` (varchar, nullable), `backgroundImagePath` (varchar, nullable), `customTitleEs` (varchar, nullable), `customTitleEn` (varchar, nullable), `titleColor` (varchar, nullable), `coverTypeHeader` (enum: `image`, `video`, nullable), `coverImageHeader` (varchar, nullable), `coverVideoHeader` (varchar, nullable), `coverTitleHeader` (varchar, nullable), `coverDescriptionHeader` (text, nullable), `coverTypeFooter` (enum: `image`, `video`, nullable), `coverImageFooter` (varchar, nullable), `coverVideoFooter` (varchar, nullable), `coverTitleFooter` (varchar, nullable), `coverDescriptionFooter` (text, nullable), `isActive` (boolean, default: true), `layoutConfig` (jsonb, default: {} — shape: `{ allowCoverHeader?: boolean, allowCoverFooter?: boolean, showTitle?: boolean, showDescription?: boolean, customCSS?: string, additionalSettings?: Record<string, any> }`), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** One config entry per view type per course.

---

### `CourseModule` — table: `courses_modules` — path: `src/courses/entities/courses-modules.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `courseId` (uuid) -> `Courses` — ManyToOne
*   **Key Data:** `title` (varchar), `description` (varchar, nullable), `thumbnailImagePath` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `CourseModuleConfig` — table: `courses_modules_config` — path: `src/courses/entities/courses-modules-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `courseModuleId` (uuid) -> `CourseModule` — OneToOne
*   **Key Data:** `isActive` (boolean, default: true), `order` (int, default: 0), `approvalPercentage` (int, default: 80), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** None explicit
*   **Business Logic:** `approvalPercentage` defines minimum score to pass the module.

---

### `ModuleItem` — table: `courses_modules_items` — path: `src/courses/entities/courses-modules-item.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `moduleId` (uuid) -> `CourseModule` — ManyToOne
*   **Key Data:** `type` (enum: `content`, `forum`, `task`, `quiz`, `survey`, `activity`), `referenceId` (uuid — polymorphic reference to actual object), `order` (int, default: 0)
*   **Timestamps:** None
*   **Indexes:** None explicit
*   **Business Logic:** Polymorphic reference pattern: `type` determines the entity type that `referenceId` points to.

---

### `CoursesUsers` — table: `courses_users` — path: `src/courses/entities/courses-users.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `courseId` (uuid) -> `Courses` — ManyToOne, onDelete CASCADE
*   **Timestamps:** `created_at`, `updated_at`
*   **Soft Delete:** `deleted_at` (@DeleteDateColumn)
*   **Indexes:** None explicit
*   **Business Logic:** Join entity for User-Course enrollment.

---

### `Section` — table: `sections` — path: `src/sections/entities/sections.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `slug` (varchar, unique), `name` (varchar, not null), `description` (text, nullable), `thumbnailImagePath` (varchar, nullable), `order` (int, nullable), `allowBanner` (boolean, default: false), `bannerPath` (varchar, nullable)
*   **Timestamps:** None
*   **Indexes:** Unique on `slug`
*   **Business Logic:** ManyToMany with `Courses` via `courses_sections` join table (owning side).

---

### `ContentItem` — table: `contents` — path: `src/contents/entities/courses-contents.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `title` (varchar), `contentType` (enum: `video`, `image`, `document`, `embed`, `scorm`), `contentUrl` (text), `description` (varchar, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`
*   **Business Logic:** ManyToMany with `Courses` (inverse side). ManyToMany with `ContentCategory` (inverse side).

---

### `ContentCategory` — table: `content_categories` — path: `src/contents/entities/courses-contents-categories.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `courseId` (uuid) -> `Courses` — ManyToOne, onDelete CASCADE
*   **Key Data:** `title` (varchar), `description` (varchar, nullable), `order` (int, default: 0, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `courseId`
*   **Business Logic:** ManyToMany with `ContentItem` via `content_category_items` join table (owning side).

---

### `Quiz` — table: `quizzes` — path: `src/courses/entities/courses-quizzes.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `title` (varchar), `description` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`
*   **Business Logic:** None.

---

### `Survey` — table: `surveys` — path: `src/courses/entities/courses-surveys.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne
*   **Key Data:** `title` (varchar), `description` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`
*   **Business Logic:** None.

---

### `Task` — table: `tasks` — path: `src/tasks/entities/courses-tasks.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `courseId` (uuid) -> `Courses` — ManyToOne, onDelete CASCADE; `createdBy` (uuid) -> `User` — ManyToOne, nullable
*   **Key Data:** `title` (varchar), `description` (text, nullable), `instructions` (text, nullable), `status` (enum: `draft`, `published`, `closed`, `archived`, default: `draft`), `startDate` (timestamp, nullable), `endDate` (timestamp, nullable), `lateSubmissionDate` (timestamp, nullable), `maxPoints` (decimal(5,2), nullable), `lateSubmissionPenalty` (decimal(5,2), nullable, default: 0), `maxFileUploads` (int, default: 5), `maxFileSize` (int, default: 10), `allowedFileTypes` (simple-array, nullable), `allowMultipleSubmissions` (boolean, default: true), `maxSubmissionAttempts` (int, nullable), `requireSubmission` (boolean, default: true), `enablePeerReview` (boolean, default: false), `thumbnailImagePath` (varchar, nullable), `order` (int, nullable, default: 0), `showGradeToStudent` (boolean, default: true), `showFeedbackToStudent` (boolean, default: true), `notifyOnSubmission` (boolean, default: false), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `courseId`
*   **Business Logic:** Late submission support with configurable penalty percentage.

---

### `TaskConfig` — table: `tasks_config` — path: `src/tasks/entities/courses-tasks-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `taskId` (uuid) -> `Task` — OneToOne, onDelete CASCADE
*   **Key Data:** `isActive` (boolean, default: true), `enableSupportResources` (boolean, default: false), `showResourcesBeforeSubmission` (boolean, default: false), `enableSelfAssessment` (boolean, default: false), `requireSelfAssessmentBeforeSubmit` (boolean, default: false), `enableFileUpload` (boolean, default: true), `requireFileUpload` (boolean, default: false), `enableTextSubmission` (boolean, default: false), `requireTextSubmission` (boolean, default: false), `showToStudentsBeforeStart` (boolean, default: true), `sendReminderBeforeDue` (boolean, default: true), `reminderHoursBeforeDue` (int, nullable, default: 24), `notifyOnGrade` (boolean, default: true), `autoGrade` (boolean, default: false), `requireGradeComment` (boolean, default: false), `enableGradeRubric` (boolean, default: false), `rubricData` (jsonb, nullable), `showOtherSubmissions` (boolean, default: false), `anonymizeSubmissions` (boolean, default: false), `enableGroupSubmission` (boolean, default: false), `maxGroupSize` (int, nullable), `enableVersionControl` (boolean, default: false), `lockAfterGrade` (boolean, default: false), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`
*   **Business Logic:** None.

---

### `TaskSubmission` — table: `task_submissions` — path: `src/tasks/entities/courses-tasks-submissions.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `taskId` (uuid) -> `Task` — ManyToOne, onDelete CASCADE; `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `gradedBy` (uuid) -> `User` — ManyToOne, nullable
*   **Key Data:** `status` (enum: `draft`, `submitted`, `late`, `graded`, `returned`, `resubmitted`, default: `draft`), `attemptNumber` (int, default: 1), `textSubmission` (text, nullable), `comments` (text, nullable), `submittedAt` (timestamp, nullable), `grade` (decimal(5,2), nullable), `feedback` (text, nullable), `gradedAt` (timestamp, nullable), `isLate` (boolean, default: false), `penaltyApplied` (decimal(5,2), nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `taskId`, Index on `userId`
*   **Business Logic:** `getFinalGrade()` calculates grade minus late penalty.

---

### `TaskAttachment` — table: `task_attachments` — path: `src/tasks/entities/courses-tasks-attachments.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `taskId` (uuid) -> `Task` — ManyToOne, onDelete CASCADE
*   **Key Data:** `fileName` (varchar), `originalFileName` (varchar), `fileUrl` (text), `fileSize` (bigint), `fileType` (varchar), `fileExtension` (varchar, nullable), `description` (text, nullable), `order` (int, default: 0), `metadata` (jsonb, default: {})
*   **Timestamps:** `uploadedAt` (@CreateDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `taskId`
*   **Business Logic:** Resource/material files attached to the task definition (not student submissions).

---

### `TaskSubmissionFile` — table: `task_submission_files` — path: `src/tasks/entities/courses-tasks-submission-files.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne, onDelete CASCADE; `submissionId` (uuid) -> `TaskSubmission` — ManyToOne, onDelete CASCADE
*   **Key Data:** `fileName` (varchar), `originalFileName` (varchar), `fileUrl` (text), `fileSize` (bigint), `fileType` (varchar), `fileExtension` (varchar, nullable), `order` (int, default: 0), `metadata` (jsonb, default: {})
*   **Timestamps:** `uploadedAt` (@CreateDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `submissionId`
*   **Business Logic:** Student-uploaded files for a task submission.

---

### `Forum` — table: `forums` — path: `src/forums/entities/forum.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne; `authorId` (uuid) -> `User` — ManyToOne; `courseId` (uuid) -> `Courses` — ManyToOne, onDelete CASCADE
*   **Key Data:** `title` (varchar(255)), `description` (text, nullable), `thumbnail` (varchar(500), nullable), `expirationDate` (timestamp, nullable), `isActive` (boolean, default: true), `isPinned` (boolean, default: false), `category` (varchar(100), nullable), `tags` (simple-array, nullable), `viewCount` (int, default: 0)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `tenantId`, Index on `authorId`, Index on `courseId`
*   **Business Logic:** `isExpired()` checks `expirationDate`. Comments and reactions cascaded.

---

### `ForumComment` — table: `forum_comments` — path: `src/forums/entities/forum-comment.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `forumId` (uuid) -> `Forum` — ManyToOne, onDelete CASCADE; `authorId` (uuid) -> `User` — ManyToOne; `parentCommentId` (uuid) -> `ForumComment` — ManyToOne, nullable, onDelete CASCADE (self-referential)
*   **Key Data:** `content` (text), `isEdited` (boolean, default: false)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** Index on `forumId`, Index on `authorId`, Index on `parentCommentId`
*   **Business Logic:** Self-referential tree structure for nested replies.

---

### `ForumReaction` — table: `forum_reactions` — path: `src/forums/entities/forum-reaction.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `forumId` (uuid) -> `Forum` — ManyToOne, onDelete CASCADE; `userId` (uuid) -> `User` — ManyToOne
*   **Key Data:** `type` (enum: `like`, `not_like`, `funny`, `love`, default: `like`)
*   **Timestamps:** `createdAt`
*   **Indexes:** Index on `forumId`, Index on `userId`
*   **Unique Constraints:** Composite unique on [`userId`, `forumId`]
*   **Business Logic:** One reaction per user per forum.

---

### `CommentReaction` — table: `comment_reactions` — path: `src/forums/entities/comment-reaction.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `commentId` (uuid) -> `ForumComment` — ManyToOne, onDelete CASCADE; `userId` (uuid) -> `User` — ManyToOne
*   **Key Data:** `type` (enum: `like`, `helpful`, default: `like`)
*   **Timestamps:** `createdAt`
*   **Indexes:** Index on `commentId`, Index on `userId`
*   **Unique Constraints:** Composite unique on [`userId`, `commentId`]
*   **Business Logic:** One reaction per user per comment.

---

### `Assessment` — table: `assessments` — path: `src/assessments/entities/assessment.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne; `courseId` (uuid) -> `Courses` — ManyToOne, nullable
*   **Key Data:** `slug` (varchar, unique), `type` (enum: `evaluation`, `survey`, `self_assessment`, default: `evaluation`), `status` (enum: `draft`, `published`, `archived`, `suspended`, default: `draft`), `isActive` (boolean, default: true), `order` (int, default: 0)
*   **Timestamps:** `created_at`, `updated_at`
*   **Soft Delete:** `deleted_at` (@DeleteDateColumn)
*   **Indexes:** Unique on `slug`
*   **Business Logic:** `translations` loaded with `eager: true`. Cascade on `configuration`, `translations`, `questions`.

---

### `AssessmentConfiguration` — table: `assessment_configurations` — path: `src/assessments/entities/assessment-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `assessmentId` (uuid) -> `Assessment` — OneToOne
*   **Key Data:** `description` (text, nullable), `isGradable` (boolean, default: true), `gradingMethod` (enum: `automatic`, `manual`, `hybrid`, default: `automatic`), `passingScore` (decimal(5,2), nullable), `maxScore` (decimal(5,2), default: 100), `generatesCertificate` (boolean, default: false), `certificateTemplateId` (varchar, nullable), `requirePassingScoreForCertificate` (boolean, default: false), `hasAdditionalQuestions` (boolean, default: false), `additionalQuestionsPosition` (varchar, nullable), `additionalQuestionsInstructions` (text, nullable), `maxAttempts` (int, default: 1), `allowReview` (boolean, default: false), `showCorrectAnswers` (boolean, default: false), `showScoreImmediately` (boolean, default: false), `timeBetweenAttempts` (int, nullable), `timeLimit` (int, nullable), `strictTimeLimit` (boolean, default: false), `questionOrderMode` (enum: `fixed`, `random`, `random_groups`, default: `fixed`), `randomizeOptions` (boolean, default: false), `oneQuestionPerPage` (boolean, default: false), `allowNavigationBetweenQuestions` (boolean, default: true), `availableFrom` (timestamp, nullable), `availableUntil` (timestamp, nullable), `gradeReleaseDate` (timestamp, nullable), `requirePassword` (boolean, default: false), `accessPassword` (varchar, nullable), `requireProctoring` (boolean, default: false), `preventTabSwitching` (boolean, default: false), `fullscreenMode` (boolean, default: false), `showFeedbackAfterQuestion` (boolean, default: true), `showFeedbackAfterCompletion` (boolean, default: true), `customPassMessage` (text, nullable), `customFailMessage` (text, nullable), `notifyInstructorOnCompletion` (boolean, default: false), `notifyInstructorOnNewAttempt` (boolean, default: false), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `maxAttempts: 0` means unlimited. Proctoring support via `requireProctoring`, `preventTabSwitching`, `fullscreenMode`.

---

### `AssessmentTranslation` — table: `assessment_translations` — path: `src/assessments/entities/assessment-translation.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `assessmentId` (uuid) -> `Assessment` — ManyToOne, onDelete CASCADE
*   **Key Data:** `languageCode` (varchar(10)), `title` (varchar), `description` (text, nullable), `instructions` (text, nullable), `welcomeMessage` (text, nullable), `completionMessage` (text, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `AssessmentQuestion` — table: `assessment_questions` — path: `src/assessments/entities/assessment-question.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `assessmentId` (uuid) -> `Assessment` — ManyToOne, onDelete CASCADE
*   **Key Data:** `type` (enum: `multiple_choice`, `multiple_response`, `true_false`, `short_answer`, `essay`, `matching`, `ordering`, `fill_in_blank`, `scale`, `matrix`, default: `multiple_choice`), `order` (int, default: 0), `isGradable` (boolean, default: true), `points` (decimal(5,2), default: 1), `difficulty` (enum: `easy`, `medium`, `hard`, nullable), `isRequired` (boolean, default: false), `allowPartialCredit` (boolean, default: false), `caseSensitive` (boolean, default: false), `minLength` (int, nullable), `maxLength` (int, nullable), `scaleMin` (int, nullable), `scaleMax` (int, nullable), `scaleStep` (int, nullable), `category` (varchar, nullable), `tag` (varchar, nullable), `questionBankId` (varchar, nullable), `randomGroup` (varchar, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Soft Delete:** `deletedAt` (@DeleteDateColumn)
*   **Indexes:** None explicit
*   **Business Logic:** `isGradable: false` marks additional/survey questions. `translations` loaded with `eager: true`.

---

### `AssessmentQuestionOption` — table: `assessment_question_options` — path: `src/assessments/entities/assessment-question-option.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `questionId` (uuid) -> `AssessmentQuestion` — ManyToOne, onDelete CASCADE
*   **Key Data:** `order` (int, default: 0), `isCorrect` (boolean, default: false), `partialCreditPercentage` (decimal(5,2), nullable), `matchingPairId` (varchar, nullable), `matchingGroup` (varchar, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `translations` loaded with `eager: true`. Matching pair fields support matching-type questions.

---

### `AssessmentQuestionOptionTranslation` — table: `assessment_question_option_translations` — path: `src/assessments/entities/assessment-question-option-translation.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `optionId` (uuid) -> `AssessmentQuestionOption` — ManyToOne, onDelete CASCADE
*   **Key Data:** `languageCode` (varchar(10)), `optionText` (text), `feedback` (text, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `AssessmentQuestionTranslation` — table: `assessment_question_translations` — path: `src/assessments/entities/assessment-question-translation.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `questionId` (uuid) -> `AssessmentQuestion` — ManyToOne, onDelete CASCADE
*   **Key Data:** `languageCode` (varchar(10)), `questionText` (text), `hint` (text, nullable), `feedback` (text, nullable), `correctFeedback` (text, nullable), `incorrectFeedback` (text, nullable), `explanation` (text, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `AssessmentAttempt` — table: `assessment_attempts` — path: `src/assessments/entities/assessment-attempt.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `assessmentId` (uuid) -> `Assessment` — ManyToOne, onDelete CASCADE; `userId` (uuid) -> `User` — ManyToOne
*   **Key Data:** `attemptNumber` (int, default: 1), `status` (enum: `in_progress`, `completed`, `abandoned`, `grading`, `graded`, default: `in_progress`), `startedAt` (Date, nullable), `completedAt` (Date, nullable), `submittedAt` (Date, nullable), `score` (decimal(5,2), nullable), `percentage` (decimal(5,2), nullable), `passed` (boolean, nullable), `timeSpent` (int, nullable), `ipAddress` (varchar, nullable), `userAgent` (varchar, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** Cascade on `answers`.

---

### `AssessmentAttemptAnswer` — table: `assessment_attempt_answers` — path: `src/assessments/entities/assessment-attempt-answer.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `attemptId` (uuid) -> `AssessmentAttempt` — ManyToOne, onDelete CASCADE; `questionId` (uuid) -> `AssessmentQuestion` — ManyToOne
*   **Key Data:** `selectedOptionIds` (jsonb, nullable), `textAnswer` (text, nullable), `orderingAnswer` (jsonb, nullable), `matchingAnswer` (jsonb, nullable), `fillInBlankAnswer` (jsonb, nullable), `isCorrect` (boolean, default: false), `pointsEarned` (decimal(5,2), nullable), `manuallyGraded` (boolean, default: false), `gradedBy` (varchar, nullable), `gradedAt` (Date, nullable), `feedback` (text, nullable), `timeSpent` (int, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** Multiple answer columns for different question types: `selectedOptionIds` (multiple choice), `textAnswer` (short answer/essay), `orderingAnswer` (ordering), `matchingAnswer` (matching pairs), `fillInBlankAnswer` (fill in blank).

---

### `AssessmentSession` — table: `assessment_sessions` — path: `src/assessments/entities/assessment-session.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `assessmentId` (uuid) -> `Assessment` — ManyToOne; `userId` (uuid) -> `User` — ManyToOne
*   **Key Data:** `token` (varchar, unique), `attemptId` (uuid), `expiresAt` (timestamp), `used` (boolean, default: false), `usedAt` (Date, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Unique on `token`
*   **Business Logic:** One-time access token for assessment attempts. `isValid()` checks `!used && !isExpired()`.

---

### `Activity` — table: `activities` — path: `src/activities/entities/activity.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `tenantId` (uuid) -> `Tenant` — ManyToOne; `courseId` (uuid) -> `Courses` — ManyToOne, nullable
*   **Key Data:** `slug` (varchar, unique), `type` (enum: `hanging`, `complete_phrase`, `drag_drop`, `crossword`, `matching`, `word_search`, `memory`, `quiz_game`, `puzzle`, default: `word_search`), `status` (enum: `draft`, `published`, `archived`, `suspended`, default: `draft`), `difficulty` (enum: `easy`, `medium`, `hard`, `expert`, default: `medium`), `isActive` (boolean, default: true), `order` (int, default: 0), `maxScore` (int, default: 0)
*   **Timestamps:** `created_at`, `updated_at`
*   **Soft Delete:** `deleted_at` (@DeleteDateColumn)
*   **Indexes:** Unique on `slug`
*   **Business Logic:** `translations` loaded with `eager: true`. Cascade on `configuration` and `translations`.

---

### `ActivityConfiguration` — table: `activity_configurations` — path: `src/activities/entities/activity-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — OneToOne
*   **Key Data:** `timeLimit` (int, nullable), `strictTimeLimit` (boolean, default: false), `maxAttempts` (int, default: 0), `timeBetweenAttempts` (int, nullable), `showTimer` (boolean, default: true), `showScore` (boolean, default: true), `showHints` (boolean, default: false), `maxHints` (int, default: 3), `isGradable` (boolean, default: true), `passingScore` (int, nullable), `showScoreImmediately` (boolean, default: true), `availableFrom` (timestamp, nullable), `availableUntil` (timestamp, nullable), `showFeedbackAfterCompletion` (boolean, default: true), `customSuccessMessage` (text, nullable), `customFailMessage` (text, nullable), `awardBadges` (boolean, default: false), `showLeaderboard` (boolean, default: false), `notifyInstructorOnCompletion` (boolean, default: false), `gameData` (jsonb, default: {}), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `maxAttempts: 0` means unlimited.

---

### `ActivityTranslation` — table: `activity_translations` — path: `src/activities/entities/activity-translation.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — ManyToOne, onDelete CASCADE
*   **Key Data:** `languageCode` (varchar(10)), `title` (varchar(500)), `description` (text, nullable), `instructions` (text, nullable), `welcomeMessage` (text, nullable), `completionMessage` (text, nullable), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Unique Constraints:** Composite unique on [`activityId`, `languageCode`]
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `ActivityAttempt` — table: `activity_attempts` — path: `src/activities/entities/activity-attempt.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — ManyToOne; `userId` (uuid) -> `User` — ManyToOne
*   **Key Data:** `status` (enum: `in_progress`, `completed`, `abandoned`, `expired`, default: `in_progress`), `score` (float, default: 0), `percentage` (float, nullable), `passed` (boolean, default: false), `timeSpent` (int, nullable), `hintsUsed` (int, default: 0), `attemptData` (jsonb, default: {}), `startedAt` (timestamp, nullable), `completedAt` (timestamp, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `attemptData` stores game-type-specific attempt details.

---

### `WordSearchGame` — table: `word_search_games` — path: `src/activities/games/word-search/entities/word-search.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — OneToOne
*   **Key Data:** `gridWidth` (int, default: 15), `gridHeight` (int, default: 15), `seed` (varchar(255)), `words` (jsonb, default: [] — shape: `WordItem[]` = `{ word: string, clue?: string, category?: string }`), `allowedDirections` (jsonb, default: ['horizontal', 'vertical', 'diagonal_down'] — values from enum: `horizontal`, `vertical`, `diagonal_down`, `diagonal_up`, `horizontal_reverse`, `vertical_reverse`, `diagonal_down_reverse`, `diagonal_up_reverse`), `fillEmptyCells` (boolean, default: true), `caseSensitive` (boolean, default: true), `showWordList` (boolean, default: false), `showClues` (boolean, default: false), `pointsPerWord` (int, default: 10), `bonusForSpeed` (int, default: 5), `penaltyPerHint` (int, default: -2)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `@BeforeInsert` hook auto-generates `seed` via `crypto.randomBytes(8).toString('hex')` if not provided. Seed ensures deterministic grid generation.

---

### `CrosswordGame` — table: `crossword_games` — path: `src/activities/games/crossword/entities/crossword.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — OneToOne
*   **Key Data:** `gridWidth` (int, default: 15), `gridHeight` (int, default: 15), `seed` (varchar(255)), `words` (jsonb, default: [] — shape: `CrosswordWord[]` = `{ number: number, word: string, clue: string, direction: 'horizontal'|'vertical', row: number, col: number }`), `caseSensitive` (boolean, default: false), `showClueNumbers` (boolean, default: true), `allowCheckLetter` (boolean, default: false), `allowCheckWord` (boolean, default: false), `autoCheckOnComplete` (boolean, default: false), `pointsPerWord` (int, default: 10), `bonusForPerfect` (int, default: 5), `penaltyPerCheck` (int, default: -1), `penaltyPerHint` (int, default: -2)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `@BeforeInsert` hook auto-generates `seed` via `crypto.randomBytes(8).toString('hex')` if not provided.

---

### `HangingGame` — table: `hanging_games` — path: `src/activities/games/hanging/entities/hanging.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — OneToOne
*   **Key Data:** `words` (jsonb, default: [] — shape: `HangingWord[]` = `{ word: string, category?: string, clue?: string }`), `maxAttempts` (int, default: 6), `caseSensitive` (boolean, default: false), `showCategory` (boolean, default: true), `showWordLength` (boolean, default: false), `pointsPerWord` (int, default: 10), `bonusForNoErrors` (int, default: 5), `penaltyPerError` (int, default: -2), `penaltyPerHint` (int, default: -3)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `CompletePhraseGame` — table: `complete_phrase_games` — path: `src/activities/games/complete-phrase/entities/complete-phrase.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `activityId` (uuid) -> `Activity` — OneToOne
*   **Key Data:** `phrases` (jsonb, default: [] — shape: `CompletePhraseItem[]` = `{ phrase: string, blanks: PhraseBlank[], category?: string, difficulty?: string, hint?: string }`; `PhraseBlank` = `{ id: number, type: 'text'|'select'|'drag_drop', correctAnswer: string, options?: BlankOption[], caseSensitive?: boolean, acceptSynonyms?: boolean, synonyms?: string[] }`), `caseSensitive` (boolean, default: false), `showHints` (boolean, default: true), `shuffleOptions` (boolean, default: false), `allowPartialCredit` (boolean, default: false), `pointsPerBlank` (int, default: 10), `bonusForPerfect` (int, default: 5), `penaltyPerError` (int, default: -1), `penaltyPerHint` (int, default: -2)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `UserCourseProgress` — table: `user_course_progress` — path: `src/progress/entities/user-course-progress.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `courseId` (uuid) -> `Courses` — ManyToOne, onDelete CASCADE
*   **Key Data:** `status` (enum: `not_started`, `in_progress`, `completed`, `abandoned`, `failed`, default: `not_started`), `progressPercentage` (decimal(5,2), default: 0), `scorePercentage` (decimal(5,2), default: 0), `started_at` (timestamp, nullable), `completed_at` (timestamp, nullable), `lastAccessedAt` (timestamp, nullable), `totalTimeSpent` (int, default: 0), `totalModulesCompleted` (int, default: 0), `totalModules` (int, default: 0), `totalItemsCompleted` (int, default: 0), `totalItems` (int, default: 0), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Unique Constraints:** Composite unique on [`userId`, `courseId`]
*   **Indexes:** Composite index on [`userId`, `status`], Composite index on [`courseId`, `status`], Index on `userId`, Index on `courseId`
*   **Business Logic:** None.

---

### `UserModuleProgress` — table: `user_module_progress` — path: `src/progress/entities/user-module-progress.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `moduleId` (uuid) -> `CourseModule` — ManyToOne, onDelete CASCADE
*   **Key Data:** `status` (enum: `not_started`, `in_progress`, `completed`, `failed`, default: `not_started`), `progressPercentage` (decimal(5,2), default: 0), `scorePercentage` (decimal(5,2), default: 0), `started_at` (timestamp, nullable), `completed_at` (timestamp, nullable), `lastAccessedAt` (timestamp, nullable), `timeSpent` (int, default: 0), `itemsCompleted` (int, default: 0), `totalItems` (int, default: 0), `attempts` (int, default: 0), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Unique Constraints:** Composite unique on [`userId`, `moduleId`]
*   **Indexes:** Composite index on [`userId`, `status`], Composite index on [`moduleId`, `status`], Index on `userId`, Index on `moduleId`
*   **Business Logic:** None.

---

### `UserItemProgress` — table: `user_item_progress` — path: `src/progress/entities/user-item-progress.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE; `itemId` (uuid) -> `ModuleItem` — ManyToOne, onDelete CASCADE
*   **Key Data:** `status` (enum: `not_started`, `in_progress`, `completed`, `skipped`, `failed`, default: `not_started`), `score` (decimal(5,2), nullable), `progressPercentage` (decimal(5,2), default: 0), `started_at` (timestamp, nullable), `completed_at` (timestamp, nullable), `lastAccessedAt` (timestamp, nullable), `timeSpent` (int, default: 0), `attempts` (int, default: 0), `bestScore` (int, nullable), `responses` (jsonb, default: {}), `metadata` (jsonb, default: {})
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Unique Constraints:** Composite unique on [`userId`, `itemId`]
*   **Indexes:** Composite index on [`userId`, `status`], Composite index on [`itemId`, `status`], Index on `userId`, Index on `itemId`
*   **Business Logic:** `responses` stores quiz/survey answers. `bestScore` tracks highest score across attempts.

---

### `UserSession` — table: `user_sessions` — path: `src/progress/entities/user-session.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE
*   **Key Data:** `courseId` (uuid, nullable), `moduleId` (uuid, nullable), `itemId` (uuid, nullable), `startTime` (timestamp), `endTime` (timestamp, nullable), `duration` (int, default: 0), `isActive` (boolean, default: true), `ipAddress` (inet, nullable), `userAgent` (varchar, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** Composite index on [`userId`, `isActive`], Composite index on [`courseId`, `isActive`], Index on `userId`, Index on `courseId`
*   **Business Logic:** `courseId`, `moduleId`, `itemId` are plain columns (no FK decorator) — flexible tracking of session context. `endSession()` method computes `duration`.

---

### `UserActivityLog` — table: `user_activity_log` — path: `src/users/entities/user-activity-log.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — ManyToOne, onDelete CASCADE
*   **Key Data:** `activityType` (enum: `course_started`, `course_completed`, `module_started`, `module_completed`, `item_started`, `item_completed`, `quiz_attempted`, `task_submitted`, `forum_participation`, `login`, `logout`), `referenceId` (varchar, nullable), `referenceType` (varchar, nullable), `details` (jsonb, default: {}), `ipAddress` (inet, nullable), `userAgent` (varchar, nullable)
*   **Timestamps:** `createdAt` (only @CreateDateColumn — no updatedAt)
*   **Indexes:** Composite index on [`userId`, `activityType`], Composite index on [`referenceId`, `activityType`], Index on `createdAt`, Index on `userId`, Index on `referenceId`
*   **Business Logic:** Polymorphic reference pattern: `referenceType` + `referenceId` point to the related domain object. Append-only log (no updatedAt).

---

### `UserConfig` — table: `user-config` — path: `src/users/entities/user-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (auto-generated JoinColumn) -> `User` — OneToOne, onDelete CASCADE
*   **Key Data:** `enableNotifications` (boolean, default: true)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `UserProfileConfig` — table: `user-profile-config` — path: `src/users/entities/user-profile-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (uuid) -> `User` — OneToOne, onDelete CASCADE
*   **Key Data:** `avatarPath` (varchar, nullable), `bio` (varchar, nullable), `phoneNumber` (varchar, nullable), `type_document` (enum: `CC`, `TI`, `CE`, `NIT`, `PA`, `RC`, `PEP`, `DNI`, `ID`, `DL`, `SSN`, `CURP`, `RUT`, `OTHER`, nullable), `documentNumber` (varchar, nullable), `organization` (varchar, nullable), `charge` (varchar, nullable), `gender` (varchar, nullable), `city` (varchar, nullable), `country` (varchar, nullable), `address` (varchar, nullable), `dateOfBirth` (Date, nullable)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** `DocumentType` enum supports multi-country identification documents.

---

### `UserNotificationConfig` — table: `user-notification-config` — path: `src/users/entities/user-notification-config.entity.ts`
*   **PK:** `id` (uuid)
*   **FK:** `userId` (auto-generated JoinColumn) -> `User` — OneToOne, onDelete CASCADE
*   **Key Data:** `enableNotifications` (boolean, default: true), `smsNotifications` (boolean, default: false), `browserNotifications` (boolean, default: false), `securityAlerts` (boolean, default: true), `accountUpdates` (boolean, default: false), `systemUpdates` (boolean, default: true), `marketingEmails` (boolean, default: false), `newsletterEmails` (boolean, default: false), `reminders` (boolean, default: true), `mentions` (boolean, default: true), `directMessages` (boolean, default: true)
*   **Timestamps:** `createdAt`, `updatedAt`
*   **Indexes:** None explicit
*   **Business Logic:** None.

---

### `Course` (Legacy) — table: `courses` — path: `src/private-zones/entities/course.entity.ts`
*   **PK:** `id` (integer, auto-increment)
*   **Key Data:** `id_resource_mzg` (int, nullable), `title` (varchar), `name` (varchar), `public` (int, default: 0), `client_id` (int), `creator_user` (int), `imagen` (varchar, nullable), `check_multiple_sections` (int, default: 0), `conference` (int, default: 0), `conference_tab` (varchar, nullable), `conference_tab_icon` (varchar, nullable), `color_tilte` (varchar, nullable), `conference_type` (varchar, nullable), `conference_user` (varchar, nullable), `metadata` (json, nullable), `conference_users` (varchar, nullable), `content_view` (varchar, nullable), `conference_background` (varchar, nullable), `es_content` (text, nullable), `en_content` (text, nullable), `cover_video` (varchar, nullable), `cover_image` (varchar, nullable), `es_test` (varchar, nullable), `en_test` (varchar, nullable), `es_forum` (varchar, nullable), `en_forum` (varchar, nullable), `es_poll` (varchar, nullable), `en_poll` (varchar, nullable), `crisp_code` (varchar, nullable), `index` (int, nullable), `es_task` (varchar, nullable), `en_task` (varchar, nullable), `conference_tab_en` (varchar, nullable), `activatebaground` (varchar, nullable), `group` (text, nullable), `es_group` (varchar, nullable), `en_group` (varchar, nullable), `es_videoroom` (varchar, nullable), `en_videoroom` (varchar, nullable), `es_directchat` (varchar, nullable), `en_directchat` (varchar, nullable), `group_st` (varchar, nullable), `id_secction` (varchar, nullable), `password` (varchar, nullable), `ordergroup` (varchar, nullable), `notification_whatsapp` (varchar, nullable), `es_Activity` (varchar, nullable), `en_Activity` (varchar, nullable), `es_measurement` (varchar, nullable), `en_measurement` (varchar, nullable), `video_cover_video_room` (varchar, nullable), `description_video_cover_videoroom` (varchar, nullable), `title_video_cover_video_room` (varchar, nullable), `default_tabl` (varchar, nullable), `inten_hour` (varchar, nullable), `abbreviation` (varchar, nullable), `not_visible` (int, nullable, default: 0), `type_cover` (varchar, nullable, default: 'image'), `enable_cover_header` (int, nullable, default: 0), `image_cover_videoroom` (varchar, nullable), `description_image_cover_videoroom` (varchar, nullable), `title_image_cover_videoroom` (varchar, nullable), `type_cover_footer` (varchar, nullable, default: 'image'), `enable_cover_footer` (int, nullable, default: 0), `image_cover_videoroom_footer` (varchar, nullable), `description_image_cover_videoroom_footer` (varchar, nullable), `title_image_cover_videoroom_footer` (varchar, nullable), `video_cover_videoroom_footer` (varchar, nullable), `description_video_cover_videoroom_footer` (varchar, nullable), `title_video_cover_videoroom_footer` (varchar, nullable), `enable_progress_modules` (int, nullable, default: 0), `enable_access_without_order_modules` (int, nullable, default: 0), `start_date` (date, nullable), `end_date` (date, nullable)
*   **Timestamps:** `created_at` (timestamp, default: CURRENT_TIMESTAMP), `updated_at` (timestamp, default: CURRENT_TIMESTAMP)
*   **Soft Delete:** `deleted_at` (timestamp, nullable — manual, not @DeleteDateColumn)
*   **Indexes:** None explicit
*   **Business Logic:** Legacy entity from original system. Uses integer PK and `snake_case` columns. Maps to same `courses` table as `Courses` entity — likely used for read-only access to legacy data. No FK relations defined in decorators.

---

### Note on Excluded Entities

*   **`SendMails`** (`src/send-mails/entities/send-mails.entity.ts`): Plain TypeScript class without `@Entity()` decorator — not a database entity. Used as a DTO/interface only.
*   **`courses-forums.entity.ts`** (`src/courses/entities/courses-forums.entity.ts`): Entire file is commented out. Superseded by `Forum` entity in `src/forums/entities/forum.entity.ts`.

---

### Note on `User` entity in auth module

*   **`User` (Auth)** (`src/auth/entities/user.entity.ts`): Duplicate `@Entity('users')` definition that maps to the same `users` table. Contains a subset of the fields from the main `User` entity (`src/users/entities/user.entity.ts`). Includes `@BeforeInsert` and `@BeforeUpdate` password hashing hooks. This is likely used within the auth module context and both entities resolve to the same database table.
