import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the audit log entry
  const { data: logEntry, error: logError } = await supabase
    .schema("warehouse")
    .from("admin_audit_log")
    .select("*")
    .eq("id", id)
    .single();

  if (logError || !logEntry) {
    return NextResponse.json(
      { error: "Audit log entry not found" },
      { status: 404 }
    );
  }

  if (!logEntry.before_state) {
    return NextResponse.json(
      { error: "No before_state to rollback to" },
      { status: 400 }
    );
  }

  if (!logEntry.target_id) {
    return NextResponse.json(
      { error: "No target_id to rollback" },
      { status: 400 }
    );
  }

  // Get current state before applying rollback
  // Dynamic table name requires type assertion
  const warehouseClient = supabase.schema("warehouse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentState } = await (warehouseClient as any)
    .from(logEntry.target_table)
    .select("*")
    .eq("id", logEntry.target_id)
    .single();

  // Apply rollback — restore before_state, excluding id to avoid PK conflicts
  const { id: _ignoreId, ...restoreData } = logEntry.before_state as Record<
    string,
    unknown
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (warehouseClient as any)
    .from(logEntry.target_table)
    .update(restoreData)
    .eq("id", logEntry.target_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the rollback action
  await writeAuditLog({
    adminUserId: user.id,
    action: "rollback",
    targetTable: logEntry.target_table,
    targetId: logEntry.target_id,
    beforeState: currentState,
    afterState: logEntry.before_state as Record<string, unknown>,
    metadata: { rolled_back_audit_log_id: id },
  });

  return NextResponse.json({ ok: true });
}
