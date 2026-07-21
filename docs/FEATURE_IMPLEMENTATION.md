# Feature implementation

This flow applies to a screen, operation, report, form, or functional fix.

## 1. Understand

Determine:

- observable outcome;
- authorized user;
- input and output data;
- states and transitions;
- expected errors;
- mobile behavior;
- impact on existing data.

Review a similar feature before defining a new structure.

## 2. Design the contract

Define:

- route;
- permission;
- Form Request;
- controller;
- application action when applicable;
- models and relationships;
- Inertia props;
- page and components;
- tests that will demonstrate the behavior.

Do not create files because a template mentions them. Create only those that provide a
real responsibility.

## 3. Implement backend

Recommended order:

```text
Migration / constraint
→ Model / enum
→ Policy
→ Form Request
→ Action
→ Controller
→ Route
→ Test
```

A simple read may skip Action. A write with rules or multiple effects should have a
clearly identifiable operation.

## 4. Implement frontend

Recommended order:

```text
Page contract
→ Page layout
→ Feature components
→ Form or table
→ Loading / empty / error states
→ Responsive and keyboard verification
```

Read `DESIGN.md` before creating a new page.

## 5. Integrate

Verify the complete path:

- Laravel sends only authorized data.
- TypeScript types represent that data.
- Wayfinder or existing routes connect the interface.
- Server errors appear next to the field or action.
- Success redirects to a stable state.
- Repeated operations do not duplicate effects.

## 6. Test

Cover:

- successful case;
- validation;
- unauthorized user;
- invalid state;
- database effects;
- repetition or concurrency in critical operations.

## 7. Review

Before closing:

- review the complete diff;
- remove temporary code;
- check that generated code was not modified;
- run focused tests;
- run relevant format, type, lint, and build checks;
- test the interface on mobile and desktop;
- confirm the requirement is resolved without expanding its scope.

## Simplicity rule

Prefer the smallest solution that:

- preserves invariants;
- can be tested;
- is clear to the next developer;
- uses native stack tools;
- does not create obvious debt.
