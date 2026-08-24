# Grok frontend brief

## Goal

Design RapidRoute as a premium emergency operations console: calm under pressure, decisive, map-led, and operationally credible. Do not produce a generic SaaS dashboard or a flashy “AI” aesthetic.

## Visual identity

- Palette: charcoal/ink foundation, off-white surfaces, neutral-gray structure; emergency red only for critical/blocked actions, amber for warning/congestion, green for clear/available.
- Typography: a refined modern sans with clear numeric/tabular readability. Use weight, spacing, and hierarchy—not oversized decoration.
- Surfaces: mostly solid, lightly bordered panels; restrained shadow. Avoid purple/blue gradients, neon, excessive rounded cards, glassmorphism, noisy grids, and stock “AI” ornaments.
- Cartography: muted base map; high-contrast but accessible route colors; a persistent legend and unmistakable selected route.

## Layout

Desktop dispatcher dashboard: compact top bar (mission count, system/data-source health, user); narrow left rail (navigation and filters); central map as the dominant workspace; right decision panel (incident, vehicle, route cards, dispatch action); bottom/collapsible event timeline. Avoid hiding the critical route decision below the fold.

## Core screens/components

- Dispatcher dashboard: incident queue, map, active journey card, operational status.
- Emergency creation: plain-language urgency/priority, origin/destination, notes; validation before routing.
- Vehicle selector: availability, call sign, type/capability, distance/status—not a dense table first.
- Route comparison: 2–3 compact cards with ETA, distance, traffic, local road status, score, and a one-sentence “why.” Blocked cards remain visible but disabled.
- Rerouting: an urgent but controlled change banner: old vs new ETA, reason, affected road condition, accept/acknowledge action, and timeline event.
- Admin: practical editable vehicle and road-condition lists/forms; clearly label simulated local reports.

## Motion

Use Framer Motion sparingly: route line draw/reveal after calculation; vehicle marker progress along a selected polyline; subtle card reorder/recommendation emphasis; controlled reroute transition; toast/status fade; page transition. Respect reduced-motion preferences. No perpetual pulses, parallax, or celebratory animation during emergency use.

## Responsive behavior

On tablet/mobile, keep map first, turn right panel into a bottom sheet, make the route comparison horizontally scrollable or stacked, and preserve dispatch/reroute actions as a sticky accessible control. Do not shrink dense desktop panels into unreadable tiles.

## Quality bar

Use real state, not lorem ipsum. Show loading, no-route, blocked-all-routes, provider-fallback, error, and success states. Make color non-exclusive: pair every status color with labels/icons. Treat the map and route recommendation as the product, not decoration.
