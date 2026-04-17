-- #239 view_logs(created_at) 인덱스 — 다른 3 로그 테이블(click/search/user_events)은 이미 보유.
-- admin_daily_metrics가 90일 범위로 view_logs를 scan하므로 seq scan 방지.
-- CONCURRENTLY는 migration이 자체 트랜잭션에서 실행되도록 이 파일에 단독으로 둔다.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_logs_created_at
  ON public.view_logs(created_at);
