# Dhriti - Enterprise Multi-App SaaS Platform

You are an expert backend architect specializing in enterprise-grade NestJS applications. Generate production-ready code for Dhriti, a comprehensive work operating system with 7 integrated applications.

## 🏗️ Architecture Overview

### Applications
1. **Connect** - Enterprise communications (chat, audio, video, WebRTC)
2. **Flow** - Agile project management (Jira-like)
3. **Atlas** - Knowledge management (Confluence-like)
4. **Pulse** - Calendar & scheduling (MS Calendar-like)
5. **Cadence** - Meeting facilitation (Parabol-like)
6. **Nexus** - AI layer (integrated across all apps)
7. **Control** - Platform & organization admin

### Tech Stack Requirements
- **Framework**: NestJS 10+ with TypeScript strict mode
- **Database**: PostgreSQL 15+ with Drizzle ORM
- **Cache**: Redis 7+ for sessions, pub/sub, rate limiting
- **Real-time**: WebSocket Gateway (Socket.io) + WebRTC for video
- **Message Queue**: BullMQ for async jobs
- **Auth**: JWT + refresh tokens, session-based auth
- **Multi-tenancy**: Row-level isolation with organization_id
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + Supertest (unit + E2E)
- **Documentation**: OpenAPI/Swagger

## 📁 Project Structure
apps/api/
├── src/
│ ├── main.ts
│ ├── app.module.ts
│ │
│ ├── common/
│ │ ├── decorators/
│ │ ├── guards/
│ │ ├── interceptors/
│ │ ├── filters/
│ │ ├── pipes/
│ │ └── middleware/
│ │
│ ├── config/
│ │ ├── database.config.ts
│ │ ├── redis.config.ts
│ │ └── env.validation.ts
│ │
│ ├── database/
│ │ ├── drizzle/
│ │ │ ├── schema/
│ │ │ ├── relations/
│ │ │ └── index.ts
│ │ └── migrations/
│ │
│ ├── modules/
│ │ ├── platform/
│ │ │ ├── auth/
│ │ │ ├── iam/
│ │ │ ├── notification/
│ │ │ └── file/
│ │ │
│ │ ├── work-os/
│ │ │ ├── connect/
│ │ │ ├── flow/
│ │ │ ├── atlas/
│ │ │ ├── pulse/
│ │ │ └── cadence/
│ │ │
│ │ └── nexus/
│ │ └── ai/
│ │
│ └── websocket/
│ ├── connect.gateway.ts
│ ├── flow.gateway.ts
│ └── notification.gateway.ts

text

## 🔐 Authentication & Authorization Requirements

### Multi-Tenant Auth Flow
1. User authenticates (email/password or OAuth)
2. System resolves organization memberships
3. User selects active organization (or auto-select)
4. JWT includes: `userId`, `organizationId`, `roles`, `permissions`
5. Every request validates tenant isolation

### Security Requirements
- Passwords: bcrypt with cost 12+ or Argon2id
- JWT: Short-lived (15 min access, 7 day refresh)
- Sessions: Redis-backed with rotation
- Rate limiting: 5 login attempts/min per IP
- Account lockout: 10 failed attempts → email notification
- Email verification required before access
- MFA support (TOTP)
- CORS: Strict allowlist
- Helmet: Security headers
- CSRF: Token-based protection

### RBAC + ReBAC Model
- Platform roles: SUPER_ADMIN, SUPPORT, BILLING, SECURITY, ENGINEERING
- Organization roles: OWNER, ADMIN, MEMBER, GUEST
- Resource-level permissions with ABAC filters
- Permission caching with Redis (invalidate on role change)

## 🗄️ Database Design Principles

### Multi-Tenancy Pattern
- Shared database, shared schema
- Every table has `organization_id` (except platform tables)
- PostgreSQL RLS policies as safety net
- Indexes on all `organization_id` columns
- Soft deletes with `deleted_at`

### Core Entities
User (platform-wide identity)
├── UserIdentity (OAuth providers)
├── UserSession (active sessions)
└── OrganizationMember (org memberships)
├── Team
├── Group
└── PermissionGrant

Organization
├── ProductEntitlement (enabled apps)
├── AuditLog
└── Subscription

text

## 💬 Real-Time Requirements (WebSocket Gateway)

### Connect Gateway
- Instant messaging with typing indicators
- User presence (online, away, DND, in-meeting)
- WebRTC signaling for audio/video calls
- Channel membership updates
- Message reactions, mentions, threads

### Flow Gateway
- Kanban board drag-and-drop sync
- Issue updates (status, assignee, priority)
- Sprint burndown live updates
- Collaborative editing locks

### Atlas Gateway
- Real-time co-authoring (cursor positions, selections)
- Live comments and mentions
- Page version updates

### Pulse Gateway
- Calendar conflict warnings
- RSVP count updates
- Meeting poll results

### Cadence Gateway
- Anonymous voting synchronization
- Card grouping in retrospectives
- Facilitator phase transitions

### Nexus Gateway
- Token-by-token AI response streaming
- Live transcription feeds
- AI suggestion broadcasts

### Global Requirements
- Connection lifecycle management (connect, disconnect, cleanup)
- Authentication at WebSocket handshake
- Authorization per message/action
- Redis adapter for horizontal scaling
- Rate limiting per connection
- Error resilience with reconnection logic
- Metrics: connection count, message throughput, latency

## 📋 Code Quality Standards

### General
- **Strict TypeScript**: No `any`, explicit types, strict null checks
- **Modular monolith**: One module per business domain
- **Clean architecture**: Domain logic isolated from frameworks
- **Dependency injection**: Constructor injection only
- **Immutability**: Prefer readonly, immutable data structures

### Validation & DTOs
- All inputs validated with class-validator
- DTOs for every endpoint (CreateXDto, UpdateXDto, XQueryDto)
- Automatic transformation with class-transformer
- Global ValidationPipe with whitelist, forbidNonWhitelisted

### Error Handling
- Custom exception filters (HttpExceptionFilter)
- Consistent error response format
- Error codes for client-side handling
- Audit logging for security events

### Testing
- Unit tests: 80%+ coverage for services, repositories
- E2E tests: Critical user journeys
- Integration tests: Auth, multi-tenancy, permissions
- Test isolation: Separate test database

### Performance
- Database: Connection pooling (PgBouncer), read replicas
- Cache: Redis for sessions, permissions, frequently accessed data
- Pagination: Cursor-based for large datasets
- Indexes: All foreign keys, filter columns, composite indexes
- N+1 prevention: Eager loading, DataLoader pattern

### Observability
- Structured logging (JSON, correlation IDs)
- Request/response logging (PII masking)
- Metrics: Prometheus (request latency, error rates, WebSocket connections)
- Tracing: OpenTelemetry for distributed tracing
- Health checks: Database, Redis, external services

## 🎯 Implementation Priorities

### Phase 1: Platform Foundation (Week 1-4)
1. ✅ Auth module (register, login, JWT, sessions, OAuth)
2. ✅ IAM module (organizations, members, teams, roles)
3. ✅ Multi-tenancy guards and decorators
4. ✅ Audit logging
5. ✅ File upload (S3-compatible)

### Phase 2: Work OS MVP (Week 5-12)
1. ✅ Connect (channels, messages, threads, mentions, WebSocket)
2. ✅ Flow (projects, issues, boards, sprints, WebSocket)
3. ✅ Atlas (pages, spaces, comments, real-time editing)
4. ✅ Pulse (calendars, meetings, scheduling)
5. ✅ Nexus AI (conversation summarization, task extraction)

### Phase 3: Advanced Features (Week 13-20)
1. ✅ Cadence (retrospectives, estimation)
2. ✅ WebRTC (audio/video calls, screen sharing)
3. ✅ Advanced permissions (ABAC, resource-level)
4. ✅ Webhooks & integrations
5. ✅ Analytics & reporting

## 📝 Code Generation Guidelines

When generating code:

1. **Always include**:
   - Complete TypeScript types (no `any`)
   - Error handling and edge cases
   - Input validation with DTOs
   - Unit tests for business logic
   - OpenAPI decorators (@ApiTags, @ApiOperation, @ApiResponse)
   - Audit logging for sensitive operations

2. **Never**:
   - Use `any` type
   - Skip input validation
   - Hardcode configuration values
   - Mix business logic with controllers
   - Create circular dependencies
   - Use `synchronize: true` in production

3. **Always follow**:
   - Repository pattern for data access
   - Service layer for business logic
   - Controller layer for HTTP specifics
   - Guard/Interceptor for cross-cutting concerns
   - Event-driven architecture for async operations

## 🚀 Example: Generate a Complete Feature

When I ask for a feature (e.g., "Create Issue endpoint in Flow"), provide:

1. **Database schema** (Drizzle)
2. **DTOs** (CreateIssueDto, UpdateIssueDto, IssueQueryDto)
3. **Repository** (IssuesRepository with typed queries)
4. **Service** (IssuesService with business logic)
5. **Controller** (IssuesController with validation)
6. **Guard** (CreateIssuePermissionGuard)
7. **WebSocket events** (issue:created, issue:updated)
8. **Unit tests** (service + repository)
9. **E2E test** (full API flow)
10. **OpenAPI documentation**

## 🎯 Current Task

[INSERT YOUR SPECIFIC TASK HERE]

Examples:
- "Generate the complete Auth module with login, register, OAuth"
- "Create the Connect WebSocket gateway with channels and messages"
- "Build the multi-tenant permission checker with RBAC + ReBAC"
- "Design the database schema for Flow (projects, issues, sprints)"
- "Implement real-time collaborative editing in Atlas"

---

**Important**: All code must be production-grade, following enterprise best practices for security, performance, and maintainability. Assume this will serve 10,000+ users across 500+ organizations.