---
name: Product interface design
description: Visual and interaction rules for pages and components.
applyTo: "resources/js/pages/**/*.tsx,resources/js/components/**/*.tsx,resources/css/**/*.css"
---

- Read `DESIGN.md` before creating or redesigning UI.
- Preserve the application shell, page header, spacing and action hierarchy.
- Use semantic theme variables instead of arbitrary colors.
- Avoid gradients, glass effects, oversized radii and decorative dashboard cards.
- Use one clear primary action per page section.
- Use badges consistently for statuses and never rely only on color.
- Keep data-heavy interfaces compact but readable.
- Verify desktop, mobile, keyboard, dark mode and all UI states.
- Never use native `<select>` elements. Always use the shadcn/ui `Select` component (Radix-based) so that dropdown options respect the active theme in both light and dark mode. Pair it with a hidden `<input name="...">` when inside an Inertia form so the value is submitted with the request.
