---
name: Tests
description: Testing conventions for Laravel and React behavior.
applyTo: "tests/**/*.php,resources/js/**/*.test.ts,resources/js/**/*.test.tsx,resources/js/**/*.spec.ts,resources/js/**/*.spec.tsx"
---

- Test observable behavior rather than private implementation details.
- Cover success, validation, authorization and state changes.
- Use factories and existing helpers.
- For payments, reservations, inventory, tickets and cash, cover duplicate execution and
  failure scenarios.
- Do not weaken an assertion to make incorrect behavior pass.
- Keep tests deterministic and independent.
