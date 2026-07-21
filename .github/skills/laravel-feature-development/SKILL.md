---
name: laravel-feature-development
description: 'Implement Laravel backend behavior with routes, Form Requests, Policies, controllers, Actions, Eloquent, transactions and tests. Use when creating or changing controllers, models, migrations, authorization, business operations, payments, inventory, tickets, POS or cash workflows.'
---

# Laravel feature development

1. Read [backend conventions](../../../docs/BACKEND.md) and the relevant existing code.
2. Query Laravel Boost for APIs that depend on installed versions.
3. Define the invariant, permission, validated input and observable result.
4. Use the smallest appropriate flow:
   - read: route → authorization → query → Inertia response;
   - write: route → Form Request → controller → Action → transaction → redirect.
5. Reinforce integrity with database constraints.
6. Protect contested resources and repeated commands.
7. Add focused feature tests.

Use [controller patterns](references/controller-patterns.md) when creating an HTTP entry
point. Use [critical writes](references/critical-writes.md) for payments, reservations,
inventory, tickets or cash.
