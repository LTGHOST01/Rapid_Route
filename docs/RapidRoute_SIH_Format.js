const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.title = "RapidRoute | SIH Idea Presentation | RIH-PS-011";
pres.author = "RapidRoute";
pres.subject = "SIH idea format: Intelligent Emergency Vehicle Route Management";

const C = {
  bg: "F7F5F2",
  white: "FFFFFF",
  ink: "1A1A1A",
  muted: "4B5563",
  line: "D6D3CD",
  saffron: "E65100",
  navy: "0B3D5C",
  green: "1B5E20",
  red: "B71C1C",
  blue: "1565C0",
};
const font = "Arial";

function footer(slide, n) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.18, w: 13.333, h: 0.32, fill: { color: C.navy }, line: { color: C.navy },
  });
  slide.addText("@SIH Idea submission-Template", {
    x: 0.4, y: 7.18, w: 5.5, h: 0.32,
    fontFace: font, fontSize: 11, color: C.white, valign: "middle", margin: 0,
  });
  slide.addText("RapidRoute", {
    x: 6.2, y: 7.18, w: 5.2, h: 0.32,
    fontFace: font, fontSize: 11, color: C.white, align: "right", valign: "middle", margin: 0,
  });
  slide.addText(String(n), {
    x: 12.5, y: 7.18, w: 0.5, h: 0.32,
    fontFace: font, fontSize: 12, color: C.white, bold: true, align: "right", valign: "middle", margin: 0,
  });
}

function headerBar(slide) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: C.saffron }, line: { color: C.saffron },
  });
}

function notes(slide, text) {
  slide.addNotes(text);
}

function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  });
}

// ============================================================================
// SLIDE 1 TITLE PAGE
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.12, w: 13.333, h: 1.55, fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addText("SMART INDIA HACKATHON", {
    x: 0.5, y: 0.28, w: 12.3, h: 0.4,
    fontFace: font, fontSize: 14, color: "F5CBA7", bold: true, charSpacing: 2, margin: 0,
  });
  s.addText("TITLE PAGE", {
    x: 0.5, y: 0.7, w: 12.3, h: 0.7,
    fontFace: font, fontSize: 36, color: C.white, bold: true, margin: 0,
  });

  const rows = [
    ["Problem Statement ID", "RIH-PS-011"],
    ["Problem Statement Title", "Intelligent Emergency Vehicle Route Management"],
    ["Theme", "Emergency Dispatch / Smart Mobility / Route Optimization"],
    ["PS Category", "Software"],
    ["Team ID", "Fill registered Team ID"],
    ["Team Name", "Fill name registered on the portal"],
  ];
  rows.forEach((r, i) => {
    const y = 1.95 + i * 0.78;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 3.6, h: 0.68,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    s.addText(r[0], {
      x: 0.65, y, w: 3.3, h: 0.68,
      fontFace: font, fontSize: 13, color: C.muted, valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 4.1, y, w: 8.7, h: 0.68,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    s.addText(r[1], {
      x: 4.3, y, w: 8.35, h: 0.68,
      fontFace: font, fontSize: 16, color: C.ink, bold: true, valign: "middle", margin: 0,
    });
  });
  footer(s, 1);
  notes(s, "Fill Team ID and Team Name exactly as registered. Do not invent IDs. This is the official SIH title page.");
}

// ============================================================================
// SLIDE 2 IDEA / SOLUTION
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addText("RapidRoute", {
    x: 0.45, y: 0.28, w: 8, h: 0.42,
    fontFace: font, fontSize: 26, color: C.navy, bold: true, margin: 0,
  });
  s.addText("Proposed Solution  |  How it addresses the problem  |  Innovation", {
    x: 0.45, y: 0.7, w: 12.4, h: 0.28,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  card(s, 0.4, 1.1, 12.5, 1.55);
  s.addText("Proposed solution", {
    x: 0.6, y: 1.2, w: 12.1, h: 0.28,
    fontFace: font, fontSize: 13, color: C.saffron, bold: true, margin: 0,
  });
  s.addText("A web control-room layer on Google Routes. Google returns 2 to 3 real road alternatives. RapidRoute assigns a free compatible unit, scores those alternatives, removes a blocked corridor, and writes why the route was chosen. It is not a new GPS and not Google Maps with a new skin.", {
    x: 0.6, y: 1.5, w: 12.1, h: 1.0,
    fontFace: font, fontSize: 15, color: C.ink, margin: 0,
  });

  card(s, 0.4, 2.8, 6.1, 4.05);
  s.addText("How it addresses the problem", {
    x: 0.6, y: 2.95, w: 5.7, h: 0.32,
    fontFace: font, fontSize: 14, color: C.saffron, bold: true, margin: 0,
  });
  const addr = [
    "Dispatchers need the right unit, not only a consumer route.",
    "Traffic and corridor status can change after dispatch.",
    "A blocked road is removed before scoring, not traded off.",
    "If every corridor is blocked: no suitable route available.",
    "Why this route is shown and stored in the event log.",
  ];
  addr.forEach((t, i) => {
    s.addText((i + 1) + ".  " + t, {
      x: 0.6, y: 3.4 + i * 0.58, w: 5.7, h: 0.52,
      fontFace: font, fontSize: 14, color: C.ink, margin: 0,
    });
  });

  card(s, 6.7, 2.8, 6.2, 4.05);
  s.addText("Innovation and uniqueness", {
    x: 6.9, y: 2.95, w: 5.8, h: 0.32,
    fontFace: font, fontSize: 14, color: C.saffron, bold: true, margin: 0,
  });
  const inn = [
    ["Decision layer", "Google is the atlas. RapidRoute is the officer."],
    ["Hard safety rule", "Blocked = ineligible. Never a score trade-off."],
    ["Published formula", "Weighted penalty. Not a trained AI model."],
    ["Role split", "Only admin can block a live corridor."],
    ["Honest fallback", "If Google is down: labelled DEMO SIMULATION."],
  ];
  inn.forEach((row, i) => {
    s.addText(row[0], {
      x: 6.9, y: 3.38 + i * 0.62, w: 5.8, h: 0.26,
      fontFace: font, fontSize: 14, color: C.navy, bold: true, margin: 0,
    });
    s.addText(row[1], {
      x: 6.9, y: 3.62 + i * 0.62, w: 5.8, h: 0.26,
      fontFace: font, fontSize: 13, color: C.muted, margin: 0,
    });
  });

  footer(s, 2);
  notes(s, "SIH slide 2 pointers: solution, how it addresses, uniqueness. Stay on JUDGE_QA facts. No invented stats.");
}

// ============================================================================
// SLIDE 3 TECHNICAL APPROACH
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addText("TECHNICAL APPROACH", {
    x: 0.45, y: 0.28, w: 12, h: 0.4,
    fontFace: font, fontSize: 24, color: C.navy, bold: true, margin: 0,
  });
  s.addText("Technologies used  |  Methodology and process", {
    x: 0.45, y: 0.7, w: 12, h: 0.25,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  const tech = [
    ["Frontend", "React, TypeScript, Vite, Tailwind CSS, Google Maps JS API"],
    ["Backend", "Express, TypeScript, JWT, Zod, route scoring service"],
    ["Database", "PostgreSQL + Prisma (incidents, routes, events, fleet)"],
    ["Routing", "Google Routes API on the server only"],
    ["Keys", "Browser key = map. Server key = Routes. Not on GitHub."],
  ];
  tech.forEach((t, i) => {
    const y = 1.08 + i * 0.52;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y, w: 2.3, h: 0.46, fill: { color: C.navy }, line: { color: C.navy },
    });
    s.addText(t[0], {
      x: 0.5, y, w: 2.1, h: 0.46,
      fontFace: font, fontSize: 13, color: C.white, bold: true, valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 2.7, y, w: 4.85, h: 0.46, fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    s.addText(t[1], {
      x: 2.85, y, w: 4.55, h: 0.46,
      fontFace: font, fontSize: 12, color: C.ink, valign: "middle", margin: 0,
    });
  });

  // Process flow
  s.addText("Implementation process", {
    x: 7.8, y: 1.05, w: 5.1, h: 0.28,
    fontFace: font, fontSize: 13, color: C.saffron, bold: true, margin: 0,
  });
  const flow = [
    "1  Create incident (origin + hospital)",
    "2  Assign free compatible unit",
    "3  Backend calls Google Routes",
    "4  Score ETA, distance, traffic, road",
    "5  Lowest penalty wins",
    "6  Start journey (simulated motion)",
    "7  If blocked: re-query from here",
    "8  Remove blocked. Adopt clear alt",
  ];
  flow.forEach((t, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.8, y: 1.4 + i * 0.62, w: 5.1, h: 0.56,
      fill: { color: C.white }, line: { color: C.line, width: 1 },
    });
    s.addText(t, {
      x: 7.95, y: 1.4 + i * 0.62, w: 4.8, h: 0.56,
      fontFace: font, fontSize: 13, color: C.ink, valign: "middle", margin: 0,
    });
  });

  footer(s, 3);
  notes(s, "SIH slide 3: technologies + methodology. Frontend never calls Google Routes. Marker motion is a simulation along Google's line.");
}

// ============================================================================
// SLIDE 4 FEASIBILITY
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addText("FEASIBILITY AND VIABILITY", {
    x: 0.45, y: 0.28, w: 12, h: 0.42,
    fontFace: font, fontSize: 24, color: C.navy, bold: true, margin: 0,
  });

  const cols = [
    {
      h: "Feasibility",
      items: [
        "Working prototype: React + Express + PostgreSQL.",
        "Google Routes already returns live candidates when keys work.",
        "Scoring is a formula, so it is testable without a model.",
        "Four evaluator scenarios pass on a fixed CSV/JSON schema.",
        "Demo city (Mumbai) origins and hospitals are searchable.",
      ],
    },
    {
      h: "Challenges and risks",
      items: [
        "Google may return only one corridor.",
        "Provider timeout or quota can fail a live demo.",
        "No real van GPS in this prototype.",
        "Admin blockage is simulated, not a municipal feed.",
        "Two browser tabs used to double-tick the old client clock.",
      ],
    },
    {
      h: "How we handle them",
      items: [
        "If only one Google path: request a via-Sion / Lalbaug alternate.",
        "If Google is down: labelled DEMO SIMULATION fixtures.",
        "Motion is animation. Official ETA stays until reroute.",
        "Block is admin-only and labelled DEMO SIMULATION.",
        "Server-side journey ticks. Browser listens. Mute for the room.",
      ],
    },
  ];
  cols.forEach((col, i) => {
    const x = 0.4 + i * 4.3;
    card(s, x, 0.95, 4.15, 5.95);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.95, w: 4.15, h: 0.5, fill: { color: i === 1 ? C.saffron : C.navy }, line: { color: i === 1 ? C.saffron : C.navy },
    });
    s.addText(col.h, {
      x: x + 0.15, y: 1.02, w: 3.85, h: 0.36,
      fontFace: font, fontSize: 15, color: C.white, bold: true, margin: 0,
    });
    col.items.forEach((t, j) => {
      s.addText((j + 1) + ".  " + t, {
        x: x + 0.18, y: 1.65 + j * 0.95, w: 3.8, h: 0.88,
        fontFace: font, fontSize: 13, color: C.ink, margin: 0,
      });
    });
  });

  footer(s, 4);
  notes(s, "SIH slide 4: feasibility, risks, mitigation. Only facts we implemented. Do not claim municipal feeds or live GPS.");
}

// ============================================================================
// SLIDE 5 IMPACT
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addText("IMPACT AND BENEFITS", {
    x: 0.45, y: 0.28, w: 12, h: 0.42,
    fontFace: font, fontSize: 24, color: C.navy, bold: true, margin: 0,
  });
  s.addText("Potential impact on the target audience  |  Benefits of the solution", {
    x: 0.45, y: 0.72, w: 12, h: 0.25,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  const who = [
    { t: "Dispatchers", d: "Assign a free compatible unit. See scored Google alternatives. Read Why this route." },
    { t: "Operations / admin", d: "Block or clear a live corridor. Run the four evaluator scenarios. Manage fleet." },
    { t: "Patients / scene", d: "A blocked road is not used. If nothing is open, the system says so instead of inventing a path." },
  ];
  who.forEach((w, i) => {
    const x = 0.4 + i * 4.3;
    card(s, x, 1.15, 4.15, 2.15);
    s.addText(w.t, {
      x: x + 0.18, y: 1.3, w: 3.8, h: 0.35,
      fontFace: font, fontSize: 16, color: C.navy, bold: true, margin: 0,
    });
    s.addText(w.d, {
      x: x + 0.18, y: 1.75, w: 3.8, h: 1.35,
      fontFace: font, fontSize: 14, color: C.ink, margin: 0,
    });
  });

  const bens = [
    ["Social", "Safer operational choice: blocked corridors are excluded before scoring."],
    ["Operational", "One logged reason for every select and reroute. Roles stop a dispatcher from closing a road."],
    ["Economic", "Uses existing Google Routes. No claim of new GPS hardware or a trained model to buy."],
    ["Environmental", "Avoids sending a unit into a known blocked corridor, which wastes time and fuel."],
  ];
  bens.forEach((b, i) => {
    const x = 0.4 + (i % 4) * 3.22;
    card(s, x, 3.5, 3.08, 3.35);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 3.5, w: 3.08, h: 0.48, fill: { color: C.navy }, line: { color: C.navy },
    });
    s.addText(b[0], {
      x: x + 0.12, y: 3.56, w: 2.84, h: 0.36,
      fontFace: font, fontSize: 14, color: C.white, bold: true, margin: 0,
    });
    s.addText(b[1], {
      x: x + 0.14, y: 4.15, w: 2.8, h: 2.45,
      fontFace: font, fontSize: 14, color: C.ink, margin: 0,
    });
  });

  footer(s, 5);
  notes(s, "SIH slide 5: audience + social/economic/environmental benefits. Do not invent lives-saved numbers. Environmental line is only about not driving into a blocked corridor.");
}

// ============================================================================
// SLIDE 6 RESEARCH AND REFERENCES
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  headerBar(s);
  s.addText("RESEARCH AND REFERENCES", {
    x: 0.45, y: 0.28, w: 12, h: 0.42,
    fontFace: font, fontSize: 24, color: C.navy, bold: true, margin: 0,
  });
  s.addText("Details / links of the reference and research work", {
    x: 0.45, y: 0.72, w: 12, h: 0.25,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  card(s, 0.4, 1.15, 8.3, 5.7);
  s.addText("References used in the prototype", {
    x: 0.6, y: 1.3, w: 7.9, h: 0.32,
    fontFace: font, fontSize: 15, color: C.saffron, bold: true, margin: 0,
  });
  const refs = [
    ["Google Routes API", "https://developers.google.com/maps/documentation/routes", "Candidate geometry, ETA, alternatives, traffic-aware times."],
    ["Maps JavaScript API", "https://developers.google.com/maps/documentation/javascript", "Browser map tiles and markers only."],
    ["RapidRoute repository", "https://github.com/LTGHOST01/Rapid_Route", "Working software and evaluator schema."],
    ["Project scoring note", "docs/ROUTING_ALGORITHM.md in the repo", "Weights, blocked-road rule, reroute thresholds."],
    ["Evaluator scenarios", "Mandatory CSV/JSON schema in the repo", "Low traffic, heavy traffic, blockage, unreachable."],
  ];
  refs.forEach((r, i) => {
    const y = 1.75 + i * 0.95;
    s.addText(r[0], {
      x: 0.65, y, w: 7.8, h: 0.26,
      fontFace: font, fontSize: 15, color: C.navy, bold: true, margin: 0,
    });
    s.addText(r[1], {
      x: 0.65, y: y + 0.26, w: 7.8, h: 0.24,
      fontFace: font, fontSize: 12, color: C.blue, margin: 0,
    });
    s.addText(r[2], {
      x: 0.65, y: y + 0.5, w: 7.8, h: 0.32,
      fontFace: font, fontSize: 13, color: C.muted, margin: 0,
    });
  });

  card(s, 8.9, 1.15, 4.0, 5.7);
  s.addText("What we do not cite as fact", {
    x: 9.1, y: 1.35, w: 3.6, h: 0.7,
    fontFace: font, fontSize: 15, color: C.red, bold: true, margin: 0,
  });
  const no = [
    "No trained AI paper.",
    "No municipal live-feed source.",
    "No invented casualty statistics.",
    "No claim that motion is GPS.",
    "No claim we built Google's roads.",
  ];
  no.forEach((t, i) => {
    s.addText(t, {
      x: 9.1, y: 2.25 + i * 0.75, w: 3.6, h: 0.65,
      fontFace: font, fontSize: 14, color: C.ink, margin: 0,
    });
  });

  footer(s, 6);
  notes(s, "SIH slide 6: only real links. Judges can open GitHub and Google docs. Do not add fake papers.");
}

pres.writeFile({ fileName: "/home/ghost/projects/MOSSAD/docs/RapidRoute_SIH_Format.pptx" })
  .then(() => console.log("Wrote RapidRoute_SIH_Format.pptx"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
