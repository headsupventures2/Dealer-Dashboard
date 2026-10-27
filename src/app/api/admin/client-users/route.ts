import { createClient } from "@supabase/supabase-js";

// Creates a dealership (client) login. Requires SUPABASE_SERVICE_ROLE_KEY on the server.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ error: "Server is missing Supabase keys" }, { status: 500 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
  if (callerProfile?.role !== "admin") return Response.json({ error: "Admins only" }, { status: 403 });

  const { companyId, email, password } = (await request.json()) as {
    companyId?: string;
    email?: string;
    password?: string;
  };
  if (!companyId || !email || !password || password.length < 8) {
    return Response.json({ error: "Company, email, and a password of 8+ characters are required" }, { status: 400 });
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });
  if (error || !created.user) return Response.json({ error: error?.message ?? "Could not create user" }, { status: 400 });

  const profile = { id: created.user.id, email: created.user.email!, role: "client" as const, company_id: companyId };
  const { error: profileError } = await admin.from("profiles").insert(profile);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  return Response.json({ profile });
}
