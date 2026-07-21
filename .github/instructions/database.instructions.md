---
name: Database and models
description: Data integrity, migrations, Eloquent, transactions and concurrency.
applyTo: "database/**/*.php,app/Models/**/*.php,app/Enums/**/*.php"
---

- Use foreign keys, indexes, unique constraints and nullability to enforce invariants.
- Keep migrations focused and safe for existing data.
- Represent money using the project's integer or decimal convention, never floating point.
- Preserve audit history for payments, tickets, inventory, orders and cash operations.
- Use atomic updates or row locks for contested inventory and reservations.
- Avoid model observers for critical workflows when they make effects implicit.
- Add casts and relationships explicitly.
- Factories should create valid domain states by default.
