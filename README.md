# Dynamic Engine

An adaptive workspace that assembles itself from an LLM response. You ask a
question; the server streams back a schema describing which widgets to render;
the client resolves that schema to React components at runtime.

```
┌─────────────────────────────────────────────────────────────┐
│  prompt ──▶ POST /api/generate-dashboard                    │
│                                                             │
│         SSE:  meta ──▶ widget ──▶ widget ──▶ … ──▶ done     │
│                │           │                                │
│                │           └─▶ registry resolves → React    │
│                └─▶ grid paints sized skeletons up front     │
│                                                             │
│  interaction ──▶ POST /api/widget-action  (optimistic)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Running it

Two terminals. Node 20+.

**Server** — http://localhost:4000

```bash
cd server
npm install
npm run dev
```

**Client** — http://localhost:5173

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 and click a suggestion, or type your own prompt.
Two scenarios are wired up, selected by keyword: *high risk accounts* and
*system analytics*.

| Command | Server | Client |
|---|---|---|
| Dev | `npm run dev` | `npm run dev` |
| Build | `npm run build` | `npm run build` |
| Typecheck | `npm run typecheck` | `npm run typecheck` |

Vite proxies `/api` to port 4000, so the client uses relative paths and CORS is
a non-issue in development.

### Things worth trying

- **Watch it stream.** Skeletons appear in their final sizes, then fill in.
  Nothing moves.
- **Re-prompt.** The second scenario returns different widgets, columns and
  sources — no client code knows which is which.
- **Sort and filter the table.** Sorting compares raw numbers, so `SAR 5.1M`
  ranks above `SAR 900K`.
- **Tick a recommended action.** Instant, no spinner.
- **Hit "Simulate failure", then tick another.** It checks, pauses, reverts, and
  a toast explains why.
- **Switch themes.** Dark, light, high-contrast — all three drive off the same
  tokens.

---

## Architecture

### Stack

**Server** — Express + TypeScript, two dependencies (`express`, `cors`).
**Client** — Vite 8, React 19, TypeScript 6, Tailwind 4, `clsx` +
`tailwind-merge`, `lucide-react`.

The brief is self-contradictory on the backend — the stack line says
Express/Node, requirement 4 says FastAPI is preferred. I chose Express so the
schema types are shared across both halves: `server/src/types/widgets.ts` is the
source of truth and the client holds a copy with a provenance header. A schema
change breaks the build on both sides rather than failing at runtime.

### The streaming protocol

Frames arrive in order: `meta` → `widget`\* → `done`.

The **`meta` frame carries a slot per widget** — id, type, and layout
dimensions — *before* any widget data exists. The client paints a full grid of
correctly-sized skeletons immediately, and later frames fill holes that were
already reserved.

This is the whole zero-CLS mechanism. Layout hints live on the widget envelope
rather than inside `data`, so space can be reserved without understanding the
payload.

`EventSource` cannot issue POST requests and the prompt travels in the body, so
the stream is read with `fetch` + `TextDecoderStream` and a hand-written frame
parser that buffers across chunk boundaries.

### Dynamic Component Registry

`client/src/registry/` — the piece the assignment is really about.

A widget passes through **four layers**, each catching a different failure:

| Layer | Catches | Result |
|---|---|---|
| `validate` | Malformed or missing data | Fallback naming the specific reason |
| `resolve` | Unknown widget type | "This client cannot render it" |
| Error boundary | Component throws mid-render | Error card + Try again |
| `Suspense` | Code-split chunk loading | Archetype-shaped skeleton |

Any widget can fail at any layer without touching its neighbours.

**Validation earns its place.** The boundary alone would catch a missing field,
but it surfaces as `undefined.map is not a function` from deep inside a
component — technically handled, useless to the user. Validating first turns
that into "Metric card has no value."

It is deliberately *structural*, not exhaustive: it checks only what a component
would actually crash on. Over-validating would reject payloads that render fine.

**The registry cannot drift from the schema.** It is typed as an interface with
one key per archetype rather than a `Record`, so adding a type to the union is a
compile error until a component is registered. Each entry is typed against its
own widget variant, so a component written for `METRIC_CARD` cannot be
registered under `DATA_TABLE`.

All six archetypes are `lazy()`-loaded and appear as separate chunks in the
build.

### Optimistic state

`useOptimisticAction` owns the *sequencing*, not the state. Callers pass
`apply`, `rollback`, and a payload builder, so the hook never knows what it is
updating — which is why the same hook serves a checkbox and a multi-field form.

```
apply locally  ──▶  dispatch in background  ──▶  refused? restore + notify
   (4.8ms)              (457ms)                      (rollback)
```

Measured in-browser: the UI reflects a toggle in **4.8ms** against a **457ms**
server round trip — roughly 95× sooner than the network can confirm it.

Three details that matter:

- **Superseded requests abort.** Toggling twice quickly would otherwise let a
  slow first response roll back state a newer click just set. `AbortError` is
  explicitly not treated as a failure.
- **The form reverts to the last server-accepted values**, tracked separately
  from the visible fields. Reverting to schema defaults would discard earlier
  successful edits.
- **Toggles confirm silently.** A toast per checkbox click is noise; toasts are
  for failures, where the user must know their change was undone. The form
  *does* confirm, because "applied" is a claim about the server.

The mock server injects 450ms of latency deliberately. Against an instant local
server, an optimistic update and a pessimistic one look identical.

---

## UI/UX trade-offs

**Design tokens over utility soup.** Every colour is semantic — `surface`,
`accent`, `content` — never `gray-900` or `orange-500`. Themes swap the values
underneath and no component knows which theme is active. The cost is a layer of
indirection; the benefit is that adding high-contrast mode touched one file.

**Note for review:** Tailwind 4 replaces `tailwind.config.js` with CSS-first
configuration. The assignment asks for CSS custom properties integrated via
`theme.extend` — that is the v3 API. v4's `@theme` *is* native custom
properties, so the requirement is met more directly, but there is no config file
to look for.

**Fixed-height grid cells.** Cells use `height`, not `minHeight`. A floor
reserves space but does not cap growth, so a tall skeleton or a verbose error
message would push the row and shift the page — the precise failure the design
prevents. The cost is that content taller than its slot is clipped.

**The narrative answer is page content, not a widget.** It reads as the lede —
the thing you asked for — so it gets no card or border. It is also the one
element outside the fixed-cell guarantee, so a wrapping headline can shift
content below it on narrow screens. A reserved min-height fixes that but leaves
visible empty space on shorter headlines, which is the worse trade.

**Virtualization above 100 rows, plain rendering below.** The DOM cost of 50
rows is trivial and windowing would add scroll machinery for nothing. The risk
table sends 500 rows and keeps 12 in the DOM.

**The table shows "500 of 2,988" and there is no pagination.** That split is
normal — real virtualized tables pair windowing with paging, and the two solve
different problems (render cost vs fetching) — but the assignment asks only for
virtualization, so paging is out of scope and those rows are unreachable.

**The server is stateless.** `/api/widget-action` validates, waits, and confirms
what it *would* have applied. This keeps the mock honest about being a mock, but
it means the parameter form has no downstream effect: changing the risk
threshold does not re-filter the table. The form demonstrates schema-driven
validation and optimistic submission, which is what the archetype is there to
show.

**Accessibility as a constraint, not a pass at the end.** The theme switcher is
a radiogroup with roving tabindex. The histogram is `aria-hidden` with a
visually hidden summary carrying every bin value — eleven unlabelled graphics
are noise to a screen reader. Action items are real checkboxes, so space-to-
toggle and announced state come free. Sortable headers carry `aria-sort`; form
errors are `role="alert"` with `aria-invalid`.

One knowing exception: the theme buttons are 24px, below the 44px WCAG target
size. They are icon-only desktop header controls with keyboard access and
visible focus rings.

---

## Repository

```
server/
  src/
    routes/       generate-dashboard (SSE), widget-action
    data/         two scenarios + a seeded row generator
    types/        widget schema — source of truth
client/
  src/
    registry/     resolver, validation, error boundary, skeletons
    widgets/      six archetype components
    hooks/        useDashboardStream, useOptimisticAction
    theme/        provider + toggle
    components/   grid, composer, toaster, lede
```

## API

**`POST /api/generate-dashboard`** — `{ prompt: string }` → SSE stream.
Validation runs before the stream opens, since a JSON error is impossible once
SSE headers are sent.

**`POST /api/widget-action`** — `{ widgetId, action, payload }` → 200 with an
echo, or 400 with per-field `details`. `ACTION_FAILED` (503) and
`INVALID_ACTION` (400) are distinct: one means retry, the other means fix the
input.

Adding `"__forceFail": true` to any payload returns 503 after the usual latency,
which is what the "Simulate failure" switch does.

**`GET /api/health`** — liveness.
