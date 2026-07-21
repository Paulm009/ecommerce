# Quality & review

## Backend tests

Use feature tests as the first choice for HTTP and business behavior.

Every relevant operation should cover:

- success;
- validation;
- authorization;
- state changes;
- database effects.

Critical operations also cover:

- repeated request;
- duplicate callback;
- concurrency;
- intermediate failure;
- compensation or rollback.

## Frontend tests

Add frontend tests when interaction logic is not sufficiently covered by the backend or a
manual review.

Prioritize:

- complex forms;
- filters and tables with custom behavior;
- dialogs and confirmations;
- conditional states;
- reusable hooks.

## Checks

The actual commands defined by the project take priority. As a baseline:

```text
php artisan test --compact
vendor/bin/pint --format agent
npx tsc --noEmit
npx eslint resources/js
npx prettier --check resources/js
npm run build
```

## Code review

Look first for:

1. data loss or corruption;
2. incorrect authorization;
3. double payment, double issuance, or double movement;
4. stock or seat overselling;
5. invalid state transition;
6. inefficient queries;
7. inconsistent PHP/TypeScript contract;
8. UX and accessibility regressions;
9. missing tests.

Do not turn personal style preferences into findings when Pint, ESLint, or Prettier
already determine formatting.

## Evidence

A change is considered validated when you can state:

- what behavior was tested;
- what command was executed;
- what the result was;
- what requires manual verification;
- what risk remains.
