# Gemini CLI Instructions for `portal-service`

## Architectural Mandates
This application uses a strict **Microservices-Ready Role-Based Architecture**. 

Before generating any code, creating any files, or refactoring existing logic within `j-ledger-portal/apps/portal-service`, you **MUST** read and strictly adhere to the rules defined in:
`./ARCHITECTURE.md`

**Critical Reminders:**
1. **Never** place a `@Controller` inside `src/modules/` (except for internal system webhooks).
2. **Never** place a `@Injectable` Service that handles business logic or database access inside `src/admin/`, `src/user/`, or `src/terminal/`.
3. If asked to add a new feature, you must separate the Controller (routing) from the Service (logic) into their respective architectural layers as defined in the documentation.
