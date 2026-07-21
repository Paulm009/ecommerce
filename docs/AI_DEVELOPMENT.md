# Development with GitHub Copilot

## Strategy

Context is split so Copilot receives only what is needed:

- `.github/copilot-instructions.md`: permanent, brief conventions.
- `.github/instructions/`: file-activated rules.
- `.github/skills/`: specialized procedures loaded on demand.
- `.github/agents/`: roles with limited tools.
- `.github/prompts/`: manual commands for frequent flows.
- Laravel Boost MCP: Laravel documentation and inspection based on installed packages.
- shadcn MCP: search and incorporate components compatible with `components.json`.

## Agents

### Architect

Analyzes a requirement, identifies boundaries, and proposes the implementation without
modifying files.

Use it when the requirement spans multiple layers or involves an architectural decision.

### Builder

Implements the complete requirement and runs relevant validations.

Use it when the expected outcome is clear.

### Reviewer

Reviews the change without editing it. Focuses on behavior, security, data, concurrency,
design, and tests.

Use it in a new conversation to avoid carrying implementation context.

## Prompts

### `/implement-feature`

Implements a requirement respecting architecture, design, and tests.

### `/design-interface`

Designs or redesigns an interface with the project's visual system.

### `/review-change`

Reviews the current diff and returns prioritized findings.

## Using skills

Skills are activated by their description. You do not need to mention their name if the
requirement is clear.

- `laravel-feature-development`
- `inertia-react-development`
- `product-ui-design`
- `quality-review`

## Recommended context

To implement a feature:

- current requirement;
- similar files;
- affected layer documentation;
- `DESIGN.md` if there is an interface;
- related tests.

Avoid attaching all repository documentation or multiple unrelated modules.

## Laravel Boost

The `laravel-boost` MCP should be the source for:

- installed version documentation;
- routes;
- database schema;
- configuration;
- logs;
- detected Laravel packages.

This repository's instructions define project-specific decisions. Boost provides framework
and package knowledge, avoiding copying extensive documentation into permanent context.

## shadcn MCP

Use the `shadcn` server to:

- search for existing components;
- review blocks;
- install compatible components;
- query configured registries.

Before installing:

- review the code;
- check the base defined in `components.json`;
- prefer existing project components over new installations.
