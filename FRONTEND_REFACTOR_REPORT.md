# Refactor Summary

## Source Of Truth

The visual system, responsive behavior, component hierarchy, states, and
interaction rules were refactored against `IDEA.md`. No API route, backend
endpoint, authentication rule, database model, or business workflow changed.

## New Shared Components

- `StatusBadge`: maps real backend status values to the five semantic SmartLib
  tones while retaining the supplied label.
- `ConfirmDialog`: replaces browser confirms for cancel, delete, return,
  lost, damaged, and incident-resolution workflows.
- `RowActionMenu`: standard icon action menu for administrative table rows,
  including labels, desktop tooltips, Escape, and outside-click dismissal.
- `PageError`: durable inline error state with retry action.
- `PageLoader`, `EmptyState`, `Toolbar`, and `Modal`: shared skeleton, empty
  CTA, page-header, and accessible-dialog primitives.

## CSS Unified

- Consolidated the SmartLib brand, semantic colors, canvas/surface, spacing,
  radius, elevation, typography, focus, and motion tokens in `App.css`.
- Unified minimum control height at 44px, semantic status badges, panel/table
  surfaces, input focus states, responsive navigation, and reduced motion.
- Replaced the fake CSS book-shelf landing visual with a real library image;
  book covers retain a stable 2:3 ratio with status below the cover.
- Removed repeated text action buttons from admin rows in favor of the shared
  action menu and confirmation flow.

## Responsive Improvements

- User desktop uses the specified 64px primary header; mobile uses five
  bottom-nav touch areas with safe-area spacing.
- Admin remains sidebar-first at desktop and becomes a drawer-based shell below
  1024px.
- Catalog follows the 2 / 3 / 4 / 5-column progression. User loans and
  requests use compact rows on narrow screens instead of compressed tables.
- Public landing stacks cleanly below the mobile breakpoint while preserving a
  readable split layout on tablet and desktop.

## Route Coverage

- Public: landing, login/register and not-found surfaces.
- User: dashboard, catalog, book detail, loans, requests, notifications,
  profile, and password change.
- Admin: dashboard, users, books, copies, loan list/create/detail, borrowing
  requests, incidents, reports, import workflow, notifications, and settings.
- Data-loading routes now use a visible retryable error state where audited;
  the import route represents its real five-step process: Template, Chọn file,
  Validate, Kết quả, Commit.

## Files Changed

- Foundation and shell: `frontend/src/App.css`, `frontend/src/index.css`,
  `layouts/UserLayout.tsx`, header and mobile navigation components.
- Shared UI: `frontend/src/components/common/` and `MetricCard.tsx`.
- Route implementations under `frontend/src/pages/public`, `pages/user`, and
  `pages/admin` listed above.
- This report: `FRONTEND_REFACTOR_REPORT.md`.

## Verification

- `npm run build` passes in `frontend`.
- `npm run lint` passes with no warnings.
- Headless visual QA passed for landing at 1440px, 768px, and 390px. The
  390px layout was specifically checked after the hero stack correction.

## Remaining Issues

- Authenticated user/admin data states could not be snapshotted without test
  credentials. Their TypeScript build, lint, shared layout, and state paths
  were verified statically.
- Vite retains a bundle-size warning above 500 kB. Code splitting is a
  performance follow-up outside this frontend visual refactor.
