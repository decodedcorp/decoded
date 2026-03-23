# 핵심 원칙

1. **리포지터리가 기록의 원천** — Slack/Docs에만 있는 지식은 코드베이스에 없는 것과 같음.
2. **규칙은 코드로** — 문서만으로는 부족; 구조적 테스트·clippy·pre-push로 강제.
3. **Supabase 마이그레이션이 진실** — DB에 적용된 순서가 기준; 코드와 불일치 시 `check-migration-sync.sh`로 먼저 정렬.
4. **점진적 공개** — `AGENTS.md`는 짧게, 상세는 도메인 README·`docs/`에 위임.
