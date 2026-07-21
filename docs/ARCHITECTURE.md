# Architecture

## Approach

Modular Laravel + Inertia monolith. Boundaries are organized by business responsibility
without forcing packages, physical modules, or ceremonial layers.

## Responsibilities

### Laravel

- routes;
- authentication;
- authorization;
- validation;
- business rules;
- transactions;
- persistence;
- queues and notifications;
- Inertia props preparation.

### React

- visual composition;
- local interaction;
- Inertia forms;
- tables, filters, and navigation;
- feedback and accessibility;
- reusable components.

### Database

- referential integrity;
- uniqueness;
- indexes;
- auditing;
- concurrency protection;
- state and movement persistence.

## Read flow

```text
Route
→ Controller
→ Authorized query
→ Eloquent / Query Builder
→ Resource or explicit mapping
→ Inertia::render()
→ React Page
```

## Write flow

```text
Route
→ Form Request
→ Policy
→ Controller
→ Application Action
→ DB transaction
→ Domain records / events / jobs
→ Redirect with flash message
```

## Recommended classes

| Class | Purpose |
|---|---|
| Controller | Coordinate HTTP and return a response. |
| Form Request | Validate data and request-related authorization. |
| Policy | Decide access to a resource or capability. |
| Action | Execute a concrete business operation. |
| Model | Relationships, casts, scopes, and local behavior. |
| Job | Retryable work or work that should not block the request. |
| Notification/Mail | Communication with users. |
| Resource | Normalize data when it prevents duplication or accidental exposure. |

Do not create an additional class if the behavior is trivial and already clear in the
controller or model.

## Core domains

- Identity and Access
- Events and Venues
- Orders and Payments
- Ticket Issuance and Access Control
- Catalog
- Inventory
- Point of Sale
- Cash Register
- Reporting
- Notifications

## Critical operations

The following flows require special attention:

- seat, table, or capacity reservation;
- payment confirmation;
- ticket issuance and validation;
- stock reservation, deduction, and restoration;
- POS order to sale conversion;
- cash register movements and closing.

For these, apply:

- transactions;
- database constraints;
- locks or atomic updates;
- idempotency;
- auditing;
- repetition and concurrency tests.

## Cross-domain dependencies

Dependencies should point toward a clear operation, not internal details.

Example:

```text
Payment confirmed
→ CompleteOrder action
→ Inventory movement
→ Ticket issuance or fulfillment
→ Notification job
```

Do not call one controller from another.

## Data sent to the frontend

- Only authorized data.
- Minimal props.
- Dates in a consistent format.
- Money in a precise representation.
- States as known unions or enums.
- Pagination and filters preserved in the URL when applicable.

## Decisions

Important, durable decisions should be documented close to the architecture or in an ADR.
Do not document obvious decisions or temporary details.
