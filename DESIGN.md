# Design system

## Visual direction

The platform is a daily operations tool. It must feel professional, stable, fast, and
precise. Clarity takes priority over decoration.

The interface avoids:

- decorative gradients without function;
- glassmorphism;
- excessive shadows;
- exaggerated border radii;
- large empty spaces on work screens;
- different colors for elements representing the same action;
- invented components when shadcn/ui already provides the right pattern.

## Principles

1. **Clear hierarchy:** the title, status, and primary action are immediately identifiable.
2. **Controlled density:** enough information to operate without overwhelming.
3. **Consistency:** an action is represented the same way across all modules.
4. **Immediate feedback:** every operation communicates loading, success, or error.
5. **Accessibility:** keyboard, visible focus, labels, and adequate contrast.
6. **Real responsive:** information remains usable on small screens.

## Visual source

- `components.json` defines shadcn/ui implementation and style.
- Existing components in `resources/js/components/ui` are the first choice.
- Colors are expressed through semantic theme variables.
- Do not switch between Base UI and Radix within the same project.
- Icons use the already-configured library, typically Lucide.
- Dark mode must maintain the same hierarchy and legibility.

## Typography

- Sans-serif font configured by the project.
- Page titles: `text-2xl font-semibold tracking-tight`.
- Section titles: `text-lg font-semibold`.
- Body text: `text-sm` or `text-base` depending on context.
- Secondary information: `text-sm text-muted-foreground`.
- Table and form labels: legible, not decorative.
- Financial amounts and quantities must align and format consistently.

## Spacing & geometry

- Page container: `space-y-6`.
- Horizontal padding: `px-4 sm:px-6 lg:px-8`.
- Section separation: `gap-6`.
- Forms: `gap-4`.
- Cards: `p-4 sm:p-6`.
- Controls: height consistent with project components.
- Use the theme-defined radius; do not mix arbitrary radii.
- An admin page should not nest cards unnecessarily.

## Page structure

```text
App Shell
└── Page Container
    ├── Page Header
    │   ├── Optional breadcrumbs
    │   ├── Title and description
    │   └── Primary action
    ├── Feedback or alerts
    ├── Summary/KPIs when valuable
    ├── Search and filter toolbar
    └── Main content
```

## Patterns

### Header

- Short, specific title.
- One-line description only when it clarifies purpose.
- One primary action.
- Secondary actions in a menu or alongside primary if frequent.

### Forms

- Group fields by intent, not by control type.
- Place visible labels.
- Show errors next to the field.
- Disable submission during processing.
- Preserve values when the server returns validation errors.
- Destructive actions require confirmation.

### Tables

- Use tables to compare records with stable columns.
- Right-align amounts and quantities.
- Keep per-row actions in a final column.
- Filters belong in the toolbar, not in each card header.
- On mobile, allow horizontal scroll or a designed compact view; do not hide critical data.
- Include a helpful empty state.

### Cards

- Use cards to group related information.
- One card per distinct concept.
- Avoid nesting cards inside cards without a clear purpose.
- Card headers are concise; do not repeat the page title.

### Dialogs

- Use for confirmation, quick creation, or focused detail.
- Do not put multi-step workflows in a dialog.
- Trap focus and restore it on close.
- Include a clear dismiss action.

### Status indicators

- Use badges with consistent color + text.
- Never rely on color alone; always include text or an accessible label.
- States must be predictable across modules.

### Loading states

- Show skeleton or spinner proportional to the content area.
- Do not flash empty states before data loads.
- Disable controls that depend on in-flight data.

### Empty states

- Explain what would normally appear.
- Offer a clear next action when applicable.
- Never show a blank table without context.

### Error states

- Show what went wrong and what to do next.
- Inline errors near the affected field.
- Page-level errors at the top of the content area.
- Do not show raw exception messages to users.

### Success feedback

- Brief confirmation after mutation.
- Redirect to a stable, relevant view.
- Toast or flash message when staying on the same page.
