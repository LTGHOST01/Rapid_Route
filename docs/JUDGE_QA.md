# Judge Q&A

**Isn't this just Google Maps?**  No. Google provides the road graph, traffic-aware candidate routes, ETA, and geometry. RapidRoute adds emergency creation, vehicle dispatch, local road-condition policy, blocked-route exclusion, explainable selection, journey state, rerouting, and audit history.

**What is your actual innovation?**  A transparent emergency decision layer: it converts general-purpose route options into an accountable operational recommendation using incident priority, fleet availability, local conditions, and a persisted rationale.

**How does your scoring work?**  It normalizes ETA and distance across Google candidates, combines them with traffic and local-road penalties, and changes weights by priority. Lowest eligible score wins; the component scores and reasons are shown to the dispatcher.

**How are blocked roads handled?**  An active local `BLOCKED` report affecting a candidate makes it ineligible before scoring. If all candidates are blocked, the system reports no eligible route and asks for dispatch review instead of inventing a safe route.

**Is your traffic data real?**  When configured, candidate ETA/traffic information is from Google Routes API. Road congestion/blockage in the hackathon demo is a simulated/admin-entered local operational report and is explicitly labelled. We do not claim municipal live feeds.

**What happens if Google API fails?**  The backend times out safely, logs a provider error, and offers a clearly labelled Demo Mode with fixture candidates so the dispatch flow can be demonstrated. It never calls simulated data “live Google traffic.”

**How do you secure the API key?**  Routes API calls occur only on the backend using a secret server key restricted to Routes API. The frontend uses a separate Maps JavaScript key restricted by HTTP referrer and API. Neither real key nor JWT secret is committed.

**How does rerouting work?**  A route-impacting road event, refresh, or dispatcher request triggers a fresh Google route request from current journey position. RapidRoute applies the same hard-block and scoring policy, changes route only for a block or material improvement, and stores the before/after reason and ETA.

**How does this scale?**  The MVP is a modular stateless API backed by PostgreSQL. It can scale horizontally behind a load balancer; rate limits, short-lived caching, queued notifications, and optional WebSockets can be added as real usage warrants. The hackathon version intentionally avoids premature microservices and streaming infrastructure.
