import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  const supabase = await createSupabaseServerClient();

  // Dynamic warehouse schema insert requires type assertion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.schema("warehouse") as any)
    .from("admin_audit_log")
    .insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_table: entry.targetTable,
      target_id: entry.targetId,
      before_state: entry.beforeState ?? undefined,
      after_state: entry.afterState ?? undefined,
      metadata: entry.metadata ?? undefined,
    });

  if (error) {
    // TODO(#237): surface this to the caller or retry. Today picks CRUD
    // writes audit as a fire-and-forget step after the mutation commits,
    // so a failed audit insert leaves a silent gap in the log. The
    // magazine status path avoids this by wrapping mutation + audit in
    // update_magazine_status() RPC. Fold picks into the same pattern
    // when Rust audit integration lands.
    console.error("[audit-log] Failed to write:", error.message);
  }
}

export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
