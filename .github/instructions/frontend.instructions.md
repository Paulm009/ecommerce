---
name: Inertia React frontend
description: React, TypeScript, Inertia, Wayfinder and feature component conventions.
applyTo: "resources/js/**/*.ts,resources/js/**/*.tsx"
---

- Follow `docs/FRONTEND.md` and `DESIGN.md`.
- Pages compose layouts and feature components; keep reusable behavior outside pages.
- Use typed props, typed forms and `import type`.
- Use Inertia navigation and forms before standalone HTTP calls.
- Use Wayfinder routes and actions when available.
- Reuse `components/ui` and build domain components in feature folders.
- Keep server state in Inertia props or the URL; avoid unnecessary global state.
- Include loading, empty, error, disabled and success feedback.
- Maintain keyboard access, visible focus and responsive behavior.
