# P-Wallet Portal Service Architecture

This document defines the strict architectural boundaries for the `portal-service` application. This architecture is specifically designed to be **Microservices-Ready**, allowing easy extraction of role-based APIs in the future.

## Core Philosophy: Role-Based vs. Domain Logic

The application strictly separates **"How requests are received" (Routing/Role Layer)** from **"How the system processes data" (Domain/Business Logic Layer)**.

### 1. The Routing Layer (Access Roles)

These directories represent the entry points into the system based on the actor's role. If `portal-service` is split into microservices, each of these folders becomes the `src/` of a new project.

- `src/admin/`: API endpoints exclusively for back-office staff.
- `src/user/`: API endpoints exclusively for the consumer mobile application (Wallet App).
- `src/terminal/`: API endpoints exclusively for Merchant POS devices.

**Strict Rules for the Routing Layer:**
- **ALLOWED**: Controllers (`@Controller`), Guards (`@Injectable` implementing `CanActivate`), Interceptors (`@Injectable` implementing `NestInterceptor`), Strategies (e.g., Passport), and Custom Decorators.
- **FORBIDDEN**: Business Logic Services (`*service.ts` with DB access or complex logic), Repositories, or Domain DTOs.
- *Never inject PrismaService directly into a Controller.*

### 2. The Domain Layer (Pure Modules)

The `src/modules/` directory contains the core business capabilities of the platform (e.g., `identity`, `finance`, `merchant`). 

**Strict Rules for the Domain Layer (Pure Modules):**
- **ALLOWED**: Services (`@Injectable`), local response/request DTO classes (for validation/serialization), Utilities, and internal interfaces.
- **FORBIDDEN**: Role-based Controllers (e.g., `MerchantController`, `AdminUserController`). 
- **EXCEPTION**: Internal system controllers (like Webhooks from Stripe) are allowed here because they are not bound to a specific user role, but rather to the system itself.
- A Domain Module must be importable by *any* routing module (`AdminModule`, `UserModule`, `TerminalModule`) without pulling in unwanted HTTP routes.

### 3. Global Infrastructure & Tooling

The remaining directories at the root of `src/` are reserved for system-wide configuration, shared utilities, and operational tools. **These folders must be completely agnostic of any specific business domain.**

- `src/core/`: Foundational infrastructure modules that power the entire application (e.g., `PrismaService`, `RedisService`, global Health checks, Cloud Storage wrappers). These are typically global modules.
- `src/common/`: Application-wide shared code that doesn't fit into a specific domain module. This includes global Exception Filters, generic Interceptors, and utility functions (e.g., `log-masking.util.ts`).
- `src/cli/` & `src/scripts/`: Command-Line Interfaces, background jobs, and operational scripts (e.g., database seeding, one-off data migrations).
- `src/__tests__/`: Integration and end-to-end (E2E) testing suites. (Unit tests should remain co-located with their respective files).

### 4. The Shared Contract Layer (External)

- All cross-service data definitions, Enums, and base Interfaces must reside in the monorepo package `@repo/dto`.
- Backend modules should implement (`implements`) these interfaces using `class` structures to apply `class-validator` and `class-transformer` decorators for security (e.g., `@Exclude()` for passwords).

## How to Develop a New Feature

1. **Define the Contract**: Add the required interfaces or enums to `@repo/dto`.
2. **Build the Logic**: Create or update a service inside `src/modules/<feature-name>/`. Create local class-based DTOs here if validation/serialization is needed.
3. **Expose the API**: Create a controller in the appropriate routing layer (`src/user/`, `src/admin/`, or `src/terminal/`).
4. **Wire it up**: Import the feature module into the specific role's module (e.g., `UserModule`) and register the controller there.

> **AI Instruction Override**: If you are an AI assistant generating code for this project, you MUST read and adhere to these boundaries. Do not place Controllers inside `src/modules/` and do not place Services inside `src/admin/` or `src/user/`.
