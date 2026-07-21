# Project conventions

- Build a Laravel + Inertia application for events, tickets, e-commerce, inventory, POS,
  cash register, and operational reporting.
- Laravel owns authorization, validation, business rules, transactions, and persistence.
- React owns presentation and local interaction.
- Inspect existing code before introducing a new pattern.
- Prefer Laravel, Inertia, React, Tailwind, and shadcn/ui native capabilities.
- Keep controllers small and use a focused application action for non-trivial writes.
- Apply authorization on the server and reinforce invariants with database constraints.
- Treat payments, reservations, inventory, ticket validation, and cash movements as
  idempotent and concurrency-sensitive operations.
- Use typed Inertia props and strict TypeScript. Avoid `any` and unsafe assertions.
- Follow `DESIGN.md` for every user interface.
- Reuse existing shadcn/ui components and respect `components.json`.
- Add tests proportional to the risk of the behavior.
- Do not add or upgrade dependencies unless the requirement explicitly needs it.
- Do not edit generated Wayfinder files manually.
- Use Laravel Boost MCP for version-specific Laravel and package documentation.
- Keep changes limited to the requested behavior.
