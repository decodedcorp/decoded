# Git 워크플로 (백엔드)

## `main` 직접 push 금지

`scripts/pre-push.sh`는 **Git `pre-push` 훅으로 연결**되면, 원격 ref가 `refs/heads/main`(또는 `master`)일 때 push를 거부합니다. 반드시 **토픽 브랜치 → PR → 머지**로 진행하세요.

`backend` 저장소 루트(이 레포의 루트 = `Cargo.toml` 있는 곳)에서:

```bash
chmod +x scripts/pre-push.sh
ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
```

이후 `git push` 시 자동으로 이 스크립트가 먼저 실행됩니다 (`main`/`master` 직접 push는 거부).

**just** 사용 시: 저장소 루트에서 `just hook` 또는 온보딩용으로 **`just dev`** / **`just setup`**(훅 + `.env.dev` 없으면 생성 + `docker/dev` 스택 기동) — [`justfile`](../justfile) 참고.

원격 저장소(GitHub/GitLab 등)에서는 **브랜치 보호 규칙**으로 `main` 직접 push를 막는 것을 함께 권장합니다(훅은 우회 가능).

자동 CI는 **로컬 `pre-push`만** 사용합니다(GitHub Actions 워크플로 없음).

**`git push --no-verify`는 쓰지 마세요.** 훅을 건너뛰면 포맷·clippy·테스트·커버리지·마이그레이션 검사 없이 푸시됩니다. 코드 리뷰 전에 팀 합의된 절차로 한 번 더 돌리는 것을 권장합니다.

## 로컬 CI

수동 실행(훅의 `main` 차단은 건너뜀 — TTY):

```bash
cd backend && bash scripts/pre-push.sh
```

포함: `cargo fmt --check`, `clippy -D warnings`, `cargo test --lib`, **`cargo-deny`**, **`cargo-tarpaulin`**(라인 **10%** 미만 실패; `lib`, `src/entities/*` 제외), **`check-migration-sync.sh`**(`DATABASE_URL`·`psql` 필수; `backend/.env` 또는 `.env.dev`). (`cargo-deny` / `cargo-tarpaulin` 미설치 시 push 불가)
