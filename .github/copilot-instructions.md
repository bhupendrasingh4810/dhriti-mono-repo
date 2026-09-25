# Dhriti Copilot Engineering Guide

Applies to all product surfaces: Connect, Flow, Nexus, Pulse, Atlas.

Goal: ship maintainable UI and feature code with strong reuse, strict theme usage, and minimal AI credit waste.

## Core Engineering Principles

1. Reuse first, build second.

- Before creating a new component, check existing components in packages/ui/src/components.
- If 80% similar behavior exists, extend with props or composition instead of duplicating.
- Keep feature logic in feature modules, keep shared visual primitives in UI package.

2. Theme is the single source of truth.

- Use theme tokens for color, spacing, typography, radii, shadows, transitions.
- Never hardcode hex/rgb/hsl in feature code or shared UI code.
- Never hardcode font families, sizes, or weights outside theme config.
- Use semantic tokens (surface, text, border, status) so branding can change later.

3. Storybook is required for reusable UI.

- Every new shared component must include story coverage:
  - Default
  - States (hover, active, disabled, loading, error)
  - Responsive variant
  - Data edge cases (empty, long text, overflow)
- Stories should use realistic mock data from product context (Connect/Flow/Nexus/Pulse/Atlas).

4. Consistent architecture boundaries.

- apps/web contains route and feature orchestration.
- packages/ui contains reusable presentation components.
- packages/types and packages/validation hold contracts and schemas.
- Do not leak app-specific business rules into shared UI primitives.

5. Design for change.

- Build variant-driven components (size, tone, density, emphasis) via props.
- Prefer composition slots over one-off booleans when complexity grows.
- Keep accessibility defaults: keyboard focus, labels, contrast, semantic structure.

## Feature-Area Conventions

### Connect

- Chat surfaces should separate:
  - Navigation panel
  - Conversation window
  - Message input
  - Details panel
- Keep message rendering deterministic and pure.
- Keep reaction/mention behavior controlled by parent state where needed.

### Flow

- Workflow and automation UIs should model states explicitly.
- Use status components with semantic tokens, not one-off styling.
- Prefer table/list primitives from UI package for consistency.

### Nexus

- Knowledge and discovery surfaces should prioritize readability and hierarchy.
- Reuse card, tabs, filters, and layout primitives from shared package.

### Pulse

- Metrics and analytics views should use shared data-display and table primitives.
- Formatting rules for numbers, dates, and deltas should be centralized.

### Atlas

- Planning and mapping interfaces should be modular and composable.
- Keep interaction patterns predictable and token-driven.

## Styling Rules (Non-Negotiable)

- Do not use direct color values in components.
- Do not use inline magic numbers for spacing; use theme spacing scale.
- Do not introduce standalone CSS files for one-off color/typography overrides.
- Prefer sx with theme access or shared styled helpers.
- If a token does not exist, add it to theme first, then consume it.

## Reusable Component Checklist

Before merge, confirm all are true:

- Component is placed in packages/ui when reusable.
- API is prop-driven and typed clearly.
- Styling uses theme tokens only.
- Storybook stories added with all major states.
- No duplicated component logic in feature folder.
- Accessibility basics verified.

## AI Credit Efficiency Rules

Use these rules to reduce Copilot/AI token usage and avoid rework:

1. Ask once with full context.

- Provide exact file path, expected behavior, and constraints in one prompt.
- Include acceptance criteria and edge cases up front.

2. Request delta changes only.

- Ask for targeted patch by file and behavior.
- Avoid broad rewrites unless absolutely required.

3. Reuse this template when prompting:

- Scope: exact files to touch
- Constraints: theme-only styling, no hardcoded colors, keep existing behavior
- Output: patch + validation
- Acceptance: list explicit pass criteria

4. Enforce a done format.

- Require output to include:
  - changed files
  - behavior impact
  - diagnostics result
  - follow-up risks

5. Prefer small iterations.

- First ask for structure and interfaces.
- Then ask for implementation.
- Then ask for tests/stories.

6. Avoid duplicate exploration.

- Point Copilot to existing components before asking for new ones.
- Reference prior decisions from docs/decisions when available.

## Standard Prompt Template

Use this prompt for implementation tasks:

"Implement only in [file paths].
Keep architecture unchanged.
Use reusable components from packages/ui.
Use theme tokens only (no hardcoded colors/typography/spacing).
If reusable UI is added or changed, update Storybook stories.
Return: changed files + brief rationale + diagnostics status."

## Definition of Done

A task is complete only when:

- Behavior matches requirement.
- Reuse opportunities were applied.
- Theme-token compliance is maintained.
- Storybook coverage exists for reusable UI changes.
- Type checks pass and no new diagnostics are introduced.

## Anti-Patterns to Reject

- Copy-pasting similar components across Connect/Flow/Nexus/Pulse/Atlas.
- Hardcoded brand colors or typography in feature components.
- Building shared UI directly inside app route files.
- Shipping reusable component changes without Storybook updates.
- Large, unscoped AI prompts that cause noisy diffs.
