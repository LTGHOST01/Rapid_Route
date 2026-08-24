# Research summary

This is feature research only. RapidRoute will not copy code, UI, data models, branding, or claims from these projects.

| Project | Useful features to learn from | What we should not copy |
|---|---|---|
| [HERO](https://github.com/Data4all-AI/hero) | Google candidate comparison, congestion-on-polyline idea, simulated telemetry, route decision record, reroute alerts | Microsoft Fabric/event-stream complexity, AutoML “siren advantage,” Power BI UI, unsupported time-saved claims |
| [ResQPath](https://github.com/ashwinnm13/ResQPath) | Split frontend/backend, ambulance and incident inputs, patient-priority framing | Opaque ML routing or a model trained without credible local operational data |
| [Ambulance Routing and Dispatch System](https://github.com/nati-s-g/Ambulance-Routing-and-Dispatch-System) | Fleet availability, incident priority, dispatch lifecycle, traffic-aware route display | Any existing portal layout or implementation; overbuilt logistics scope |
| [Green-Corridor](https://github.com/Megharajvsaka/Green-Corridor) | Clear green-corridor narrative, hospital leg as a future workflow | Claiming signal control/bypassing traffic without an authorized signal-system integration |
| [ResQRoute](https://github.com/Tasnim-Saidi/ResQRoute) | Emergency route visualization and user-facing urgency | Generic emergency UI, unverified route intelligence, or a separate road graph |
| [Emergency Routes](https://github.com/JorgeAcin/emergency-routes) | Route-centric application framing and geographical visualization | Reusing code/design or representing a student route demo as production navigation |

## Final RapidRoute feature set

### MUST HAVE

- Dispatcher authentication, incident creation, available-vehicle selection and dispatch.
- Google Routes API candidate request via backend; Google Maps JavaScript map in frontend.
- Explainable candidate scoring: ETA, distance, Google traffic signal, local road status, emergency priority.
- Hard exclusion of blocked candidates, route comparison, recommended route, persisted selection reason.
- Journey start, deterministic vehicle movement simulation, road congestion/blockage simulation, reroute, ETA update, event timeline.
- Admin CRUD for vehicles and road conditions; request/selection logs; demo fallback.

### SHOULD HAVE

- Role guard for dispatcher/admin, destination search/autocomplete if enabled, filters, map legend, audit-friendly export view.
- Lightweight polling for active journeys; Socket.IO only if the team has enough time to prove real-time sync.

### NICE TO HAVE

- Notifications, multiple hospital destinations, saved demo scenarios, simple operations metrics.

### DO NOT BUILD

- A custom road graph or replacement navigation engine.
- ML traffic prediction, siren-speed prediction, IoT/GPS hardware, traffic-light control, blockchain, Kafka, Kubernetes, microservices, native driver app.

## Sources

Repository observations came from the linked public READMEs. Google’s Routes documentation confirms that Compute Routes returns selected fields such as duration, distance, and encoded polylines, and supports alternatives; Maps JavaScript documentation describes its browser key requirement. See the official links in [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md).
