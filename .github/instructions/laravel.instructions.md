---
name: Laravel application
description: Laravel conventions for application classes, routes, authorization and configuration.
applyTo: "app/**/*.php,routes/**/*.php,config/**/*.php,bootstrap/**/*.php"
---

- Follow `docs/BACKEND.md` and the existing namespace structure.
- Use route model binding, Form Requests, Policies, Eloquent and named routes.
- Controller methods coordinate HTTP; application actions perform non-trivial writes.
- Return Inertia responses for pages and redirects for successful mutations.
- Use `declare(strict_types=1)` when the existing project follows that convention.
- Use explicit return types.
- Do not call `env()` outside configuration.
- Do not introduce service/repository interfaces without multiple real implementations or a
  clear testing boundary.
- Query only authorized data and avoid N+1 queries.
