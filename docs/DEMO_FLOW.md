# Demo flow (4–5 minutes)

## Prepare

Seed three available ambulances and two preset local road conditions. Verify Maps/Routes keys; also keep the offline demo fixture ready. Start at the dispatcher dashboard with system status visible.

## Script

1. **Incident (30s):** Create a Critical emergency with origin, hospital destination, and concise notes. State that Google supplies real road candidates/ETA/geometry.
2. **Vehicle (30s):** Show available vehicles and assign the recommended compatible/nearby ambulance. This is the dispatch decision layer.
3. **Routes (60s):** Calculate candidates. Show their ETA, distance, traffic, road condition, and RapidRoute score. Explain one chosen route in a sentence.
4. **Dispatch (30s):** Start the journey; vehicle marker moves along the selected Google route. Open the event timeline.
5. **Disruption (60s):** Admin/simulator marks a corridor blocked or congested. The old candidate becomes ineligible if blocked; RapidRoute requests fresh Google candidates from current position, scores them, and shows old/new ETA plus reason.
6. **Close (30s):** Show the reroute record and dispatch log. If provider is unavailable, activate clearly labelled Demo Mode and say the map/routing provider data is simulated for resilience.

## Key lines

- “We do not replace Google Maps; we turn Google’s route options into an emergency-dispatch decision with local operational context.”
- “A blocked road is a hard safety rule, never a trade-off in the score.”
- “Every selection and reroute is stored with its reasons.”

## Avoid claiming

Do not claim live ambulance GPS, traffic-light control, privileged routing, real municipal road feeds, ML prediction, or production emergency-service certification unless actually integrated and authorized.
