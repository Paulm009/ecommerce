# Tech stack

Reference verified as of July 21, 2026.

| Technology | Stable reference |
|---|---|
| Laravel | 13.x |
| Inertia | 3.x |
| React | 19.2 |
| Tailwind CSS | 4.3 |
| TypeScript | 6.0 |
| shadcn/ui | Current components; Base UI is the default for new projects |

## Source of truth

Installed versions are determined by:

- `composer.json`;
- `composer.lock`;
- `package.json`;
- package manager lockfile;
- `components.json`.

Do not upgrade a dependency or change the shadcn/ui base as part of a functional
requirement.

## Compatibility

- Inertia 3 requires React 19 in its React adapter.
- Laravel 13 requires PHP 8.3.
- TypeScript 6 is stable, but a migration from TypeScript 5 should be treated as an
  independent technical change.
- Base UI is the default shadcn/ui for new projects; Radix remains supported and an
  existing project should not be migrated without an explicit decision.
