import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { uploadLimiter, apiLimiter, getClientIp } from "@/lib/rate-limit";

// ─── Auth guard helper ───────────────────────────────────────────────────────
async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleAssignment } = await supabase
    .from("user_role_assignments")
    .select("role:user_roles(name)")
    .eq("user_id", user.id)
    .single();

  const roleName = (roleAssignment?.role as any)?.name;
  if (!["super_admin", "manager", "editor"].includes(roleName)) return null;

  return user;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/avif", "video/mp4", "application/pdf",
];

export async function POST(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = uploadLimiter.check(ip);
  if (!rl.success) return NextResponse.json({ error: "Upload rate limit exceeded" }, { status: 429 });

  // ── Auth check ──────────────────────────────────────────────────────────────
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // ── Validation ────────────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10 MB limit" }, { status: 413 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" is not allowed` }, { status: 415 });
    }

    const supabaseAdmin = createAdminClient();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = `products/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("media")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from("media").getPublicUrl(filePath);

    const { data: mediaData, error: mediaError } = await supabaseAdmin
      .from("media")
      .insert({
        filename: file.name,
        file_path: filePath,
        url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (mediaError) console.error("Media insert error:", mediaError);

    return NextResponse.json({ url: urlData.publicUrl, path: filePath, media: mediaData });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const rl = apiLimiter.check(getClientIp(request));
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  // ── Auth check ──────────────────────────────────────────────────────────────
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) query = query.ilike("filename", `%${search}%`);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      media: data || [],
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("List media error:", error);
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const rl = apiLimiter.check(getClientIp(request));
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  // ── Auth check ──────────────────────────────────────────────────────────────
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const url = searchParams.get("url");

    if (!id && !url) return NextResponse.json({ error: "Media ID or URL required" }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    let mediaQuery = supabaseAdmin.from("media").select("*");
    if (id) mediaQuery = mediaQuery.eq("id", id);
    else if (url) mediaQuery = mediaQuery.eq("url", url);

    const { data: media, error: mediaError } = await mediaQuery.single();
    if (mediaError || !media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const { error: storageError } = await supabaseAdmin.storage.from("media").remove([media.file_path]);
    if (storageError) console.error("Storage delete error:", storageError);

    const { error: deleteError } = await supabaseAdmin.from("media").delete().eq("id", media.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
