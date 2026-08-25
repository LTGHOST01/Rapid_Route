# RapidRoute scoring algorithm

## Principle

Google Routes API supplies the candidates. RapidRoute makes an explainable operational selection. This is policy scoring, not claimed predictive intelligence.

## Inputs and normalization

For each candidate `r`, derive 0–100 penalties within the candidates returned for the current request:

- `E(r)`: ETA penalty = `(eta - minimumEta) / max(maximumEta - minimumEta, 180s) × 100` when two or more candidates exist. A single candidate is scored against a 10-minute urban baseline so a long lone route is not a free zero.
- `D(r)`: distance penalty using the same min/max formula with a 500 m floor; a single candidate uses a 5 km baseline.
- `T(r)`: traffic penalty: low 20, medium 55, high 85; derive from Google traffic/advisory data when requested, otherwise label as unavailable and use 50.
- `R(r)`: road-status penalty: clear 0, advisory 25, congested 60, blocked 100. It reflects active RapidRoute road reports that intersect/tag the candidate.

## Formula

For an eligible candidate:

`score = 0.45E + 0.15D + 0.25T + 0.15R`

Lowest score wins. Store component values, weights, road report IDs, and plain-language reasons with the selection so a dispatcher can understand it.

Emergency priority changes the *weights*, not traffic laws or Google’s route geometry:

| Priority | ETA | Distance | Traffic | Road status |
|---|---:|---:|---:|---:|
| CRITICAL — TIME FIRST | 0.55 | 0.10 | 0.20 | 0.15 |
| HIGH (same as CRITICAL) | 0.55 | 0.10 | 0.20 | 0.15 |
| NORMAL (STANDARD) | 0.35 | 0.20 | 0.25 | 0.20 |

Weights total 1.0. Critical events favor speed, but a non-blocked safety concern still affects the choice.

## Blocked-road rule

If an active `BLOCKED` RoadCondition intersects or is manually linked to a candidate corridor, mark that candidate `blocked=true`, display **Not eligible — blocked road**, and exclude it before scoring. If every candidate is blocked, do not pretend a route is safe: show “no eligible route,” request operator review, and retain the evidence. For the hackathon, road-to-route matching may use an admin-selected affected segment/corridor; clearly state this is simulated local-condition input.

## Example

Critical incident. Candidate A: 600 s, 8 km, high traffic, clear. Candidate B: 660 s, 7 km, medium traffic, clear. Span is floored at 180 s, so A has `E=0,D=100,T=85,R=0`; B has `E=33.33,D=0,T=55,R=0`.

`A = .55(0)+.10(100)+.20(85)+.15(0)=27.0`

`B = .55(33.33)+.10(0)+.20(55)+.15(0)=29.33`

A is recommended despite congestion because it is materially faster for a critical event. If A is blocked, it is excluded and B wins if eligible.

## Rerouting logic

Trigger on a new/changed road condition affecting the selected route, a provider refresh interval (for demo, manual button or every 60 seconds), or dispatcher request. Re-query Google from the vehicle’s current simulated location to the destination, re-tag road conditions, score, and compare against the current route. Adopt a new route only if current becomes blocked or the new eligible score improves by at least 10 points / ETA by at least 60 seconds. Create `REROUTE_TRIGGERED`, `ROUTE_RECALCULATED`, and `REROUTED` events with old/new ETA and reason. This avoids noisy route flipping.
