import { DETAIL_CHECKLIST, lockPrice, type ChecklistItem, type Company, type Job, type ServiceType } from "../types";
import { createLocalStore, type LocalDb, type StoredPhoto } from "./local";

// Sales demo: made-up partners and a month of work, rebuilt fresh each time the demo starts.
// Lives entirely in the browser, so it never touches real client data.

export const DEMO_LOGINS = {
  admin: { email: "demo@leadingedge.test", password: "demo" },
  client: { email: "service@summitmotors.test", password: "demo" },
};

const demo = createLocalStore({
  mode: "demo",
  key: "led-demo-v1",
  photoDb: "led-demo-photos",
  seed: () => ({ users: [], companies: [], jobs: [], internalNotes: {}, sessionUserId: null }),
});

export const demoStore = demo.store;

/** Rebuilds the demo from scratch, dated around today. */
export async function loadDemo() {
  const { db, showcase } = buildDemo(new Date());
  const photos: StoredPhoto[] = [];
  for (const job of showcase) {
    const label = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(" ");
    for (const [i, type] of (["before", "before", "after", "after"] as const).entries()) {
      photos.push({
        id: `${job.id}-p${i}`,
        job_id: job.id,
        type,
        blob: await placeholderPhoto(type, label, i % 2),
        created_at: job.completed_at!,
      });
    }
  }
  await demo.reset(db, photos);
}

// ─── Data ───────────────────────────────────────────────────────────────

const COMPANIES: Omit<Company, "created_at">[] = [
  {
    id: "demo-summit",
    name: "Summit Motors of Utah",
    contact_name: "Ryan Caldwell",
    contact_email: "service@summitmotors.test",
    contact_phone: "801-555-0118",
    price_per_vehicle: 250,
    cost_per_vehicle: 95,
    lot_rinse_price: 15,
    lot_rinse_cost: 5,
    fuel_fill_price: 20,
    fuel_fill_cost: 6,
  },
  {
    id: "demo-wasatch",
    name: "Wasatch Premier Auto",
    contact_name: "Megan Torres",
    contact_email: "megan@wasatchpremier.test",
    contact_phone: "385-555-0164",
    price_per_vehicle: 275,
    cost_per_vehicle: 100,
    lot_rinse_price: 18,
    lot_rinse_cost: 6,
    fuel_fill_price: 20,
    fuel_fill_cost: 6,
  },
  {
    id: "demo-canyon",
    name: "Canyon Fleet Services",
    contact_name: "Derek Owens",
    contact_email: "fleet@canyonfleet.test",
    contact_phone: "801-555-0190",
    price_per_vehicle: 180,
    cost_per_vehicle: 70,
    lot_rinse_price: 12,
    lot_rinse_cost: 4,
    fuel_fill_price: 15,
    fuel_fill_cost: 5,
  },
];

const VEHICLES: Record<string, [string, string][]> = {
  "demo-summit": [
    ["Mercedes-Benz", "GLE 450"],
    ["Mercedes-Benz", "C 300"],
    ["Porsche", "Cayenne"],
    ["Porsche", "Macan"],
    ["BMW", "X5"],
    ["Audi", "Q7"],
    ["Mercedes-Benz", "G 550"],
  ],
  "demo-wasatch": [
    ["Lexus", "RX 350"],
    ["Genesis", "GV80"],
    ["Cadillac", "Escalade"],
    ["Land Rover", "Range Rover Sport"],
    ["Lexus", "GX 550"],
  ],
  "demo-canyon": [
    ["Ford", "Transit 250"],
    ["Ford", "F-150"],
    ["Chevrolet", "Express 2500"],
    ["Ram", "ProMaster 2500"],
  ],
};

const COLORS = ["Obsidian Black", "Polar White", "Selenite Grey", "Jet Black", "Iridium Silver", "Deep Blue", "Summit White"];

const CLIENT_NOTES = [
  "Bugs fully removed from bumper and mirrors. Ready for the front line.",
  "Interior steamed and conditioned. Light scuff on rear door sill noted.",
  "Iron decon and wash complete. Paint is clean and slick.",
  "Engine bay degreased and dressed. Looks showroom ready.",
  "Removed dealer stickers and adhesive. Glass cleaned inside and out.",
  null,
];

const INTERNAL_NOTES = ["Heavy tar on lower panels, extra 20 min.", "Customer pickup tomorrow AM.", "Used ceramic topper.", null];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDemo(now: Date): { db: LocalDb; showcase: Job[] } {
  const rand = rng(42);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const at = (dayOffset: number, hour: number, minute = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute).toISOString();
  const ymd = (dayOffset: number) => at(dayOffset, 12).slice(0, 10);

  const companies: Company[] = COMPANIES.map((c, i) => ({ ...c, created_at: at(-120 + i, 9) }));
  const byId = new Map(companies.map((c) => [c.id, c]));
  const jobs: Job[] = [];
  const internalNotes: Record<string, string> = {};
  let n = 0;

  function add(companyId: string, service: ServiceType, o: Partial<Job>) {
    const [make, model] = pick(VEHICLES[companyId]);
    const lot = service === "lot_rinse"; // lot rinses have no single vehicle
    const checklist: ChecklistItem[] =
      service === "detail"
        ? DETAIL_CHECKLIST.filter((_, i) => i === 3 || rand() < 0.5).map((c) => ({ ...c, done: o.status === "completed" }))
        : [];
    const job: Job = {
      id: `demo-job-${++n}`,
      company_id: companyId,
      service_type: service,
      vehicle_year: lot ? null : String(2023 + Math.floor(rand() * 3)),
      vehicle_make: lot ? null : make,
      vehicle_model: lot ? null : model,
      vehicle_color: lot ? null : pick(COLORS),
      stock_or_vin: lot ? null : `${companyId === "demo-canyon" ? "F" : "S"}${24000 + Math.floor(rand() * 9000)}`,
      vehicle_count: 1,
      lot_area: null,
      request_notes: null,
      checklist,
      preferred_date: null,
      status: "new",
      scheduled_at: null,
      completed_at: null,
      price_at_completion: null,
      cost_at_completion: null,
      fuel_gallons: null,
      fuel_amount: null,
      client_notes: null,
      created_at: at(-40, 9),
      ...o,
    };
    if (job.status === "completed") {
      Object.assign(job, lockPrice(job, byId.get(companyId)!));
      if (service === "detail") {
        job.client_notes = pick(CLIENT_NOTES);
        const note = pick(INTERNAL_NOTES);
        if (note) internalNotes[job.id] = note;
      }
      if (service === "fuel_fill") {
        job.fuel_gallons = Math.round((14 + rand() * 10) * 10) / 10;
        job.fuel_amount = Math.round(job.fuel_gallons * 4.29 * 100) / 100;
      }
    }
    jobs.push(job);
    return job;
  }

  // About five weeks of completed work, Monday to Saturday.
  for (let d = -35; d <= -1; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const dow = date.getDay();
    if (dow === 0) continue;
    const done = (h: number, m = 0) => ({
      status: "completed" as const,
      scheduled_at: at(d, h, m),
      completed_at: at(d, h + 2, m),
      created_at: at(d - 3, 10),
    });
    const details = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < details; i++) {
      const r = rand();
      const companyId = r < 0.5 ? "demo-summit" : r < 0.8 ? "demo-wasatch" : "demo-canyon";
      add(companyId, "detail", done(8 + i * 3, rand() < 0.5 ? 0 : 30));
    }
    if (dow === 1) add("demo-summit", "lot_rinse", { ...done(7), vehicle_count: 40, lot_area: "Front line" });
    if (dow === 4) add("demo-wasatch", "lot_rinse", { ...done(7), vehicle_count: 30, lot_area: "Showroom row" });
    if (dow === 3) add("demo-canyon", "lot_rinse", { ...done(7), vehicle_count: 24, lot_area: "Yard" });
    if (dow === 2 || dow === 5) add(pick(["demo-summit", "demo-canyon"]), "fuel_fill", done(15));
  }

  // Today and the week ahead.
  add("demo-summit", "detail", { status: "in_progress", scheduled_at: at(0, 9), created_at: at(-2, 10), request_notes: "Customer pickup at 2 PM." });
  add("demo-wasatch", "detail", { status: "scheduled", scheduled_at: at(0, 13), created_at: at(-1, 11) });
  add("demo-summit", "lot_rinse", { status: "scheduled", scheduled_at: at(1, 7), vehicle_count: 42, lot_area: "Front line", created_at: at(-3, 8) });
  add("demo-summit", "detail", { status: "scheduled", scheduled_at: at(1, 10, 30), created_at: at(-1, 15) });
  add("demo-canyon", "fuel_fill", { status: "scheduled", scheduled_at: at(2, 8), created_at: at(-1, 9), request_notes: "Diesel. Fill to full." });
  add("demo-wasatch", "detail", { status: "scheduled", scheduled_at: at(2, 11), created_at: at(-1, 16) });
  add("demo-summit", "detail", { status: "scheduled", scheduled_at: at(3, 9), created_at: at(0, 8) });
  add("demo-canyon", "detail", { status: "scheduled", scheduled_at: at(4, 14), created_at: at(0, 9) });

  // New requests waiting to be scheduled.
  add("demo-summit", "detail", { created_at: at(0, 8, 15), preferred_date: ymd(2), request_notes: "Sold unit, delivery Saturday." });
  add("demo-summit", "fuel_fill", { created_at: at(0, 9, 40), request_notes: "Premium. Parked by service drive." });
  add("demo-canyon", "detail", { created_at: at(-1, 14), preferred_date: ymd(5) });

  // The most recent dealer-side details get placeholder before/after photos.
  const showcase = jobs
    .filter((j) => j.status === "completed" && j.service_type === "detail" && j.company_id !== "demo-canyon")
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))
    .slice(0, 8);

  const db: LocalDb = {
    users: [
      { id: "demo-admin", role: "admin", company_id: null, ...DEMO_LOGINS.admin },
      { id: "demo-client", role: "client", company_id: "demo-summit", ...DEMO_LOGINS.client },
    ],
    companies,
    jobs,
    internalNotes,
    sessionUserId: null,
  };
  return { db, showcase };
}

// ─── Placeholder photos ─────────────────────────────────────────────────

/** A branded stand-in photo: a dusty car for "before", a glossy one for "after". */
async function placeholderPhoto(type: "before" | "after", label: string, variant: number): Promise<Blob> {
  const w = 1200;
  const h = 900;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const after = type === "after";
  const rand = rng(label.length * 7 + variant * 13 + (after ? 1 : 0));

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, after ? "#2E4370" : "#9C8B76");
  bg.addColorStop(1, after ? "#141F36" : "#5E5244");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Ground
  ctx.fillStyle = after ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.18)";
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Car silhouette (side view, mirrored for the second shot)
  ctx.save();
  if (variant) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  const body = after ? "#E9EDF4" : "#7B7064";
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(220, 600);
  ctx.lineTo(230, 500);
  ctx.quadraticCurveTo(300, 470, 420, 455);
  ctx.lineTo(500, 370);
  ctx.quadraticCurveTo(560, 340, 700, 345);
  ctx.quadraticCurveTo(800, 350, 850, 455);
  ctx.quadraticCurveTo(960, 470, 985, 520);
  ctx.lineTo(990, 600);
  ctx.closePath();
  ctx.fill();
  // Windows
  ctx.fillStyle = after ? "#1F2F4F" : "#4E463D";
  ctx.beginPath();
  ctx.moveTo(530, 450);
  ctx.lineTo(560, 385);
  ctx.quadraticCurveTo(600, 368, 680, 370);
  ctx.lineTo(680, 450);
  ctx.closePath();
  ctx.moveTo(700, 450);
  ctx.lineTo(700, 372);
  ctx.quadraticCurveTo(770, 378, 815, 450);
  ctx.closePath();
  ctx.fill();
  // Wheels
  for (const x of [355, 845]) {
    ctx.fillStyle = "#151515";
    ctx.beginPath();
    ctx.arc(x, 600, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = after ? "#C9CFD9" : "#6E6A64";
    ctx.beginPath();
    ctx.arc(x, 600, 36, 0, Math.PI * 2);
    ctx.fill();
  }
  if (after) {
    // Gloss highlight along the body line
    const shine = ctx.createLinearGradient(0, 470, 0, 540);
    shine.addColorStop(0, "rgba(255,255,255,0.75)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(250, 478, 720, 40);
  }
  ctx.restore();

  if (!after) {
    // Dust and bug specks
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${40 + rand() * 40},${30 + rand() * 30},${20 + rand() * 20},${0.25 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(200 + rand() * 800, 340 + rand() * 280, 1.5 + rand() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Diagonal sheen across the frame
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(w * 0.55, 0);
    ctx.lineTo(w * 0.75, 0);
    ctx.lineTo(w * 0.35, h);
    ctx.lineTo(w * 0.15, h);
    ctx.fill();
  }

  // Labels
  ctx.fillStyle = after ? "#B5452F" : "#7A2A3A";
  ctx.fillRect(60, 60, 12, 92);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 64px Montserrat, Arial, sans-serif";
  ctx.fillText(after ? "AFTER" : "BEFORE", 92, 118);
  ctx.font = "500 30px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(label, 94, 156);
  ctx.font = "500 22px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("Placeholder photo · Leading Edge Detailing", 60, h - 50);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not draw demo photo"))), "image/jpeg", 0.85),
  );
}
