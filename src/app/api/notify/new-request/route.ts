import { createClient } from "@supabase/supabase-js";

// Emails Leading Edge when a dealer submits a request. Sent through Resend.
// Needs RESEND_API_KEY and NOTIFY_EMAIL (comma-separated for several people); NOTIFY_FROM is optional.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL?.split(",").map((s) => s.trim()).filter(Boolean);
  if (!url || !serviceKey) return Response.json({ error: "Server is missing Supabase keys" }, { status: 500 });
  if (!resendKey || !to?.length) return Response.json({ skipped: "Email notifications are not set up" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { jobId } = (await request.json()) as { jobId?: string };
  const [{ data: profile }, { data: job }] = await Promise.all([
    admin.from("profiles").select("role, company_id").eq("id", caller.user.id).maybeSingle(),
    admin.from("jobs").select("*, companies(name)").eq("id", jobId ?? "").maybeSingle(),
  ]);
  if (!job || !profile) return Response.json({ error: "Request not found" }, { status: 404 });
  // Only the dealer who owns the request can trigger its email, and only while it's fresh,
  // so this can't be replayed to spam the inbox.
  const fresh = Date.now() - new Date(job.created_at).getTime() < 10 * 60 * 1000;
  if (profile.role !== "admin" && job.company_id !== profile.company_id) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (job.status !== "new" || !fresh) return Response.json({ skipped: "Not a new request" });

  const company = (job.companies as { name: string } | null)?.name ?? "A dealer";
  const service = { detail: "Detail", lot_rinse: "Lot Rinse", fuel_fill: "Fuel Fill-Up" }[job.service_type as string] ?? "Request";
  const vehicle =
    job.service_type === "lot_rinse"
      ? `${job.vehicle_count} vehicle${job.vehicle_count === 1 ? "" : "s"}${job.lot_area ? ` · ${job.lot_area}` : ""}`
      : [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(" ") || job.stock_or_vin || "Vehicle";
  const link = `${new URL(request.url).origin}/admin/jobs/${job.id}`;

  const rows: [string, string | null][] = [
    ["Company", company],
    ["Service", service],
    ["Vehicle", vehicle],
    ["Color", job.vehicle_color],
    ["Stock # / VIN", job.stock_or_vin],
    ["Needs", (job.checklist as { label: string }[]).map((c) => c.label).join(", ") || null],
    ["Preferred date", job.preferred_date ? formatDay(job.preferred_date) : null],
    ["Notes", job.request_notes],
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || "Leading Edge Dashboard <onboarding@resend.dev>",
      to,
      subject: `New ${service} request · ${company} · ${vehicle}`,
      html: emailHtml(company, service, rows, link),
      text: [`New ${service} request from ${company}`, ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), "", link].join("\n"),
    }),
  });
  if (!res.ok) return Response.json({ error: `Email failed: ${await res.text()}` }, { status: 502 });
  return Response.json({ sent: true });
}

function formatDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function emailHtml(company: string, service: string, rows: [string, string | null][], link: string) {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#1F2F4F;font-weight:600">${esc(v!)}</td></tr>`,
    )
    .join("");
  return `<div style="background:#F6ECDD;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:#1F2F4F;color:#ffffff;padding:16px 24px;font-weight:800;letter-spacing:1px">LEADING EDGE <span style="color:#F6ECDD;font-weight:600;letter-spacing:3px;font-size:12px">DETAILING</span></div>
    <div style="padding:24px">
      <p style="margin:0;color:#B5452F;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">New ${esc(service)} request</p>
      <h1 style="margin:6px 0 16px;color:#1F2F4F;font-size:22px">${esc(company)}</h1>
      <table style="border-collapse:collapse;font-size:15px">${body}</table>
      <a href="${esc(link)}" style="display:inline-block;margin-top:20px;background:#B5452F;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px">Open request</a>
    </div>
  </div>
  <p style="text-align:center;color:#6b7280;font-size:11px;letter-spacing:3px;margin-top:16px">AVIATION-LEVEL CARE</p>
</div>`;
}
