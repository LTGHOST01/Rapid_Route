const pptxgen = require("pptxgenjs");
const path = require("path");

const I = path.join(__dirname, "deck-icons");
const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.title = "RapidRoute | RIH-PS-011";
pres.author = "RapidRoute";

const C = {
  bg: "F4F7FB",
  white: "FFFFFF",
  ink: "202124",
  muted: "5F6368",
  line: "DADCE0",
  navy: "174EA6",
  blue: "1A73E8",
  red: "D93025",
  green: "188038",
  amber: "E37400",
  yellow: "F9AB00",
  soft: "E8F0FE",
};
const font = "Arial";
const ic = (name) => path.join(I, name);

function notes(s, t) { s.addNotes(t); }
function foot(s, n) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.2, w: 13.333, h: 0.3, fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addText("RapidRoute   |   RIH-PS-011   |   Idea presentation", {
    x: 0.4, y: 7.2, w: 10, h: 0.3, fontFace: font, fontSize: 11, color: C.white, valign: "middle", margin: 0,
  });
  s.addText(String(n) + " / 4", {
    x: 11.6, y: 7.2, w: 1.4, h: 0.3, fontFace: font, fontSize: 11, color: C.white, align: "right", valign: "middle", margin: 0,
  });
}

// ============================================================================
// SLIDE 1  Title + Problem  (Hacking Bad page 1 layout)
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 5.55, h: 7.5, fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addImage({ path: ic("ambulance.jpg"), x: 0.35, y: 0.35, w: 0.85, h: 0.85 });
  s.addText("RAPIDROUTE", {
    x: 0.35, y: 1.35, w: 4.9, h: 0.7,
    fontFace: font, fontSize: 32, color: C.white, bold: true, margin: 0,
  });
  s.addText("Intelligent Emergency\nVehicle Route Management", {
    x: 0.35, y: 2.1, w: 4.9, h: 0.75,
    fontFace: font, fontSize: 16, color: "D2E3FC", margin: 0,
  });

  const meta = [
    ["Problem ID", "RIH-PS-011"],
    ["Category", "Software"],
    ["Domain", "Emergency dispatch / Smart mobility"],
    ["Team name", "Fill registered name"],
    ["Team ID", "Fill registered ID"],
  ];
  meta.forEach((m, i) => {
    s.addText(m[0], {
      x: 0.35, y: 3.15 + i * 0.7, w: 4.9, h: 0.22,
      fontFace: font, fontSize: 12, color: "8AB4F8", bold: true, margin: 0,
    });
    s.addText(m[1], {
      x: 0.35, y: 3.37 + i * 0.7, w: 4.9, h: 0.28,
      fontFace: font, fontSize: 16, color: C.white, margin: 0,
    });
  });

  s.addText("PROBLEM DESCRIPTION", {
    x: 5.9, y: 0.4, w: 7, h: 0.4,
    fontFace: font, fontSize: 22, color: C.navy, bold: true, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.9, y: 0.85, w: 2.4, h: 0.07, fill: { color: C.red }, line: { color: C.red },
  });
  s.addText("Emergency vehicles need the right unit and the right route, not simply the first line on a consumer map.", {
    x: 5.9, y: 1.15, w: 7, h: 0.85,
    fontFace: font, fontSize: 16, color: C.ink, margin: 0,
  });

  const probs = [
    ["1", "Which ambulance is free and compatible?"],
    ["2", "Which Google alternative should we send?"],
    ["3", "What if a corridor becomes blocked mid-run?"],
    ["4", "How do we explain the choice, not hide it?"],
  ];
  probs.forEach((p, i) => {
    const y = 2.2 + i * 1.05;
    s.addShape(pres.shapes.OVAL, {
      x: 5.95, y, w: 0.42, h: 0.42, fill: { color: C.red }, line: { color: C.red },
    });
    s.addText(p[0], {
      x: 5.95, y, w: 0.42, h: 0.42,
      fontFace: font, fontSize: 16, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
    });
    s.addText(p[1], {
      x: 6.55, y, w: 6.3, h: 0.42,
      fontFace: font, fontSize: 16, color: C.ink, valign: "middle", margin: 0,
    });
  });
  s.addText("Google is the road atlas. RapidRoute is the control-room officer.", {
    x: 5.9, y: 6.5, w: 7, h: 0.4,
    fontFace: font, fontSize: 14, color: C.muted, italic: true, margin: 0,
  });
  notes(s, "Hacking Bad slide 1 style: left identity, right problem. Fill team name and ID. Do not invent stats.");
}

// ============================================================================
// SLIDE 2  Proposed solution + unique points  (Hacking Bad page 2)
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // SOLVED badge
  s.addShape(pres.shapes.OVAL, {
    x: 0.3, y: 0.25, w: 1.15, h: 1.15, fill: { color: C.red }, line: { color: C.red },
  });
  s.addImage({ path: ic("check.jpg"), x: 0.48, y: 0.38, w: 0.8, h: 0.8 });
  s.addText("SOLVED", {
    x: 0.3, y: 1.4, w: 1.15, h: 0.25,
    fontFace: font, fontSize: 11, color: C.red, bold: true, align: "center", margin: 0,
  });
  s.addText("Proposed solution", {
    x: 1.65, y: 0.3, w: 11, h: 0.4,
    fontFace: font, fontSize: 26, color: C.navy, bold: true, margin: 0,
  });

  const sol = [
    "Web control-room app. Dispatcher creates an incident (origin + hospital).",
    "System assigns a free compatible unit (ambulance, fire engine, or police).",
    "Backend calls Google Routes. Google returns 2 to 3 real paths with ETA and traffic.",
    "RapidRoute scores those candidates. Lowest penalty wins. Why this route is shown.",
    "If a road is blocked, that candidate is removed, not traded off in the score.",
    "If every corridor is blocked: No suitable route available.",
    "Journey marker moves along Google's line as a simulation. Not live van GPS.",
    "Admin only can block a live corridor. Labelled DEMO SIMULATION, not a city feed.",
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1.65, y: 0.85, w: 11.3, h: 3.15,
    fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08,
  });
  sol.forEach((t, i) => {
    s.addText("•  " + t, {
      x: 1.85, y: 0.95 + i * 0.36, w: 10.9, h: 0.36,
      fontFace: font, fontSize: 13, color: C.ink, valign: "middle", margin: 0,
    });
  });

  s.addText("Unique special points", {
    x: 0.4, y: 4.2, w: 12.5, h: 0.35,
    fontFace: font, fontSize: 20, color: C.navy, bold: true, margin: 0,
  });
  const uniq = [
    { img: "ambulance.jpg", t: "Unit first", d: "Picks a free compatible vehicle. Google does not do that." },
    { img: "blocked.jpg", t: "Hard block", d: "Blocked = ineligible. Never a score trade-off." },
    { img: "console.jpg", t: "Published formula", d: "Weighted penalty. Not a trained AI model." },
    { img: "check.jpg", t: "Honest fallback", d: "Google down? Labelled DEMO SIMULATION." },
  ];
  uniq.forEach((u, i) => {
    const x = 0.4 + i * 3.22;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.65, w: 3.08, h: 2.3,
      fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08,
    });
    s.addImage({ path: ic(u.img), x: x + 0.15, y: 4.8, w: 0.55, h: 0.55 });
    s.addText(u.t, {
      x: x + 0.8, y: 4.88, w: 2.1, h: 0.4,
      fontFace: font, fontSize: 14, color: C.navy, bold: true, valign: "middle", margin: 0,
    });
    s.addText(u.d, {
      x: x + 0.18, y: 5.5, w: 2.72, h: 1.2,
      fontFace: font, fontSize: 13, color: C.muted, margin: 0,
    });
  });
  notes(s, "Proposed solution bullets + four unique points. Stay on JUDGE_QA. No AI model. No live GPS.");
}

// ============================================================================
// SLIDE 3  How it works chart  (Hacking Bad page 3)
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText("How RapidRoute works", {
    x: 0.4, y: 0.18, w: 10, h: 0.4,
    fontFace: font, fontSize: 24, color: C.navy, bold: true, margin: 0,
  });
  s.addText("Simple chart of a live dispatch", {
    x: 0.4, y: 0.55, w: 10, h: 0.25,
    fontFace: font, fontSize: 13, color: C.muted, margin: 0,
  });

  function box(x, y, w, h, fill, title, body, ink) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.06,
    });
    s.addText(title, {
      x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.28,
      fontFace: font, fontSize: 13, color: ink, bold: true, margin: 0,
    });
    if (body) {
      s.addText(body, {
        x: x + 0.1, y: y + 0.36, w: w - 0.2, h: h - 0.46,
        fontFace: font, fontSize: 12, color: ink, margin: 0,
      });
    }
  }

  // Actors
  s.addImage({ path: ic("dispatcher.jpg"), x: 0.45, y: 1.0, w: 0.85, h: 0.85 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 1.9, w: 1.85, h: 0.32, fill: { color: C.soft }, line: { color: C.line }, rectRadius: 0.04,
  });
  s.addText("Dispatcher", {
    x: 0.35, y: 1.9, w: 1.85, h: 0.32,
    fontFace: font, fontSize: 12, color: C.navy, bold: true, align: "center", valign: "middle", margin: 0,
  });

  s.addImage({ path: ic("hospital.jpg"), x: 12.05, y: 1.0, w: 0.85, h: 0.85 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 11.55, y: 1.9, w: 1.45, h: 0.32, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.04,
  });
  s.addText("Hospital", {
    x: 11.55, y: 1.9, w: 1.45, h: 0.32,
    fontFace: font, fontSize: 12, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });

  // Center console
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.55, y: 0.95, w: 4.25, h: 2.15,
    fill: { color: C.white }, line: { color: C.blue, width: 1.5 }, rectRadius: 0.08,
  });
  s.addImage({ path: ic("console.jpg"), x: 5.95, y: 1.05, w: 1.35, h: 1.05 });
  s.addText("RapidRoute app", {
    x: 4.7, y: 2.15, w: 3.95, h: 0.28,
    fontFace: font, fontSize: 14, color: C.navy, bold: true, align: "center", margin: 0,
  });
  s.addText("Assign  ·  Score  ·  Explain", {
    x: 4.7, y: 2.45, w: 3.95, h: 0.28,
    fontFace: font, fontSize: 12, color: C.muted, align: "center", margin: 0,
  });

  // Database
  s.addImage({ path: ic("database.jpg"), x: 6.15, y: 3.3, w: 0.95, h: 0.95 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.7, y: 4.25, w: 1.85, h: 0.3, fill: { color: C.amber }, line: { color: C.amber }, rectRadius: 0.04,
  });
  s.addText("PostgreSQL", {
    x: 5.7, y: 4.25, w: 1.85, h: 0.3,
    fontFace: font, fontSize: 12, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });

  // Google
  box(4.55, 4.75, 4.25, 0.85, C.soft, "Google Routes API  (server only)", "2 to 3 real paths  ·  ETA  ·  traffic-aware times", C.ink);

  // Side boxes
  box(0.35, 2.45, 3.7, 1.35, "FFF3E0", "1  Create incident", "Origin + hospital. Search or pin on the map.", C.ink);
  box(0.35, 4.0, 3.7, 1.55, "E8F0FE", "2  Assign unit", "Closest free compatible vehicle.\nAmbulance / fire / police.", C.ink);
  box(9.25, 2.45, 3.7, 1.35, "E6F4EA", "3  Score routes", "ETA + distance + traffic + road.\nLowest penalty wins.", C.ink);
  box(9.25, 4.0, 3.7, 1.55, "FCE8E6", "4  If blocked", "Remove that candidate.\nRe-query from current point.\nAdopt a clear alternative.", C.ink);

  s.addImage({ path: ic("ambulance.jpg"), x: 0.45, y: 5.7, w: 0.7, h: 0.7 });
  s.addImage({ path: ic("fire.jpg"), x: 1.25, y: 5.7, w: 0.7, h: 0.7 });
  s.addText("Units on the map", {
    x: 2.05, y: 5.85, w: 2.2, h: 0.4,
    fontFace: font, fontSize: 12, color: C.muted, valign: "middle", margin: 0,
  });
  s.addImage({ path: ic("blocked.jpg"), x: 9.35, y: 5.7, w: 0.65, h: 0.65 });
  s.addText("Admin block is DEMO SIMULATION", {
    x: 10.1, y: 5.8, w: 2.8, h: 0.5,
    fontFace: font, fontSize: 12, color: C.red, valign: "middle", margin: 0,
  });

  // Arrows as simple chevrons
  s.addShape(pres.shapes.RIGHT_ARROW, {
    x: 2.25, y: 1.7, w: 2.15, h: 0.18, fill: { color: C.blue }, line: { color: C.blue },
  });
  s.addShape(pres.shapes.RIGHT_ARROW, {
    x: 8.9, y: 1.7, w: 2.15, h: 0.18, fill: { color: C.red }, line: { color: C.red },
  });
  s.addShape(pres.shapes.DOWN_ARROW, {
    x: 6.5, y: 3.1, w: 0.2, h: 0.2, fill: { color: C.amber }, line: { color: C.amber },
  });

  notes(s, "Walk left to right then down. Dispatcher creates. Unit assigned. App scores Google candidates. Database stores the decision. If admin blocks, red box: remove and adopt.");
}

// ============================================================================
// SLIDE 4  Tech stack  (Hacking Bad page 2 bottom)
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 0.3, w: 12.6, h: 1.15,
    fill: { color: C.blue }, line: { color: C.blue }, rectRadius: 0.1,
  });
  s.addText("Technology stack", {
    x: 0.6, y: 0.5, w: 12.1, h: 0.75,
    fontFace: font, fontSize: 32, color: C.white, bold: true, valign: "middle", margin: 0,
  });

  const stack = [
    { img: "console.jpg", k: "Frontend", v: "React, TypeScript, Vite, Tailwind, Google Maps JS" },
    { img: "dispatcher.jpg", k: "Backend", v: "Express, TypeScript, JWT, Zod, scoring service" },
    { img: "database.jpg", k: "Database", v: "PostgreSQL + Prisma" },
    { img: "ambulance.jpg", k: "Routing", v: "Google Routes API on the server only" },
    { img: "blocked.jpg", k: "Safety", v: "Blocked roads removed before scoring" },
    { img: "check.jpg", k: "Fallback", v: "Labelled DEMO SIMULATION if Google fails" },
  ];
  stack.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 4.3;
    const y = 1.7 + row * 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 4.1, h: 2.25,
      fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.08,
    });
    s.addImage({ path: ic(st.img), x: x + 0.2, y: y + 0.25, w: 0.75, h: 0.75 });
    s.addText(st.k, {
      x: x + 1.1, y: y + 0.3, w: 2.75, h: 0.4,
      fontFace: font, fontSize: 18, color: C.navy, bold: true, margin: 0,
    });
    s.addText(st.v, {
      x: x + 0.2, y: y + 1.15, w: 3.7, h: 0.85,
      fontFace: font, fontSize: 14, color: C.ink, margin: 0,
    });
  });
  notes(s, "Two keys: browser draws the map. Server calls Routes. Frontend never calls Google Routes. Keys not on GitHub.");
}

pres.writeFile({ fileName: "/home/ghost/projects/MOSSAD/docs/RapidRoute_HackingBad_Style.pptx" })
  .then(() => console.log("Wrote RapidRoute_HackingBad_Style.pptx"))
  .catch((e) => { console.error(e); process.exit(1); });
