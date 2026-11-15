# @dhriti/ui

Dhriti reusable UI package built on top of MUI and `@dhriti/theme`.

## Layers

- `mui`: direct MUI exports for primitives
- `components`: Dhriti foundation components (thin wrappers)
- `navigation`, `communication`, `work`, `knowledge`, `meetings`, `ai`, `organization`: reusable product-level visual components

## Usage

```tsx
import { DhritiButton, TaskCard, MessageBubble } from "@dhriti/ui";
```

## Breadcrumb

`DhritiBreadcrumb` renders an accessible navigation landmark and ordered trail.
Pass `items` in navigation order as `{ label, href? }`; the final item is the
current page and is never a link. Earlier items without an `href` are plain
text. An empty trail renders nothing. Use `variant="plain"` or
`separator="chevron"` when the default surface and slash do not fit the page.
For client-side routing, supply `renderLink(item, className)` and apply the
provided class to your router link. Loading and error states belong to the
parent because the breadcrumb performs no data fetching.

Use MUI primitives directly where needed:

```tsx
import { Box, Stack, Typography } from "@mui/material";
```

## Dhriti AI Assistant

`DhritiAIAssistant` provides a floating welcome card, launcher, expandable chat
panel and draggable positioning. Mount it once under `ThemeProvider`; the web
root layout mounts it across public and workspace routes. It portals to the body
to avoid clipping by page layouts. Hold and drag the assistant launcher to move
it, or focus the launcher and use arrow keys; Home resets its position. A normal
click requests a panel toggle, while a drag does not. Resizing requests a
constrained position so the parent can keep the widget in view.

The component is **fully controlled**. Required value/callback pairs are `open` /
`onOpenChange`, `welcomeVisible` / `onWelcomeVisibleChange`, `expanded` /
`onExpandedChange`, `draft` / `onDraftChange`, and `position` / `onPositionChange`.
The parent supplies `messages` (`id`, `role`, `text`), `suggestions`, `onSend`, and
`onSuggestionSelect`. Sending emits trimmed text; it never appends messages or
clears the draft. Selecting a suggestion never changes the draft automatically.
No callback changes the display until the parent supplies updated props.

Only ephemeral pointer gestures, focus, scrolling and hydration are internal.
The parent also controls `disabled`, `loading`, `loadingLabel`, `error`, `subtitle`,
`notice`, welcome content, composer placeholder and action labels. The component
does not impose an AI provider, persistence, or a preview-only messaging policy.

The web root mounts `GlobalAIAssistant`, an app-owned **UI-only preview controller**:
suggestions fill its draft, sending adds a local user message and clears the draft.
It makes no backend requests and persists nothing. Integration logic belongs in
that controller, not in the shared presentation component.
Sizing lives in theme `assistantTokens`; visuals use semantic theme utilities.
The floating layer sits below modal dialogs.

The web Tailwind entry and Storybook both import `src/theme/globals.css` for the
same CSS theme tokens. The existing web token values are unchanged. Assistant
stories cover the welcome card, launcher, open/expanded panel, keyboard focus,
hover, disabled send action, local conversation, empty suggestions, long content,
mobile sizing, dark theme, loading, errors, disabled state and parent-supplied
messages. Attachment uploads remain absent until a backend is integrated.

## Input fields

`DhritiSwitchField` is a controlled switch using `checked` and `onChange`.
It supports a visible or hidden accessible label, native form `name`, `value` and
`required`, helper/error messages, disabled and read-only states. Read-only
switches remain focusable and participate in form submission but cannot change.

`DhritiButton` supports `primary`, `secondary` and outlined `danger` variants;
`sm`, `md` and `lg` sizes; and `startIcon` / `endIcon` slots. It defaults to
`type="button"`; use `type="submit"` for forms. `loading` sets `aria-busy` and
disables the button while retaining its label. Supply `aria-label` for icon-only
buttons. Native button attributes and event handlers are forwarded.

`DhritiSearchField` is a controlled text field with a search icon and optional
clear action. `onChange` updates the parent's visible draft immediately;
`onSearch` emits the controlled value after `debounceMs` (default 300 ms).
It does not emit on mount, trims nothing, uses the latest callback, and cancels
pending work on unmount or when disabled/read-only. Parents own query filtering,
requests, and loading/error state; do not add another debounce around `onSearch`.

`DhritiCheckboxField` and `DhritiRadioField` use `checked` / `onChange` and
native keyboard semantics. Checkbox `indeterminate` is controlled; radios share
a parent-provided `name` and the parent controls mutually exclusive values.
Both support required/error/helper feedback and disabled/read-only controls.
Use a fieldset/legend in the parent for related radio options.

Import `DhritiTextField`, `DhritiNumberField`, `DhritiEmailField`,
`DhritiPasswordField`, `DhritiPhoneField`, `DhritiCountryField`,
`DhritiSelectMenu`, `DhritiComboboxFlat`, `DhritiComboboxHierarchy`,
`DhritiComboboxGrouped`, and `DhritiFieldGroup` from `@dhriti/ui`.
Storybook groups them under **Input Fields** (Basic, Contact, Security,
Selection, Combobox, and All Fields). They reproduce the input-field reference
layouts using the shared light/dark theme, with accessible labels and buttons.

All fields are controlled: the parent must update `value` after `onChange`.
Text, email, phone, password, and number values are strings, preserving empty
inputs. Number stepping uses native precision and parent-provided `min`, `max`,
and `step`; there is no implicit minimum. Phone values are emitted unformatted.
Single selections use `string | null`; multiselections use `readonly string[]`.
Option values and group values must be unique within a field. The parent
supplies all options/countries; no product data is embedded in the components.

Menus require `open` / `onOpenChange`; searchable menus also receive `search` /
`onSearchChange`. Closing requests never silently clear search: that policy
belongs to the parent. Tree expansion requires `expanded` / `onExpandedChange`.
Group selection and clearing preserve disabled options. Outside pointer presses
and Escape request dismissal; arrow keys move focus through available options.
The components only manage temporary focus and DOM references internally.

Passwords require `visible` / `onVisibleChange`. The optional `strength` is a
parent-provided `{ score: 0 | 1 | 2 | 3 | 4, label, tone }`; no password policy is
embedded. Validation is parent-owned: supply an `error` message to render the
error border, `aria-invalid`, and the message immediately below the input.
`success` / `successText` provide explicit success feedback. `required` does not
invent validation messages. Fields have no asynchronous work or loading state;
an application can disable them while fetching options.

Shared presentation props include `label`, `showLabel`, `helperText`,
`placeholder`, `required`, `disabled`, `readOnly`, `size` (`sm`, `md`, `lg`),
`variant` (`outlined`, `filled`, `underline`), icons, and `clearable`.
Read-only/disabled fields block editing and auxiliary controls.

### Date, time, textarea, and files

`DhritiDateField` uses a themed calendar and date-only `YYYY-MM-DD` strings
(`""` means empty), with `open` / `onOpenChange` and a separate `month`
(`YYYY-MM`) / `onMonthChange`. It supports `min`, `max`, `locale`, and
`weekStartsOn` (Sunday or Monday). Formatting uses UTC to prevent local timezone
date shifts. Arrow keys move by day/week, Home/End move within the week, and
navigation never changes the selected date until a day is chosen.

Set `mode="month"` for direct month selection (`value`, `min`, and `max` use
`YYYY-MM`), or `mode="year"` for year selection (`YYYY`). The default is
`mode="date"`. Empty values remain `""`; `month` / `onMonthChange` always use
`YYYY-MM` as the parent-controlled navigation anchor. Month mode navigates
years; year mode navigates twelve-year blocks. Arrow keys move through the
three-column grid, Home/End move within a row, and selection emits immediately.
All modes share clearing, bounds, disabled/read-only, validation, and dialog
popover behavior. Payroll month-only fields use month mode without adding a
synthetic day to their API values.

`DhritiTimeField` uses `HH:mm` (24-hour) strings, with labeled, scrollable hour
and minute columns, a selected-time preview, and keyboard navigation.
`minuteStep` defaults to 5 and must be a positive divisor of 60; existing
off-step minutes remain visible. `min` / `max` describe a same-day interval.
Selecting a column emits immediately; changing hours clamps minutes to the
allowed interval. Done only requests dismissal: no internal draft is committed.
Both pickers support clearing, Escape, outside dismissal, focus restoration,
and parent-controlled validation. Invalid date/time contracts throw explicit
`RangeError`s. Picker menus portal to the nearest native dialog (or the document
body outside a dialog), clamp to the viewport,
and flip above the trigger when needed, so drawers do not clip their contents.

Selection, country, phone-country, and all combobox menus use the same floating
popover positioning as date/time pickers. Menus match the control width (the
phone-country menu keeps its own width), flip to the side with more space, and
scroll within the available viewport height without enlarging form scroll areas.
Position follows ancestor scrolling, resizing, and menu-content resizing.
Native `showModal()` dialogs make outside content inert, so their menus must
stay within that dialog's top layer to remain visible, clickable, and focusable.
Selection/combobox labels remain accessible names but do not activate menus.
Click the control or use arrow keys to open; simply focusing a combobox does not
open it. Selection/search/open state remain entirely parent-controlled.

`DhritiTextareaField` has a controlled string value, `rows`, optional `maxLength`,
`showCharacterCount`, and `resize` (`vertical` or `none`). Errors appear directly
below the textarea, before the optional character count.

`DhritiFileInput` receives `readonly File[]` / `onChange`. It supports `accept`,
`multiple`, drag-and-drop, a native keyboard-accessible chooser, and removable
file summaries. Choosing/dropping files replaces the selection; single-file
mode emits the first file. `accept` is only a chooser hint: the parent validates
types and sizes for both chosen and dropped files. Empty/cancelled chooser events
do not clear the value; removal emits a new array. Native input contents reset
after a selection so the same file can be chosen again. `uploading`, `progress`
(0–100), and `uploadLabel` are presentation-only; no upload or persistence occurs.
Uploading blocks changes and removal. Do not set native `required` on this
resetting chooser; supply parent-owned required validation via `error`.

Storybook adds Date, Time, Textarea, and File Input groups and includes them in
All Fields. Examples cover empty/selected, error, disabled/read-only, long data,
responsive and dark-theme states; the file story demonstrates parent validation.

```tsx
const [name, setName] = useState("");
<DhritiTextField
  label="Full name"
  value={name}
  onChange={setName}
  required
  error={submitted && !name.trim() ? "Full name is required" : undefined}
  clearable
/>;
```
