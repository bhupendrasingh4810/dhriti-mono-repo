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
- **Database**: PostgreSQL 15+ with TypeORM
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
│ │ ├── typeORM/
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

1. **Database schema** (TypeORM)
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

<!-- [INSERT YOUR SPECIFIC TASK HERE] -->

Auth Module
text

## 🎯 Current Task

Generate the complete Auth module with:

- User registration (email, password, name) with email verification
- Login with JWT access tokens (15 min) + refresh tokens (7 days)
- Session management with Redis (store, rotate, invalidate)
- OAuth integration (Google, GitHub)
- Password reset flow (request, token validation, update)
- MFA (TOTP) setup, verification, and recovery codes
- Email verification endpoint and token validation
- Account lockout after 10 failed attempts
- Logout (single session + all sessions)
- Get current user profile endpoint
- Update profile (name, avatar, timezone, locale)
- Change password with validation
- All with production-grade error handling, validation, and unit tests
  IAM Module
  text

## 🎯 Current Task

Generate the complete IAM module with:

- Organization CRUD (create, read, update, soft delete)
- OrganizationMember management (invite, accept, remove, suspend)
- Team CRUD with members (add, remove, transfer ownership)
- Group CRUD (manual and dynamic groups with filter rules)
- ProductEntitlement management (enable/disable apps per org)
- Invitation system (create, accept, reject, expire, cancel)
- PermissionGrant system (assign permissions to members/groups)
- Organization settings (domain, branding, preferences)
- Member directory with search and filters
- Bulk member operations (import CSV, bulk role changes)
- Audit logging for all IAM operations
- All with multi-tenancy guards and production-grade tests
  Multi-Tenancy & Security
  text

## 🎯 Current Task

Generate the multi-tenancy and security infrastructure:

- TenantGuard (extract and validate organization_id from JWT)
- OrganizationGuard (verify user is member of org)
- PermissionGuard (check specific permission before action)
- EntitlementGuard (verify org has access to specific app)
- @Tenant() decorator (inject organization context)
- @Organization() decorator (inject organization entity)
- @Permissions() decorator (check permission at method level)
- PermissionChecker service with RBAC + ReBAC logic
- Permission caching with Redis (invalidate on changes)
- RLS policies for PostgreSQL (safety net for multi-tenancy)
- Database middleware to inject organization_id into all queries
- Security headers (Helmet) and CORS configuration
- Rate limiting (global + per-endpoint with Redis)
- CSRF protection with double-submit cookie pattern
- All with comprehensive unit and E2E tests
  Audit & Logging
  text

## 🎯 Current Task

Generate the audit logging and observability system:

- AuditLog entity with organization context
- AuditService (log, query, export)
- @AuditLog() decorator (automatic logging for decorated methods)
- AuditLogController (query logs with filters, export CSV)
- Request logging middleware (correlation IDs, timing, PII masking)
- Error logging filter (structured JSON, stack traces)
- Health check endpoints (database, Redis, external services)
- Metrics collection (Prometheus format: request latency, error rates)
- OpenTelemetry tracing setup (distributed traces across modules)
- Log aggregation configuration (Winston + Elasticsearch)
- All with production-grade error handling and tests
  File & Storage
  text

## 🎯 Current Task

Generate the file upload and storage system:

- File entity (metadata, owner, organization, size, type)
- FileUploadService (S3-compatible storage with presigned URLs)
- FileUploadController (upload, download, delete, list)
- Presigned URL generation (upload, download with expiry)
- File type validation (images, documents, videos)
- File size limits (configurable per org entitlement)
- Virus scanning integration (ClamAV or cloud service)
- Image processing (thumbnails, resizing with sharp)
- CDN integration (CloudFront or Cloudflare)
- File access control (organization-scoped, permission-based)
- Storage quota enforcement (per org, per user)
- All with production-grade error handling and tests

Phase 2: Work OS MVP (Week 5-12)
Connect Module
text

## 🎯 Current Task

Generate the Connect WebSocket gateway and REST API:

- Channel entity (public, private, direct, archived)
- Channel CRUD (create, update, archive, delete)
- Channel membership (join, leave, invite members)
- Message entity (text, file, system, thread reply)
- Message CRUD (send, edit, delete, reactions, mentions)
- Thread conversations (parent message, nested replies)
- @Mention detection and notification generation
- File attachments in messages (upload, preview, download)
- Message search with full-text search (PostgreSQL tsvector)
- Channel search and filtering
- WebSocket events: message:created, message:updated, message:deleted
- WebSocket events: typing:start, typing:stop
- WebSocket events: presence:update (online, away, DND)
- WebSocket events: reaction:added, reaction:removed
- Presence service (track user status across org)
- Unread message counters per channel
- Last read message tracking per user-channel
- Pinned messages per channel
- Channel notifications settings (all, mentions, none)
- All with production-grade error handling, validation, and tests
  Connect - Audio/Video (WebRTC)
  text

## 🎯 Current Task

Generate the Connect WebRTC signaling and call management:

- Call entity (type, participants, status, recording)
- Signaling server (offer, answer, ICE candidates via WebSocket)
- Call initiation (1:1, group calls)
- Call acceptance/rejection flow
- In-call controls (mute, camera on/off, screen share)
- Participant management (add, remove, kick)
- Call recording start/stop (integrate with recording service)
- Live transcription stream during calls
- Call quality metrics (latency, jitter, packet loss)
- Call history and logs
- Voicemail (if enabled)
- WebSocket events: call:incoming, call:accepted, call:rejected, call:ended
- WebSocket events: participant:joined, participant:left, participant:muted
- All with production-grade error handling and tests
  Flow Module
  text

## 🎯 Current Task

Generate the Flow project management module:

- Project entity (key, name, description, lead, avatar)
- Project CRUD (create, update, archive, delete)
- Project membership and roles
- Issue entity (type, status, priority, assignee, reporter, sprint, epic)
- Issue CRUD (create, update, transition, delete)
- Issue types (task, bug, story, epic, subtask)
- Custom workflows (states, transitions, validators, post-functions)
- Custom fields (text, number, date, user, select, multi-select)
- Sprint entity (name, goal, dates, status)
- Sprint CRUD (create, start, complete, cancel)
- Board configuration (columns, swimlanes, quick filters)
- Backlog management (rank, estimate, plan to sprint)
- Epic entity and roadmap view
- Version/Release entity and release tracking
- Component entity and component lead
- Issue links (blocks, relates to, duplicates, clones)
- Work logs (time tracking, estimates)
- Comments with rich text and mentions
- Attachments on issues
- Labels and filtering
- JQL-like query language parser
- Bulk operations (edit, transition, delete)
- Issue templates
- All with production-grade error handling and tests
  Flow - Boards & Sprints
  text

## 🎯 Current Task

Generate the Flow boards and sprints WebSocket integration:

- Kanban board real-time updates (drag-and-drop sync)
- Scrum board with sprint selection
- Board configuration WebSocket events
- Issue card movement synchronization
- Column WIP limits enforcement
- Quick filters (assignee, label, my issues)
- Swimlane configuration (by assignee, epic, priority)
- Sprint burndown chart data (real-time updates)
- Velocity chart calculation
- Sprint goal updates
- Sprint start/complete notifications
- Board permissions (view, edit, configure)
- WebSocket events: issue:moved, issue:updated, sprint:started, sprint:completed
- All with production-grade error handling and tests
  Flow - Automation
  text

## 🎯 Current Task

Generate the Flow no-code automation engine:

- Automation rule entity (trigger, conditions, actions)
- Trigger types (issue created, updated, transitioned, commented)
- Condition builder (field comparisons, status checks)
- Action types (transition issue, assign, comment, notify, create subtask)
- Rule execution engine (synchronous and async)
- Automation audit logs (rule fired, actions taken)
- Rule templates (common patterns)
- Rule testing interface (dry run)
- Automation metrics (rules fired, time saved)
- All with production-grade error handling and tests
  Atlas Module
  text

## 🎯 Current Task

Generate the Atlas knowledge management module:

- Space entity (name, key, description, permissions)
- Space CRUD (create, update, archive, delete)
- Page entity (title, content, parent, version, status)
- Page CRUD (create, update, publish, archive, delete)
- Page hierarchy (parent-child, tree structure)
- Rich text editor content storage (ProseMirror or TipTap format)
- Real-time collaborative editing (Yjs or similar CRDT)
- Page comments (inline, page-level, threads)
- Page mentions and notifications
- Page attachments and embeds
- Page templates library
- Page history and version comparison
- Page restoration from version
- Labels and content categorization
- Content restrictions (view, edit permissions per page)
- Full-text search across spaces and pages
- Recently viewed pages tracking
- Watchlist (page notifications)
- Blog posts (announcements, company news)
- Macros (Jira issues, tables, status, code blocks)
- Smart links (auto-embed external URLs)
- All with production-grade error handling and tests
  Atlas - Real-Time Collaboration
  text

## 🎯 Current Task

Generate the Atlas real-time collaborative editing:

- WebSocket gateway for collaborative editing
- Yjs integration for CRDT-based sync
- Cursor position broadcasting
- Selection highlighting for collaborators
- User presence in document (who's viewing/editing)
- Edit conflict resolution
- Autosave with debounce
- Version snapshots on significant changes
- Comment threads on selections
- Suggestion mode (track changes)
- Real-time mention notifications
- WebSocket events: page:editing, page:saved, comment:added
- All with production-grade error handling and tests
  Pulse Module
  text

## 🎯 Current Task

Generate the Pulse calendar and scheduling module:

- Calendar entity (personal, team, company, resource)
- Calendar CRUD and sharing settings
- Event entity (title, description, start, end, timezone, recurrence)
- Event CRUD (create, update, cancel, delete)
- Recurring events (RRULE parsing and expansion)
- Event attendees (RSVP: yes, no, maybe)
- Event reminders and notifications
- Room and resource booking
- Resource entity (rooms, equipment, vehicles)
- Resource availability and booking conflicts
- Scheduling assistant (find optimal time slots)
- FindTime polls (propose times, collect votes, auto-book)
- Calendar overlays (multiple calendars in one view)
- Time blocking and categories
- Out-of-office settings
- Working hours configuration
- Holiday calendars (company, country-specific)
- External calendar sync (Google, Outlook, iCal)
- Meeting links (auto-generate Connect meeting URLs)
- Event attachments and agenda
- All with production-grade error handling and tests
  Pulse - Real-Time Features
  text

## 🎯 Current Task

Generate the Pulse real-time features:

- WebSocket gateway for calendar updates
- Real-time booking conflict warnings
- RSVP count updates
- Meeting poll results synchronization
- Calendar event changes broadcast
- Resource availability updates
- Scheduling assistant live availability
- WebSocket events: event:created, event:updated, event:deleted, rsvp:updated
- All with production-grade error handling and tests
  Cadence Module
  text

## 🎯 Current Task

Generate the Cadence meeting facilitation module:

- Retrospective entity (type, status, facilitator, participants)
- Retrospective templates (Start-Stop-Continue, 4Ls, Sailboat)
- Multi-phase facilitation flow (Reflect, Group, Vote, Discuss, Action Items)
- Anonymous card/note creation
- Card grouping (drag-and-drop clustering)
- Dot voting (anonymous or attributed)
- Vote tallying and prioritization
- Discussion threads per group
- Action item creation with assignees and due dates
- Export to Flow (create issues from action items)
- Icebreaker engine (random questions, emoji check-ins)
- Sprint poker estimation (anonymous voting)
- Consensus detection (highlight divergent votes)
- Facilitator controls (advance phase, skip, extend time)
- Meeting recording and transcript
- Retrospective history and trends
- All with production-grade error handling and tests
  Cadence - Real-Time Features
  text

## 🎯 Current Task

Generate the Cadence real-time facilitation:

- WebSocket gateway for retrospective synchronization
- Anonymous card creation and broadcasting
- Real-time card grouping (multi-user drag-and-drop)
- Vote synchronization (live tally updates)
- Phase transition broadcasting (all users advance together)
- Facilitator control overrides
- Timer synchronization across participants
- WebSocket events: card:added, card:grouped, vote:cast, phase:changed
- All with production-grade error handling and tests

Phase 3: Advanced Features (Week 13-20)
Nexus AI Module
text

## 🎯 Current Task

Generate the Nexus AI integration module:

- AIConversation entity (context, messages, metadata)
- Conversation summarization (Connect channels, threads)
- Task extraction from conversations (create Flow issues)
- Decision extraction (create Decision records)
- Action item extraction (assign, due dates)
- Documentation generation from discussions (create Atlas pages)
- Meeting transcription and summarization
- Smart search across all apps (semantic search)
- AI chat interface (ask anything about work graph)
- Token-by-token streaming responses (WebSocket)
- Context-aware suggestions (related docs, people, tasks)
- Sentiment analysis on messages and comments
- Automated tagging and categorization
- Duplicate detection (similar issues, docs)
- AI-powered meeting agenda generation
- Retrospective insights and patterns
- Code review assistance (integrate with GitHub/GitLab)
- All with production-grade error handling, rate limiting, and tests
  Nexus - AI Streaming
  text

## 🎯 Current Task

Generate the Nexus AI streaming WebSocket gateway:

- Token-by-token response streaming
- Live transcription feeds during meetings
- Real-time AI suggestions during conversations
- Streaming error handling (partial responses, retries)
- Conversation context management
- Rate limiting per user/org
- Cost tracking (token usage, API costs)
- Fallback to cached responses
- WebSocket events: ai:token, ai:complete, ai:error
- All with production-grade error handling and tests
  Control Module - Platform Admin
  text

## 🎯 Current Task

Generate the Control platform administration module:

- Platform dashboard (total orgs, users, revenue, health)
- Organization management (view, suspend, reactivate, delete)
- Platform user management (internal staff)
- Product catalog (enable/disable products, pricing)
- Plan and pricing management
- Subscription management (upgrade, downgrade, cancel)
- Usage tracking and limits (API calls, storage, seats)
- Feature flags (per org, per product, per user)
- Support center (tickets, notes, escalations)
- Security center (alerts, incidents, MFA adoption)
- Platform audit logs (cross-org admin actions)
- System health monitoring (uptime, latency, errors)
- Platform settings (global config, rate limits, maintenance mode)
- All with production-grade error handling and tests
  Control Module - Organization Admin
  text

## 🎯 Current Task

Generate the Control organization administration module:

- Organization dashboard (users, products, usage, costs)
- Organization profile (name, domain, branding, settings)
- People management (add, remove, suspend, role changes)
- User detail view (activity, permissions, sessions)
- Invitation management (pending, accepted, expired)
- Team management (create, edit, members, permissions)
- Group management (manual, dynamic, rules)
- Roles and permissions (custom roles, permission matrix)
- Application access (enable/disable apps per org)
- Subscription and billing (plan, seats, payment methods, invoices)
- Security settings (MFA enforcement, SSO, password policies)
- Authentication settings (SAML, OIDC, SCIM provisioning)
- Audit logs (org-level actions, exports)
- Integrations (OAuth apps, webhooks, API keys)
- Data retention policies (auto-archive, deletion schedules)
- Organization settings (timezone, locale, preferences)
- All with production-grade error handling and tests
  Notifications Module
  text

## 🎯 Current Task

Generate the unified notifications module:

- Notification entity (type, title, message, link, metadata)
- Notification preferences (per type, per channel, per org)
- In-app notification center (list, mark read, mark all read)
- Email notifications (templates, batching, digest)
- Push notifications (web push, mobile push)
- Slack/Teams integration (forward notifications)
- Notification channels (in-app, email, push, SMS)
- Smart notifications (frequency capping, quiet hours)
- @Mention notifications (Connect, Atlas, Flow)
- Assignment notifications (Flow issues, action items)
- Due date reminders
- Meeting reminders (Pulse events)
- Real-time notification updates (WebSocket)
- Notification analytics (open rates, engagement)
- All with production-grade error handling and tests
  Search Module
  text

## 🎯 Current Task

Generate the unified search module:

- SearchIndex entity (entity type, entity id, content, metadata)
- Indexing service (messages, issues, pages, decisions, users)
- Full-text search with PostgreSQL tsvector/tsquery
- Search ranking (relevance, recency, popularity)
- Faceted search (filters by type, org, date, author)
- Search suggestions (autocomplete, recent searches)
- Search history tracking
- Semantic search (embeddings, vector similarity)
- Cross-app search (Connect, Flow, Atlas, Pulse, Cadence)
- Search analytics (popular queries, zero results)
- Search permissions (only show results user can access)
- All with production-grade error handling and tests
  Integrations Module
  text

## 🎯 Current Task

Generate the integrations and webhooks module:

- Integration entity (type, config, status)
- OAuth app management (register, credentials, scopes)
- Webhook entity (URL, events, secret, status)
- Webhook delivery system (retry logic, exponential backoff)
- Webhook signature verification (HMAC)
- Event catalog (all subscribable events)
- Webhook logs (delivery attempts, responses)
- API key management (create, revoke, permissions)
- Rate limiting per API key
- Integration templates (GitHub, GitLab, Slack, Jira)
- Zapier/Make integration
- Public API documentation (OpenAPI/Swagger)
- SDK generation (TypeScript, Python, Go)
- All with production-grade error handling and tests
  Analytics Module
  text

## 🎯 Current Task

Generate the analytics and reporting module:

- Workspace utilization dashboards (adoption rates per app)
- Activity analytics (messages sent, issues created, docs edited)
- User engagement metrics (DAU, WAU, MAU)
- Team performance metrics (velocity, cycle time, throughput)
- Custom report builder (drag-and-drop metrics)
- Scheduled reports (email, Slack)
- Export to CSV, PDF
- Real-time dashboards (WebSocket updates)
- Cohort analysis (retention, churn)
- Funnel analysis (signup → activation → conversion)
- All with production-grade error handling and tests

Infrastructure & DevOps
Database Migrations
text

## 🎯 Current Task

Generate the complete database migration set:

- Auth module migrations (users, identities, sessions, roles)
- IAM module migrations (orgs, members, teams, groups, permissions)
- Connect module migrations (channels, messages, threads, reactions)
- Flow module migrations (projects, issues, sprints, epics, boards)
- Atlas module migrations (spaces, pages, comments, attachments)
- Pulse module migrations (calendars, events, attendees, resources)
- Cadence module migrations (retrospectives, cards, votes, actions)
- Nexus module migrations (conversations, AI processing, search index)
- Control module migrations (audit logs, notifications, integrations)
- All indexes, foreign keys, and constraints
- Seed data for development and testing
- Migration rollback scripts
- All with production-grade error handling and tests
  Testing Infrastructure
  text

## 🎯 Current Task

Generate the testing infrastructure:

- Jest configuration (unit, integration, E2E)
- Test database setup and teardown
- Test utilities (factory functions, fixtures, mocks)
- Auth test helpers (create user, login, get JWT)
- Multi-tenancy test helpers (create org, switch context)
- WebSocket test helpers (connect, send, receive)
- E2E test suite for critical user journeys
- Integration tests for all modules
- Performance tests (load testing with k6)
- Security tests (OWASP Top 10 scenarios)
- All with comprehensive coverage and documentation
  CI/CD Pipeline
  text

## 🎯 Current Task

Generate the CI/CD pipeline configuration:

- GitHub Actions workflow (lint, test, build, deploy)
- Dockerfile for API (multi-stage, optimized)
- Docker Compose for local development (API, DB, Redis)
- Kubernetes manifests (deployment, service, ingress)
- Helm chart for production deployment
- Database migration automation (pre-deploy hook)
- Blue-green deployment strategy
- Rollback procedures
- Environment promotion (dev → staging → prod)
- Secrets management (GitHub Secrets, AWS Secrets Manager)
- All with production-grade best practices

<!--  -->

Examples:

- "Generate the complete Auth module with login, register, OAuth"
- "Create the Connect WebSocket gateway with channels and messages"
- "Build the multi-tenant permission checker with RBAC + ReBAC"
- "Design the database schema for Flow (projects, issues, sprints)"
- "Implement real-time collaborative editing in Atlas"

---

**Important**: All code must be production-grade, following enterprise best practices for security, performance, and maintainability. Assume this will serve 10,000+ users across 500+ organizations.
