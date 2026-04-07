import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

const ALLOWED_TABLES = ["seed_posts", "artists", "brands"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const ACTION_MAP: Record<string, Record<string, string>> = {
  approve: { status: "ready" },
  reject: { status: "rejected" },
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, table, ids } = body as {
    action: string;
    table: string;
    ids: string[];
  };

  if (!action || !table || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "Missing action, table, or ids" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
    return NextResponse.json(
      { error: `Table not allowed: ${table}` },
      { status: 400 }
    );
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const id of ids) {
    try {
      if (action === "delete") {
        const { data: before } = await supabase
          .schema("warehouse")
          .from(table)
          .select("*")
          .eq("id", id)
          .single();
        const { error } = await supabase
          .schema("warehouse")
          .from(table)
          .delete()
          .eq("id", id);
        if (error) throw error;
        await writeAuditLog({
          adminUserId: user.id,
          action: "bulk_delete",
          targetTable: table,
          targetId: id,
          beforeState: before,
        });
        results.push({ id, success: true });
      } else if (ACTION_MAP[action]) {
        const { data: before } = await supabase
          .schema("warehouse")
          .from(table)
          .select("*")
          .eq("id", id)
          .single();
        const { error } = await supabase
          .schema("warehouse")
          .from(table)
          .update(ACTION_MAP[action])
          .eq("id", id);
        if (error) throw error;
        await writeAuditLog({
          adminUserId: user.id,
          action: `bulk_${action}`,
          targetTable: table,
          targetId: id,
          beforeState: before,
          afterState: { ...before, ...ACTION_MAP[action] },
        });
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, error: `Unknown action: ${action}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ id, success: false, error: msg });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ succeeded, failed, results });
}
