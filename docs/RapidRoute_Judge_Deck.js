const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.title = "RapidRoute | RIH-PS-011";
pres.author = "RapidRoute";
pres.subject = "Intelligent Emergency Vehicle Route Management";

const C = {
  bg: "F8F9FA",
  white: "FFFFFF",
  ink: "202124",
  muted: "5F6368",
  line: "DADCE0",
  soft: "EEF1F4",
  red: "D93025",
  green: "188038",
  amber: "E37400",
  nav: "1A73E8",
  navy: "174EA6",
};

const font = "Arial";

function notes(slide, text) {
  slide.addNotes(text);
}

function kicker(slide, text) {
  slide.addText(text, {
    x: 0.55, y: 0.22, w: 8, h: 0.22,
    fontFace: font, fontSize: 11, color: C.muted, bold: true,
    charSpacing: 1.4, margin: 0,
  });
}

function title(slide, text) {
  slide.addText(text, {
    x: 0.55, y: 0.48, w: 12.2, h: 0.5,
    fontFace: font, fontSize: 28, color: C.ink, bold: true, margin: 0,
  });
}

function footer(slide, n) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.28, w: 13.333, h: 0.22, fill: { color: C.soft }, line: { color: C.soft },
  });
  slide.addText("RapidRoute  ·  RIH-PS-011", {
    x: 0.55, y: 7.28, w: 6, h: 0.22,
    fontFace: font, fontSize: 10, color: C.muted, valign: "middle", margin: 0,
  });
  slide.addText(String(n), {
    x: 12.4, y: 7.28, w: 0.5, h: 0.22,
    fontFace: font, fontSize: 10, color: C.muted, align: "right", valign: "middle", margin: 0,
  });
}

function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
}

// --------------------------------------------------------------------------
// SLIDE 1 COVER
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.red }, line: { color: C.red },
  });

  s.addText("RIH-PS-011", {
    x: 0.7, y: 1.35, w: 6, h: 0.28,
    fontFace: font, fontSize: 13, color: C.muted, bold: true, charSpacing: 1.6, margin: 0,
  });
  s.addText("RapidRoute", {
    x: 0.7, y: 1.7, w: 7, h: 0.85,
    fontFace: font, fontSize: 48, color: C.ink, bold: true, margin: 0,
  });
  s.addText("Intelligent Emergency Vehicle Route Management", {
    x: 0.7, y: 2.55, w: 6.6, h: 0.4,
    fontFace: font, fontSize: 16, color: C.muted, margin: 0,
  });
  s.addText("Google shows the roads. RapidRoute decides the dispatch.", {
    x: 0.7, y: 3.2, w: 6.6, h: 0.7,
    fontFace: font, fontSize: 20, color: C.ink, bold: true, margin: 0,
  });
  s.addText("Emergency dispatch decision layer on Google Routes. Mumbai demo.", {
    x: 0.7, y: 6.55, w: 6.6, h: 0.3,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  // Light map panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.05, y: 0.55, w: 4.75, h: 6.4,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.05, y: 0.55, w: 4.75, h: 0.42,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
  });
  s.addText("Dadar  →  KEM Hospital", {
    x: 8.2, y: 0.6, w: 4.45, h: 0.32,
    fontFace: font, fontSize: 12, color: C.ink, bold: true, margin: 0,
  });

  // Grid streets
  for (let i = 0; i < 8; i++) {
    s.addShape(pres.shapes.LINE, {
      x: 8.25, y: 1.25 + i * 0.65, w: 4.35, h: 0,
      line: { color: "E8EAED", width: 1 },
    });
  }
  for (let i = 0; i < 6; i++) {
    s.addShape(pres.shapes.LINE, {
      x: 8.45 + i * 0.72, y: 1.15, w: 0, h: 5.4,
      line: { color: "EEF1F4", width: 1 },
    });
  }

  // Alt route
  s.addShape(pres.shapes.LINE, {
    x: 8.55, y: 2.1, w: 3.7, h: 3.4,
    line: { color: "9AA0A6", width: 3.5 },
  });
  // Recommended route
  s.addShape(pres.shapes.LINE, {
    x: 8.7, y: 2.35, w: 3.35, h: 2.85,
    line: { color: C.nav, width: 5 },
  });

  s.addShape(pres.shapes.OVAL, {
    x: 8.52, y: 2.05, w: 0.28, h: 0.28, fill: { color: C.amber }, line: { color: C.white, width: 1.5 },
  });
  s.addText("AMB-101", {
    x: 8.85, y: 1.95, w: 1.4, h: 0.24,
    fontFace: font, fontSize: 10, color: C.ink, bold: true, margin: 0,
  });
  s.addShape(pres.shapes.OVAL, {
    x: 11.85, y: 5.05, w: 0.32, h: 0.32, fill: { color: C.red }, line: { color: C.white, width: 1.5 },
  });
  s.addText("H", {
    x: 11.85, y: 5.06, w: 0.32, h: 0.3,
    fontFace: font, fontSize: 11, color: C.white, bold: true, align: "center", margin: 0,
  });
  s.addText("Route A recommended", {
    x: 8.25, y: 6.45, w: 4.35, h: 0.28,
    fontFace: font, fontSize: 11, color: C.nav, bold: true, margin: 0,
  });

  notes(s, [
    "Open with the one-line pitch. Pause after the positioning line.",
    "Say: Google shows possible roads. RapidRoute is the dispatch brain.",
    "It picks an available ambulance, scores the routes, blocks unsafe roads, and writes down why.",
    "Do not claim we built GPS or Google Maps. This is a control-room product on top of Google Routes.",
    "Demo city is Mumbai. Next slide is the operational problem.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 2 PROBLEM
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "THE OPERATIONAL GAP");
  title(s, "Every second matters.");

  const items = [
    ["Right unit", "Dispatchers need the available, compatible ambulance, not the nearest pin on a consumer map."],
    ["Right route", "Emergency vehicles need the right route, not simply any route Google happens to list first."],
    ["Conditions change", "Traffic can shift. A corridor can become unsafe or unavailable mid-journey."],
    ["Must be explainable", "A control room needs a written reason, not a black-box suggestion."],
  ];
  items.forEach((row, i) => {
    const x = 0.55 + (i % 2) * 4.15;
    const y = 1.3 + Math.floor(i / 2) * 1.55;
    card(s, x, y, 3.95, 1.4);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.08, h: 1.4, fill: { color: i === 2 ? C.red : C.nav }, line: { color: i === 2 ? C.red : C.nav },
    });
    s.addText(row[0], {
      x: x + 0.25, y: y + 0.18, w: 3.5, h: 0.32,
      fontFace: font, fontSize: 16, color: C.ink, bold: true, margin: 0,
    });
    s.addText(row[1], {
      x: x + 0.25, y: y + 0.55, w: 3.5, h: 0.7,
      fontFace: font, fontSize: 13, color: C.muted, margin: 0,
    });
  });

  // Journey strip
  card(s, 8.85, 1.3, 3.95, 4.5);
  s.addText("What can break a run", {
    x: 9.05, y: 1.48, w: 3.55, h: 0.3,
    fontFace: font, fontSize: 13, color: C.muted, bold: true, margin: 0,
  });
  const chain = [
    ["1", "Ambulance assigned", C.nav],
    ["2", "Live traffic on the corridor", C.amber],
    ["3", "Road becomes blocked", C.red],
    ["4", "Hospital still waiting", C.green],
  ];
  chain.forEach((row, i) => {
    const y = 2.0 + i * 0.85;
    s.addShape(pres.shapes.OVAL, {
      x: 9.15, y, w: 0.38, h: 0.38, fill: { color: row[2] }, line: { color: row[2] },
    });
    s.addText(row[0], {
      x: 9.15, y, w: 0.38, h: 0.38,
      fontFace: font, fontSize: 13, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
    });
    s.addText(row[1], {
      x: 9.65, y, w: 2.9, h: 0.38,
      fontFace: font, fontSize: 14, color: C.ink, valign: "middle", margin: 0,
    });
    if (i < 3) {
      s.addShape(pres.shapes.LINE, {
        x: 9.33, y: y + 0.38, w: 0, h: 0.47,
        line: { color: C.line, width: 1.5 },
      });
    }
  });

  footer(s, 2);
  notes(s, [
    "Do not invent death statistics. Stay operational.",
    "Consumer navigation picks a path. A dispatcher also needs: which unit, what if the road closes, and why we chose it.",
    "Point to the right-hand chain: unit, traffic, blockage, hospital.",
    "Set up the next slide: RapidRoute is the missing decision layer.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 3 SOLUTION
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "THE PRODUCT");
  title(s, "Meet RapidRoute");

  s.addText("Google provides the road alternatives. RapidRoute decides which one should be used.", {
    x: 0.55, y: 1.15, w: 12.2, h: 0.35,
    fontFace: font, fontSize: 16, color: C.muted, margin: 0,
  });

  const layers = [
    { y: 1.7, label: "DISPATCHER", sub: "Creates the incident. Assigns a unit. Starts the journey.", fill: C.white, ink: C.ink },
    { y: 2.85, label: "RAPIDROUTE", sub: "", fill: C.white, ink: C.ink },
    { y: 5.55, label: "GOOGLE ROUTES", sub: "Real geometry, ETA, alternatives, traffic-aware times.", fill: C.white, ink: C.ink },
  ];
  layers.forEach((L) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y: L.y, w: 12.2, h: L.label === "RAPIDROUTE" ? 2.35 : 0.85,
      fill: { color: L.fill }, line: { color: C.line, width: 1 },
    });
    s.addText(L.label, {
      x: 0.75, y: L.y + 0.1, w: 11.8, h: 0.28,
      fontFace: font, fontSize: 13, color: L.ink, bold: true, charSpacing: 1.2, margin: 0,
    });
    if (L.sub) {
      s.addText(L.sub, {
        x: 0.75, y: L.y + 0.4, w: 11.8, h: 0.32,
        fontFace: font, fontSize: 14, color: L.label === "RAPIDROUTE" ? "E8EAED" : C.muted, margin: 0,
      });
    }
  });

  const caps = [
    ["Unit assignment", "Free, compatible ambulance"],
    ["Route scoring", "ETA, distance, traffic, road"],
    ["Road status", "Clear, congested, blocked"],
    ["Priority weights", "Critical favours time"],
    ["Rerouting", "Only if it actually helps"],
    ["Decision log", "Why this route"],
  ];
  caps.forEach((c, i) => {
    const x = 0.75 + (i % 6) * 2.0;
    const y = 3.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 1.9, h: 1.65,
      fill: { color: C.white }, line: { color: "5F6368", width: 1 },
    });
    s.addText(c[0], {
      x: x + 0.08, y: y + 0.28, w: 1.74, h: 0.7,
      fontFace: font, fontSize: 13, color: C.ink, bold: true, margin: 0,
    });
    s.addText(c[1], {
      x: x + 0.08, y: y + 1.0, w: 1.74, h: 0.5,
      fontFace: font, fontSize: 11, color: "5F6368", margin: 0,
    });
  });

  footer(s, 3);
  notes(s, [
    "This is not Google Maps with a new skin. It is not a new GPS.",
    "Walk top to bottom: dispatcher, RapidRoute capabilities, Google Routes.",
    "Admin-only: vehicles, road reports, live block, four evaluator scenarios.",
    "Dispatcher cannot block roads. A road closure is an operations decision.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 4 COMPARISON
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "THE QUESTION JUDGES ASK");
  title(s, "Google gives us routes. We make the decision.");

  card(s, 0.55, 1.3, 6.0, 5.55);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 1.3, w: 6.0, h: 0.55, fill: { color: C.nav }, line: { color: C.nav },
  });
  s.addText("GOOGLE", {
    x: 0.75, y: 1.4, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 16, color: C.white, bold: true, margin: 0,
  });
  const g = [
    "Map tiles the operator sees",
    "Real road geometry (the line)",
    "Travel time (ETA)",
    "Alternative routes",
    "Traffic-aware times when configured",
  ];
  g.forEach((t, i) => {
    s.addText(t, {
      x: 0.85, y: 2.1 + i * 0.72, w: 5.4, h: 0.5,
      fontFace: font, fontSize: 16, color: C.ink, valign: "middle", margin: 0,
    });
  });

  card(s, 6.8, 1.3, 6.0, 5.55);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.8, y: 1.3, w: 6.0, h: 0.55, fill: { color: C.ink }, line: { color: C.ink },
  });
  s.addText("RAPIDROUTE", {
    x: 7.0, y: 1.4, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 16, color: C.white, bold: true, margin: 0,
  });
  const r = [
    "Login roles: dispatcher and admin",
    "Which ambulance is free and compatible",
    "Priority-weighted route scoring",
    "Local road reports; blocked = removed",
    "Reroute plus a written Why this route",
  ];
  r.forEach((t, i) => {
    s.addText(t, {
      x: 7.1, y: 2.1 + i * 0.72, w: 5.4, h: 0.5,
      fontFace: font, fontSize: 16, color: C.ink, valign: "middle", margin: 0,
    });
  });

  footer(s, 4);
  notes(s, [
    "If they ask 'Isn't this just Google Maps?' stay on this slide.",
    "Analogy: Google is the road atlas. RapidRoute is the control-room officer who chooses the unit and the path, then writes it in the log.",
    "Google does not assign an ambulance. Google does not know our operational corridor is closed.",
    "Traffic times: Google when keys work. Admin 'block this road' is our input, labelled DEMO SIMULATION. Not a municipal feed.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 5 FLOW
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "OPERATOR FLOW");
  title(s, "From emergency to dispatch in seconds");

  const steps = [
    ["1", "Create\nincident"],
    ["2", "Origin +\nhospital"],
    ["3", "Assign\navailable unit"],
    ["4", "Calculate\nGoogle routes"],
    ["5", "Score\nalternatives"],
    ["6", "Start\njourney"],
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 2.12;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 1.95, h: 1.7,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    s.addText(st[0], {
      x, y: 1.45, w: 1.95, h: 0.4,
      fontFace: font, fontSize: 20, color: C.nav, bold: true, align: "center", margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.08, y: 1.9, w: 1.79, h: 0.95,
      fontFace: font, fontSize: 14, color: C.ink, align: "center", margin: 0,
    });
    if (i < 5) {
      s.addShape(pres.shapes.RIGHT_ARROW, {
        x: x + 1.96, y: 2.0, w: 0.16, h: 0.22,
        fill: { color: C.line }, line: { color: C.line },
      });
    }
  });

  s.addText("If the road closes after dispatch", {
    x: 0.55, y: 3.3, w: 12, h: 0.32,
    fontFace: font, fontSize: 14, color: C.muted, bold: true, margin: 0,
  });

  const after = [
    ["Road blocked", C.red, C.white],
    ["Ask Google again\nfrom current point", C.white, C.ink],
    ["Remove blocked\ncandidate", C.white, C.ink],
    ["Adopt a clear\nalternative if one exists", C.green, C.white],
  ];
  after.forEach((a, i) => {
    const x = 0.55 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 3.75, w: 3.0, h: 1.55,
      fill: { color: a[1] },
      line: { color: a[1] === C.white ? C.line : a[1], width: 1 },
    });
    s.addText(a[0], {
      x: x + 0.12, y: 4.05, w: 2.76, h: 1.05,
      fontFace: font, fontSize: 16, color: a[2], bold: true, margin: 0,
    });
  });

  s.addText("Reroute only if the current path is blocked, or the new path is clearly better (about 10 score points or 60 seconds).", {
    x: 0.55, y: 5.55, w: 12.2, h: 0.4,
    fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });
  s.addText("The moving marker is a simulation along Google's line. It is not live van GPS. Official trip time stays at dispatch unless we reroute.", {
    x: 0.55, y: 5.95, w: 12.2, h: 0.45,
    fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  footer(s, 5);
  notes(s, [
    "Walk 1 to 6 quickly. This is the dispatcher path.",
    "Calculate routes: backend calls Google Routes API. Google returns 2 to 3 real paths.",
    "Lowest penalty is recommended. Screen shows Why this route.",
    "Admin blocks the current route. We re-query Google from the vehicle's current simulated position.",
    "Say clearly: movement is animation. Duration does not collapse because we animate.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 6 SCORING
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "DECISION ENGINE");
  title(s, "How RapidRoute chooses a route");

  s.addText("Google returns 2 to 3 candidates. We do not invent new roads.", {
    x: 0.55, y: 1.15, w: 12.2, h: 0.3,
    fontFace: font, fontSize: 15, color: C.muted, margin: 0,
  });

  const factors = [
    ["ETA", "Slower than the fastest option raises the penalty"],
    ["Distance", "Compared across the same request"],
    ["Traffic", "Low / medium / high from the provider"],
    ["Road status", "Our reports: clear, congested, blocked"],
  ];
  factors.forEach((f, i) => {
    const x = 0.55 + i * 3.15;
    card(s, x, 1.55, 3.0, 1.35);
    s.addText(f[0], {
      x: x + 0.15, y: 1.68, w: 2.7, h: 0.32,
      fontFace: font, fontSize: 16, color: C.ink, bold: true, margin: 0,
    });
    s.addText(f[1], {
      x: x + 0.15, y: 2.05, w: 2.7, h: 0.7,
      fontFace: font, fontSize: 13, color: C.muted, margin: 0,
    });
  });

  card(s, 0.55, 3.1, 6.3, 3.7);
  s.addText("Penalty, then weights", {
    x: 0.75, y: 3.25, w: 5.9, h: 0.3,
    fontFace: font, fontSize: 14, color: C.muted, bold: true, margin: 0,
  });
  s.addText("score  =  weighted mix of\nETA + Distance + Traffic + Road", {
    x: 0.75, y: 3.6, w: 5.9, h: 0.75,
    fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
  });
  s.addText("LOWEST penalty wins.\nBLOCKED is not scored. It is removed.\nIf every corridor is blocked: no suitable route.", {
    x: 0.75, y: 4.45, w: 5.9, h: 1.15,
    fontFace: font, fontSize: 15, color: C.ink, margin: 0,
  });
  s.addText("Critical incidents weight time at 0.55. A standard job leans more on distance and road status.", {
    x: 0.75, y: 5.7, w: 5.9, h: 0.85,
    fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  card(s, 7.05, 3.1, 5.75, 3.7);
  s.addText("Spoken example (critical)", {
    x: 7.25, y: 3.25, w: 5.35, h: 0.3,
    fontFace: font, fontSize: 14, color: C.muted, bold: true, margin: 0,
  });

  // Route A bar
  s.addText("Route A   10 min   heavy traffic   CLEAR", {
    x: 7.25, y: 3.7, w: 5.35, h: 0.28,
    fontFace: font, fontSize: 13, color: C.ink, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.25, y: 4.05, w: 4.6, h: 0.32, fill: { color: C.nav }, line: { color: C.nav },
  });
  s.addText("Selected", {
    x: 11.95, y: 4.05, w: 0.7, h: 0.32,
    fontFace: font, fontSize: 11, color: C.nav, bold: true, valign: "middle", margin: 0,
  });

  s.addText("Route B   11 min   clearer   CLEAR", {
    x: 7.25, y: 4.55, w: 5.35, h: 0.28,
    fontFace: font, fontSize: 13, color: C.ink, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.25, y: 4.9, w: 4.0, h: 0.32, fill: { color: C.soft }, line: { color: C.line },
  });

  s.addText("Time matters most on a critical job, so A still wins if it is not blocked. If A is blocked, A is thrown out and B wins.", {
    x: 7.25, y: 5.4, w: 5.35, h: 1.15,
    fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  footer(s, 6);
  notes(s, [
    "This is the technical heart. Scoring is a published weighted formula, not a trained model.",
    "On screen, quality is shown as 100 minus penalty so a higher ring looks better.",
    "Example: two routes to KEM. A is 10 minutes, heavy traffic. B is 11 minutes, clearer. Critical still takes A if A is open.",
    "Hard rule first: blocked means ineligible. Score is not used on that candidate.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 7 DIFFERENTIATOR
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "CORE DEMO MOMENT");
  title(s, "Blocking a road changes the decision.");

  s.addText("BEFORE", {
    x: 0.55, y: 1.2, w: 5.9, h: 0.3,
    fontFace: font, fontSize: 13, color: C.muted, bold: true, charSpacing: 1.4, margin: 0,
  });
  s.addText("AFTER ADMIN BLOCK", {
    x: 6.9, y: 1.2, w: 5.9, h: 0.3,
    fontFace: font, fontSize: 13, color: C.red, bold: true, charSpacing: 1.4, margin: 0,
  });

  card(s, 0.55, 1.55, 5.9, 5.25);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.85, w: 5.4, h: 2.05,
    fill: { color: "E8F0FE" }, line: { color: C.nav, width: 1.25 },
  });
  s.addText("Route A", {
    x: 1.0, y: 2.0, w: 3.2, h: 0.32, fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
  });
  s.addText("RECOMMENDED", {
    x: 4.15, y: 2.02, w: 1.9, h: 0.28, fontFace: font, fontSize: 11, color: C.nav, bold: true, align: "right", margin: 0,
  });
  s.addText("10 min   ·   CLEAR", {
    x: 1.0, y: 2.4, w: 5.0, h: 0.3, fontFace: font, fontSize: 16, color: C.ink, margin: 0,
  });
  s.addText("Eligible. Lowest penalty on this request.", {
    x: 1.0, y: 2.85, w: 5.0, h: 0.7, fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 4.15, w: 5.4, h: 2.25,
    fill: { color: C.white }, line: { color: C.line, width: 1 },
  });
  s.addText("Route B", {
    x: 1.0, y: 4.35, w: 5.0, h: 0.32, fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
  });
  s.addText("12 min   ·   CLEAR", {
    x: 1.0, y: 4.75, w: 5.0, h: 0.3, fontFace: font, fontSize: 16, color: C.ink, margin: 0,
  });
  s.addText("Alternative. Still eligible.", {
    x: 1.0, y: 5.2, w: 5.0, h: 0.7, fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  card(s, 6.9, 1.55, 5.9, 5.25);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.15, y: 1.85, w: 5.4, h: 2.05,
    fill: { color: "FCE8E6" }, line: { color: C.red, width: 1.25 },
  });
  s.addText("Route A", {
    x: 7.35, y: 2.0, w: 3.2, h: 0.32, fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
  });
  s.addText("REMOVED", {
    x: 10.4, y: 2.02, w: 1.95, h: 0.28, fontFace: font, fontSize: 11, color: C.red, bold: true, align: "right", margin: 0,
  });
  s.addText("BLOCKED", {
    x: 7.35, y: 2.4, w: 5.0, h: 0.3, fontFace: font, fontSize: 16, color: C.red, bold: true, margin: 0,
  });
  s.addText("Not scored. Hard safety rule.", {
    x: 7.35, y: 2.85, w: 5.0, h: 0.7, fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.15, y: 4.15, w: 5.4, h: 2.25,
    fill: { color: "E6F4EA" }, line: { color: C.green, width: 1.25 },
  });
  s.addText("Route B", {
    x: 7.35, y: 4.35, w: 3.2, h: 0.32, fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
  });
  s.addText("ADOPTED", {
    x: 10.4, y: 4.37, w: 1.95, h: 0.28, fontFace: font, fontSize: 11, color: C.green, bold: true, align: "right", margin: 0,
  });
  s.addText("12 min   ·   CLEAR", {
    x: 7.35, y: 4.75, w: 5.0, h: 0.3, fontFace: font, fontSize: 16, color: C.ink, margin: 0,
  });
  s.addText("Only eligible path left. Recalculated from the current point.", {
    x: 7.35, y: 5.2, w: 5.0, h: 0.85, fontFace: font, fontSize: 14, color: C.muted, margin: 0,
  });

  footer(s, 7);
  notes(s, [
    "This is the slide you leave up while the admin clicks Block current route.",
    "Admin only. Current path blocked. Ask Google again from where the vehicle is.",
    "If another path is clear, we adopt it. If none remain, we say no suitable route.",
    "Demo blockage is labelled DEMO SIMULATION. Do not call it a city live feed.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 8 DEMO TIMELINE
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "LIVE RUN");
  title(s, "Watch RapidRoute react");

  const left = [
    "Emergency created",
    "Compatible unit assigned",
    "Google routes calculated",
    "Best eligible route selected",
    "Journey starts (simulated motion)",
  ];
  const right = [
    "Admin marks current road blocked",
    "Routes recalculated from here",
    "Blocked candidate removed",
    "Clear alternative adopted",
    "Reason stored in the event log",
  ];

  card(s, 0.55, 1.25, 6.0, 4.55);
  s.addText("DISPATCH", {
    x: 0.75, y: 1.4, w: 5.6, h: 0.28,
    fontFace: font, fontSize: 12, color: C.muted, bold: true, charSpacing: 1.3, margin: 0,
  });
  left.forEach((t, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 0.8, y: 1.9 + i * 0.7, w: 0.28, h: 0.28, fill: { color: C.nav }, line: { color: C.nav },
    });
    s.addText(String(i + 1), {
      x: 0.8, y: 1.9 + i * 0.7, w: 0.28, h: 0.28,
      fontFace: font, fontSize: 11, color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(t, {
      x: 1.25, y: 1.88 + i * 0.7, w: 5.05, h: 0.35,
      fontFace: font, fontSize: 16, color: C.ink, valign: "middle", margin: 0,
    });
  });

  card(s, 6.8, 1.25, 6.0, 4.55);
  s.addText("REROUTE", {
    x: 7.0, y: 1.4, w: 5.6, h: 0.28,
    fontFace: font, fontSize: 12, color: C.red, bold: true, charSpacing: 1.3, margin: 0,
  });
  right.forEach((t, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 7.05, y: 1.9 + i * 0.7, w: 0.28, h: 0.28,
      fill: { color: i === 0 ? C.red : C.ink },
      line: { color: i === 0 ? C.red : C.ink },
    });
    s.addText(String(i + 1), {
      x: 7.05, y: 1.9 + i * 0.7, w: 0.28, h: 0.28,
      fontFace: font, fontSize: 11, color: C.white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(t, {
      x: 7.5, y: 1.88 + i * 0.7, w: 5.05, h: 0.35,
      fontFace: font, fontSize: 16, color: C.ink, valign: "middle", margin: 0,
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 6.0, w: 12.25, h: 0.9,
    fill: { color: C.ink }, line: { color: C.ink },
  });
  s.addText("RapidRoute does not simply redraw the route. It changes the decision.", {
    x: 0.75, y: 6.15, w: 11.85, h: 0.6,
    fontFace: font, fontSize: 18, color: C.white, bold: true, valign: "middle", margin: 0,
  });

  footer(s, 8);
  notes(s, [
    "Use this as the live-demo script card.",
    "Left column: stay as dispatcher. Mumbai demo or Dadar to KEM. Assign. Calculate. Start.",
    "Right column: logout, admin, Evaluator, Block current route.",
    "Then Run all 4 scenarios. All should Pass.",
    "Accounts: dispatcher@rapidroute.local / RapidRoute!dispatch and admin@rapidroute.local / RapidRoute!admin.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 9 ARCHITECTURE
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "SYSTEM");
  title(s, "Under the hood");

  const cols = [
    {
      t: "FRONTEND",
      items: ["React + TypeScript", "Vite", "Tailwind CSS", "Google Maps JS API", "Map tiles and pins only"],
    },
    {
      t: "BACKEND",
      items: ["Express + TypeScript", "JWT login", "Dispatch + scoring", "Road reports", "Zod input checks"],
    },
    {
      t: "DATABASE",
      items: ["PostgreSQL", "Prisma", "Incidents", "Routes and events", "Fleet state"],
    },
    {
      t: "GOOGLE ROUTES",
      items: ["Server-only call", "Real alternatives", "ETA and geometry", "Traffic-aware times", "Never from the browser"],
    },
  ];
  cols.forEach((col, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.25, 3.05, 3.85);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.25, w: 3.05, h: 0.48,
      fill: { color: i === 3 ? C.nav : C.ink },
      line: { color: i === 3 ? C.nav : C.ink },
    });
    s.addText(col.t, {
      x: x + 0.12, y: 1.33, w: 2.8, h: 0.32,
      fontFace: font, fontSize: 13, color: C.white, bold: true, margin: 0,
    });
    col.items.forEach((item, j) => {
      s.addText(item, {
        x: x + 0.15, y: 1.9 + j * 0.55, w: 2.75, h: 0.45,
        fontFace: font, fontSize: 14, color: C.ink, valign: "middle", margin: 0,
      });
    });
  });

  card(s, 0.55, 5.3, 12.25, 1.55);
  s.addText("Two keys. Two jobs.", {
    x: 0.75, y: 5.42, w: 12, h: 0.28,
    fontFace: font, fontSize: 14, color: C.muted, bold: true, margin: 0,
  });
  s.addText("Browser key draws the map. Server key calls Routes API. The frontend never calls Google Routes. Keys are not on GitHub.", {
    x: 0.75, y: 5.78, w: 12, h: 0.8,
    fontFace: font, fontSize: 16, color: C.ink, margin: 0,
  });

  footer(s, 9);
  notes(s, [
    "Browser (React) talks to our Express API. Express talks to PostgreSQL. Express talks to Google Routes when configured.",
    "If Google is down we show labelled DEMO SIMULATION fixtures. We never pretend those are live Google.",
    "The moving ambulance is a simulation along Google's polyline.",
    "Do not mention extra microservices. This is a website, an API, and a database.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 10 RELIABILITY
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "TRUST");
  title(s, "Designed for controlled decisions");

  const boxes = [
    { h: "BLOCKED", b: "That candidate is removed before scoring. It is never a trade-off in the formula.", c: C.red },
    { h: "NO SUITABLE ROUTE", b: "If every corridor is blocked we say so. We do not invent a safe path.", c: C.ink },
    { h: "GOOGLE UNAVAILABLE", b: "DEMO SIMULATION fixtures, clearly labelled. Scoring still runs the same way.", c: C.amber },
    { h: "NOT A BLACK BOX", b: "Published weights. Why this route on screen. No trained model.", c: C.green },
  ];
  boxes.forEach((b, i) => {
    const x = 0.55 + (i % 2) * 6.35;
    const y = 1.3 + Math.floor(i / 2) * 2.55;
    card(s, x, y, 6.15, 2.35);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.1, h: 2.35, fill: { color: b.c }, line: { color: b.c },
    });
    s.addText(b.h, {
      x: x + 0.35, y: y + 0.28, w: 5.55, h: 0.4,
      fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
    });
    s.addText(b.b, {
      x: x + 0.35, y: y + 0.85, w: 5.55, h: 1.2,
      fontFace: font, fontSize: 16, color: C.muted, margin: 0,
    });
  });

  footer(s, 10);
  notes(s, [
    "Build trust. Say what we do not claim.",
    "Admin blockage is our operational input, labelled DEMO SIMULATION. Not a municipal live feed.",
    "We did not train an AI model. Formula is auditable on purpose.",
    "We did not create Google's road network. We did not create GPS.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 11 EVALUATION
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, "EVALUATOR");
  title(s, "Can the decision engine handle changing conditions?");

  s.addText("Isolated scoring checks on a fixed CSV / JSON schema. Not live GPS.", {
    x: 0.55, y: 1.15, w: 12.2, h: 0.3,
    fontFace: font, fontSize: 15, color: C.muted, margin: 0,
  });

  const sc = [
    { n: "01", t: "Low traffic", d: "Several clear corridors. Pick the fastest low-traffic one." },
    { n: "02", t: "Heavy traffic", d: "Primary corridor is congested. Skip it. Take a clearer one." },
    { n: "03", t: "Road blockage", d: "First corridor blocked, so ineligible. Keep an alternative." },
    { n: "04", t: "Unreachable", d: "Every corridor blocked. Report no suitable route, with the required message." },
  ];
  sc.forEach((c, i) => {
    const x = 0.55 + (i % 2) * 6.35;
    const y = 1.6 + Math.floor(i / 2) * 2.4;
    card(s, x, y, 6.15, 2.2);
    s.addText(c.n, {
      x: x + 0.25, y: y + 0.25, w: 1.1, h: 0.4,
      fontFace: font, fontSize: 20, color: C.nav, bold: true, margin: 0,
    });
    s.addText(c.t, {
      x: x + 1.4, y: y + 0.3, w: 4.45, h: 0.35,
      fontFace: font, fontSize: 18, color: C.ink, bold: true, margin: 0,
    });
    s.addText(c.d, {
      x: x + 0.25, y: y + 0.9, w: 5.65, h: 1.0,
      fontFace: font, fontSize: 15, color: C.muted, margin: 0,
    });
  });

  footer(s, 11);
  notes(s, [
    "Admin, Evaluator, Run all 4 scenarios. All four should say Pass.",
    "Read the unreachable message aloud: No suitable route available. The destination cannot currently be reached through the available routes.",
    "These are scoring tests, not operational incidents and not live GPS.",
  ].join("\n"));
}

// --------------------------------------------------------------------------
// SLIDE 12 CLOSE
// --------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.red }, line: { color: C.red },
  });

  s.addText("NOW  /  NEXT", {
    x: 0.7, y: 0.4, w: 12, h: 0.28,
    fontFace: font, fontSize: 12, color: C.muted, bold: true, charSpacing: 1.5, margin: 0,
  });

  const now = [
    "Emergency dispatch",
    "Unit assignment",
    "Route scoring",
    "Road-condition handling",
    "Explainable decisions",
    "Rerouting when it helps",
  ];
  const next = [
    "Real vehicle GPS",
    "Hospital bed availability",
    "Municipal closure feeds",
    "Larger city deployment",
    "Live operational integrations",
    "Scoring stays the same",
  ];

  s.addText("Prototype", {
    x: 0.7, y: 0.8, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 16, color: C.ink, bold: true, margin: 0,
  });
  now.forEach((t, i) => {
    s.addText(t, {
      x: 0.7, y: 1.25 + i * 0.38, w: 5.6, h: 0.35,
      fontFace: font, fontSize: 16, color: C.muted, margin: 0,
    });
  });
  s.addText("If this were operations", {
    x: 7.1, y: 0.8, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 16, color: C.ink, bold: true, margin: 0,
  });
  next.forEach((t, i) => {
    s.addText(t, {
      x: 7.1, y: 1.25 + i * 0.38, w: 5.6, h: 0.35,
      fontFace: font, fontSize: 16, color: C.muted, margin: 0,
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 3.7, w: 12.25, h: 2.85,
    fill: { color: C.ink }, line: { color: C.ink },
  });
  s.addText("Google finds the roads.\nRapidRoute decides how emergency vehicles use them.", {
    x: 0.85, y: 3.95, w: 11.65, h: 1.55,
    fontFace: font, fontSize: 28, color: C.white, bold: true, margin: 0,
  });
  s.addText("RapidRoute   ·   RIH-PS-011   ·   A dispatch decision layer, not a maps replacement.", {
    x: 0.85, y: 5.7, w: 11.65, h: 0.45,
    fontFace: font, fontSize: 14, color: "DADCE0", margin: 0,
  });

  notes(s, [
    "Close with the 30-second line from the Q&A.",
    "RapidRoute does not replace Google. It sits on top of Google Routes, picks a free ambulance, scores the real alternatives, throws out blocked roads, and stores the reason.",
    "If the road closes mid-journey, we recalculate from where the vehicle is and switch only when it actually helps.",
    "Future list is from the Q&A only. Do not invent more.",
    "Stop talking. Offer the live demo.",
  ].join("\n"));
}

pres.writeFile({ fileName: "/home/ghost/projects/MOSSAD/docs/RapidRoute_Judge_Deck.pptx" })
  .then(() => console.log("Wrote RapidRoute_Judge_Deck.pptx"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
