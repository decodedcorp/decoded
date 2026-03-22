# Decoded App Constitution

## Core Principles

### I. Spec-Driven Development

Every feature starts with a specification in `specs/feature/`, `specs/bugfix/`, or `specs/experiment/`. Specifications must include:

- Clear problem statement and user story
- Functional and non-functional requirements
- Acceptance criteria
- Non-goals (explicitly out-of-scope items)

### II. Yarn Berry PnP (Plug'n'Play)

- Use Yarn Berry (v4.9.2+) with Plug'n'Play (PnP) mode for package management
- Zero-Install enabled: dependencies are version-controlled via `.pnp.cjs` and `.yarn/cache/`
- No `node_modules` directory - dependencies resolved via PnP resolution
- Faster installs, better dependency validation, and guaranteed correctness

### III. Type Safety First

- TypeScript 5.9.2 is mandatory for all new code
- Strict type checking enabled (`tsc --noEmit`)
- Generated API types from OpenAPI spec via `yarn typegen:dev`
- Type-safe data fetching with React Query and generated types

### IV. Component Architecture

- Domain-driven structure: `src/domains/` for feature modules
- Shared components in `src/shared/` and `packages/ui/`
- Single responsibility: components max 100 lines
- Props limit: max 5 props per component (use composition)

### V. Testing Standards

- Playwright 1.55.0 for E2E testing
- Test-first approach for critical paths
- Integration tests for API contracts and inter-service communication
- Manual testing required for user-facing features (3 users, 2+ positive feedback)

## Technology Stack

### Frontend Framework

- **Next.js 15.4.1** - App Router with React Server Components
- **React 19.1.0** - Latest React features
- **TypeScript 5.9.2** - Type safety

### Styling

- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Custom Design System v3** - Role-based design tokens
- Semantic color naming (`text-primary`, `bg-primary`, etc.)
- Dark/Light theme support required

### State Management

- **Zustand 5.0.6** - Client-side state (domain stores)
- **React Query 5.83.0** - Server state and data fetching
- Store slice isolation by domain

### Build & Package Management

- **Yarn 4.9.2** - Package manager with PnP
- **Zero-Install** - Dependencies in Git (`.pnp.cjs`, `.yarn/cache/`)
- No `node_modules` directory
- Faster CI/CD (60-90 seconds saved per build)

### Testing

- **Playwright 1.55.0** - E2E testing framework
- Test files in `__tests__/e2e/` and `tests/`

### Deployment

- **Vercel** - Hosting platform
- Automatic deployments from main branch
- Preview deployments for PRs

## Development Workflow

### Package Management

- Always use `yarn` commands (never `npm`)
- Dependencies are automatically resolved via PnP
- For CLI tools: use `yarn dlx` instead of `npx`
- Zero-Install: no `yarn install` needed after clone (dependencies in Git)

### Code Quality

- ESLint for code quality checks
- Pre-commit hooks via Husky
- Type checking before commit
- i18n validation before commit

### Spec-Driven Workflow

1. Create spec in `specs/feature/FEATURE-*.yml`
2. Use `/speckit.plan` to create implementation plan
3. Use `/speckit.tasks` to generate actionable tasks
4. Implement with Cursor/Codex following spec
5. Document decisions in `docs/adr/`

### AI Development Tools

- **Cursor** - Primary coding environment with spec-workflow rules
- **Codex CLI** - Terminal-based refactoring (via `scripts/run-spec-workflow.sh`)
- **SpecKit** - Spec-driven development commands (`/speckit.*`)
- **Claude** - Architecture review
- **GPT** - Documentation and research

## Performance Standards

### Core Web Vitals

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS < 0.1

### Code Performance

- React.memo for expensive components
- useCallback for event handlers in props
- Lazy loading for routes and heavy components
- Image optimization with `next/image`

### Mobile Optimization

- Dynamic viewport units (`dvh`, `svh`, `lvh`)
- Minimum 44px touch targets
- Safe area insets support
- Passive scroll listeners

## Governance

- Constitution supersedes all other development practices
- Amendments require ADR documentation
- All PRs must verify compliance with constitution
- Complexity must be justified
- Use `docs/ai-playbook/ai-usage-guide.md` for AI tool guidance

**Version**: 1.0.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
