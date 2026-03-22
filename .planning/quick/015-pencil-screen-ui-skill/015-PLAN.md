# Quick Task 015: Pencil Screen UI Skill

## Task Description
Pencil Screen 이미지와 pencil.dev 문서를 참고하여 UI 코드를 작성하는 Claude Code 스킬 생성

## Tasks

### Task 1: Create Skill Directory Structure
- [x] `.claude/skills/pencil-screen-ui/` 디렉토리 생성
- [x] `.claude/skills/pencil-screen-ui/references/` 디렉토리 생성

### Task 2: Create SKILL.md
- [x] 스킬 메타데이터 정의 (name, description, allowed-tools, model)
- [x] 트리거 조건 명시
- [x] 입력 소스 정의 (pencil-screen 이미지, decoded.pen)
- [x] 생성 프로세스 문서화
- [x] 디자인 토큰 매핑 테이블
- [x] 컴포넌트 템플릿 코드 예제
- [x] 검증 체크리스트
- [x] 사용 예시

### Task 3: Create Reference Documents
- [x] `references/design-tokens.md` - decoded.pen 토큰 → Tailwind 매핑
- [x] `references/screen-analysis.md` - 4개 pencil-screen 이미지 분석

## Output
```
.claude/skills/pencil-screen-ui/
├── SKILL.md                    # 메인 스킬 파일
└── references/
    ├── design-tokens.md        # 디자인 토큰 레퍼런스
    └── screen-analysis.md      # 화면 분석 문서
```

## Dependencies
- docs/pencil-screen/ (4개 스크린샷)
- docs/design-system/decoded.pen
- packages/web/lib/design-system/
