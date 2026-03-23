# Git 워크플로 (모노레포 · 백엔드 포함)

## `main` 직접 push 금지

모노레포 **루트**의 [scripts/git-pre-push.sh](../../../scripts/git-pre-push.sh)가 `pre-push` 훅으로 연결되면, 원격 ref가 `refs/heads/main`(또는 `master`)일 때 push를 거부합니다. **토픽 브랜치 → PR → 머지**로 진행하세요.

### 훅 설치 (권장: `core.hooksPath`)

저장소 **루트**(`decoded-monorepo/` — `package.json` 있는 곳)에서:

```bash
chmod +x scripts/git-pre-push.sh .githooks/pre-push packages/ai-server/scripts/pre-push.sh
git config core.hooksPath .githooks
```

또는 루트 [Justfile](../../../Justfile): `just hook`

이후 `git push` 시 자동으로 루트 스크립트가 실행됩니다 (`main`/`master` 직접 push는 거부).

**just (api-server 패키지)** 를 쓰는 경우에도, 훅은 **모노레포 루트**의 `core.hooksPath=.githooks` 를 쓰는 것이 맞습니다. [packages/api-server/justfile](../justfile)의 `hook` 레시피가 루트를 가리킵니다.

원격 저장소에서는 **브랜치 보호 규칙**으로 `main` 직접 push를 막는 것을 함께 권장합니다(훅은 `--no-verify`로 우회 가능).

자동 CI는 **로컬 `pre-push`** 를 사용합니다(GitHub Actions 워크플로 없음).

**`git push --no-verify`는 쓰지 마세요.** 훅을 건너뛰면 로컬 검사 없이 푸시됩니다.

## 로컬 CI (전체 모노레포)

저장소 루트에서:

```bash
bun run ci:local
# 또는
bash scripts/git-pre-push.sh
```

포함(순서): **프론트 슬롯**(현재 플레이스홀더) → **ai-server**(선택 — 아래) → **api-server**([packages/api-server/scripts/pre-push.sh](../scripts/pre-push.sh): `cargo fmt`, clippy, `cargo test --lib`, `cargo-deny`, `cargo-tarpaulin`, `check-migration-sync.sh` — `DATABASE_URL`·`psql` 등 기존과 동일).

- **ai-server**([packages/ai-server/scripts/pre-push.sh](../../ai-server/scripts/pre-push.sh): flake8, `black --check`, pytest CI 마커 서브집합): 기본 **건너뜀**(레거시 flake8 이슈 정리 후 팀에서 켜기). 실행하려면 `RUN_AI_SERVER_CI=1 bun run ci:local`. 단독: `cd packages/ai-server && bun run ci:local`. `uv`·`uv sync --group dev` 필요.
- ai-server 강제 스킵: `SKIP_AI_SERVER_CI=1`( `RUN_AI_SERVER_CI` 와 함께 쓸 일 거의 없음)
- api-server만 (기존): `bash packages/api-server/scripts/pre-push.sh`
