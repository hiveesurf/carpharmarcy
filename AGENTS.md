# AGENTS.md — CARNALYSYS (car_rent)

Guidance for AI agents and contributors working in this repository.

## Stack

| Area | Technology |
|------|------------|
| API | Java **17**, Spring Boot **3.4.x**, Spring Web, Spring Data **JPA**, Spring Security, Flyway, PostgreSQL (typical) |
| Web | React **19**, Vite, React Router, Tailwind-style tokens in `src/index.css` |
| Layout | Monorepo: `backend/` (Maven, `com.carnalysys`), `src/` (Vite frontend), `public/` |

## Backend layout (`backend/src/main/java/com/carnalysys/`)

- `domain/` — JPA entities
- `repo/` — Spring Data repositories
- `service/` — business logic, transactions
- `web/v1/` — REST controllers (`/api/v1/...`)
- `web/dto/`, `web/support/` — request/response helpers
- `security/` — auth, admin session, JWT/cookies as configured
- `config/` — Spring configuration
- `api/` — shared API types (e.g. envelopes, exceptions)

Prefer **constructor injection**, **transaction boundaries on services**, and **controllers stay thin** (delegate to services). Reuse existing patterns: `ApiEnvelope`, `ApiResponses`, `ApiException`.

## Frontend layout

- `src/api/` — `apiV1Base()`, low-level HTTP
- `src/services/` — feature API wrappers
- `src/pages/`, `src/components/`, `src/admin/` — UI
- When `VITE_API_BASE` is unset in dev, Vite proxies `/api/v1` to the backend (see `vite.config` if present)

## Commands

```bash
# Backend
cd backend && ./mvnw -q compile
cd backend && ./mvnw test

# Frontend
npm install
npm run build
npm run dev
```

## Git & scope

- Prefer focused commits; do not commit secrets or local `.env` with real credentials.
- Do not edit generated vendor rule files under `.cursor/rules/` that are **symlinks** to `cursor-rules-java` — change them in that upstream repo and re-run the link script, or edit only project-native `.mdc` files (`carnalysys-*.mdc`).

## Cursor rules (Java pack from `cursor-rules-java`)

This project can **reuse** the rule collection from [cursor-rules-java](https://github.com/jabrena/cursor-rules-java) (local clone: e.g. `~/Downloads/cursor-rules-java-main`).

1. **One-time link** (creates symlinks into `.cursor/rules/`):

   ```bash
   ./scripts/link-cursor-java-rules.sh
   ```

   Override source directory:

   ```bash
   export CURSOR_JAVA_RULES_SRC="$HOME/path/to/cursor-rules-java-main/.cursor/rules"
   ./scripts/link-cursor-java-rules.sh
   ```

2. **How it works in Cursor**
   - Files in **`.cursor/rules/`** are **project rules**: Cursor merges them into context when they match (by glob) or when `alwaysApply` is true.
   - **Project-native** rules (`carnalysys-stack.mdc`, `carnalysys-backend-java.mdc`) always describe *this* repo’s architecture.
   - **Linked** rules (`301-*.mdc`, `302-*.mdc`, …) add deep Spring Boot / Maven / ADR / testing checklists. Reference them in chat with **@** and the filename, e.g. `@301-frameworks-spring-boot-core.mdc`, when you want a full review.
   - Rules from the Java pack target Spring Boot **4.x** in places; this app uses **3.4.x** — treat “virtual threads / Boot 4 only” items as optional unless you upgrade.

3. **Regenerating rules in the Java pack repo** (only if you maintain that clone)

   ```bash
   cd ~/Downloads/cursor-rules-java-main
   ./mvnw clean install -pl system-prompts-generator
   ```

   Then re-run `./scripts/link-cursor-java-rules.sh` in this repo.

## Boundaries

- ✅ Edit application code under `backend/src`, `src/`, migrations under `backend/src/main/resources/db/migration`.
- ⚠️ Ask before large dependency or Spring Security model changes.
- 🚫 Do not commit symlink targets from another machine; teammates run `link-cursor-java-rules.sh` with their own `CURSOR_JAVA_RULES_SRC` if the default path does not exist.
