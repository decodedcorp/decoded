import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .schema("warehouse")
    .from("admin_audit_log")
    .insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_table: entry.targetTable,
      target_id: entry.targetId,
      before_state: entry.beforeState,
      after_state: entry.afterState,
      metadata: entry.metadata,
    });

  if (error) {
    console.error("[audit-log] Failed to write:", error.message);
  }
}

export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
