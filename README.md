# Event Commerce Inventory Platform

A unified platform for managing event ticket sales, e-commerce, inventory, point of sale,
cash register, and operational indicators.

The project uses Laravel as its business-logic and security core, with Inertia, React, and
TypeScript for the interface. Tailwind CSS and shadcn/ui form the visual foundation.

## Functional scope

### Events & Tickets

- Event publishing and management.
- Ticket types, pricing, capacity, and promotions.
- Venues with sections, tables, or seats.
- Temporary reservation during the payment process.
- QR-based payment.
- Digital ticket issuance.
- Door scanning and validation.

### E-commerce

- Products, categories, images, and pricing.
- Catalog, search, and filters.
- Cart and checkout.
- Delivery address and tracking.
- QR payment.
- Order management.

### Physical operations

- Shared inventory between e-commerce and POS.
- Stock movements, adjustments, and alerts.
- Direct sales and pending orders.
- Cash register opening, movements, reconciliation, and closing.
- Operational dashboard.

## Architecture

The application is developed as a modular monolith:

```text
HTTP Request
    ↓
Route
    ↓
Controller / Form Request / Policy
    ↓
Application Action
    ↓
Eloquent Models + Database Transaction
    ↓
Inertia Response or Redirect
    ↓
React Page + Feature Components + shadcn/ui
```

Laravel owns validation, permissions, business rules, and persistence. React manages
presentation and interaction.

The full architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Design system

The interface is operational, clear, and consistent. Administrative pages share:

- app shell with stable navigation;
- page header;
- visible primary actions;
- compact filters;
- tables or lists with clear hierarchy;
- forms grouped by intent;
- loading, empty, error, and confirmation states;
- responsive behavior;
- keyboard accessibility.

Visual rules are in [DESIGN.md](DESIGN.md).

## How to implement a requirement

Every requirement follows the same path:

1. Understand the expected outcome and review similar features.
2. Define data, permissions, validations, and states.
3. Implement the business operation in Laravel.
4. Expose it through a small controller.
5. Build or adapt the Inertia page.
6. Compose the interface with existing components.
7. Test the behavior and review the complete change.

The detailed procedure is in
[docs/FEATURE_IMPLEMENTATION.md](docs/FEATURE_IMPLEMENTATION.md).

## Technical documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Backend Laravel](docs/BACKEND.md)
- [Frontend Inertia & React](docs/FRONTEND.md)
- [Feature implementation](docs/FEATURE_IMPLEMENTATION.md)
- [Quality & review](docs/QUALITY.md)
- [Tech stack](docs/STACK.md)
- [AI development](docs/AI_DEVELOPMENT.md)
- [Technical sources](docs/TECHNICAL_SOURCES.md)
