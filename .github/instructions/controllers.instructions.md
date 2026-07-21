---
name: Laravel controllers
description: Specific rules for HTTP controllers and Form Requests.
applyTo: "app/Http/Controllers/**/*.php,app/Http/Requests/**/*.php"
---

- Keep each controller action focused on one HTTP use case.
- Prefer invokable controllers for distinct operations with meaningful names.
- Validate through a Form Request when rules or authorization are non-trivial.
- Authorize before querying or mutating protected resources.
- Delegate multi-model, transactional or reusable business operations to an Action.
- Use named routes and stable redirects.
- Send minimal, authorized props to Inertia.
- Do not catch exceptions only to hide them or convert them into generic success responses.
