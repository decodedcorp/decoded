//! 구조적(아키텍처) 테스트 — CI 및 `cargo test`로 레이어/문서/마이그레이션 규칙을 강제합니다.
//!
//! 포함: 도메인 의존성, DTO 레이어, 줄 수, 도메인 테스트/README, OpenAPI 등록, DTO 네이밍·Validate,
//! AGENTS.md, 마이그레이션 등록·이름·순번 중복.

use regex::Regex;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

const DOMAIN_NAMES: &[&str] = &[
    "admin",
    "badges",
    "categories",
    "comments",
    "earnings",
    "feed",
    "post_likes",
    "post_magazines",
    "posts",
    "rankings",
    "saved_posts",
    "search",
    "solutions",
    "spots",
    "subcategories",
    "users",
    "views",
    "votes",
];

/// 도메인 간 `crate::domains::TARGET::...` 참조 허용 목록. `admin` 도메인은 별도로 전체 허용.
const DOMAIN_DEPS: &[(&str, &[&str])] = &[
    (
        "posts",
        &[
            "categories",
            "subcategories",
            "solutions",
            "comments",
            "post_likes",
            "users",
            "saved_posts",
            "admin",
            "views",
            "spots",
            // #333 verify 플로우: posts::create_post_from_raw 가 raw_posts dto(VerifyRawPostDto)를
            // 인자로 받아 prod.posts 를 생성한다. raw_posts → posts 단방향 쓰기를 위해 posts 쪽
            // 에서 raw_posts 의 dto/entity 참조를 허용.
            "raw_posts",
        ],
    ),
    ("spots", &["categories", "subcategories", "posts", "views"]),
    ("subcategories", &["categories"]),
    ("solutions", &["users", "admin"]),
    ("categories", &["admin"]),
    ("badges", &[]),
    ("comments", &[]),
    ("earnings", &[]),
    ("feed", &[]),
    ("rankings", &[]),
    ("post_likes", &[]),
    ("post_magazines", &[]),
    // #333 verify 엔드포인트가 create_post_from_raw 를 호출해 prod.posts INSERT 를 위임.
    ("raw_posts", &["posts"]),
    ("search", &[]),
    ("saved_posts", &[]),
    ("votes", &[]),
    ("users", &[]),
    ("views", &[]),
];

fn backend_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

/// `mYYYYMMDD_NNNNNN_*.rs` 형태만 마이그레이션으로 본다 (`main.rs` 등 제외).
fn list_migration_stems(mig_dir: &Path) -> Vec<String> {
    static MIG_PREFIX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^m\d{8}_\d{6}_").expect("migration file prefix regex"));
    let mut files = Vec::new();
    let Ok(rd) = fs::read_dir(mig_dir) else {
        return files;
    };
    for e in rd.flatten() {
        let name = e.file_name();
        let s = name.to_string_lossy();
        if !s.ends_with(".rs") {
            continue;
        }
        let stem = s.trim_end_matches(".rs");
        if MIG_PREFIX.is_match(stem) {
            files.push(stem.to_string());
        }
    }
    files.sort();
    files
}

fn read_source_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for e in entries.flatten() {
        let p = e.path();
        if p.is_dir() {
            read_source_files(&p, out);
        } else if p.extension().is_some_and(|x| x == "rs") {
            out.push(p);
        }
    }
}

fn domain_of_src_path(path: &Path) -> Option<String> {
    let s = path.to_string_lossy();
    let needle = "/src/domains/";
    let i = s.find(needle)?;
    let rest = &s[i + needle.len()..];
    let seg = rest.split('/').next()?;
    if seg.is_empty() {
        return None;
    }
    Some(seg.to_string())
}

/// `crate::domains::xxx::` 형태에서 참조 도메인 이름을 수집합니다.
fn domain_refs_in_source(src: &str) -> HashSet<String> {
    let mut set = HashSet::new();
    for cap in src.match_indices("crate::domains::") {
        let start = cap.0 + "crate::domains::".len();
        let rest = &src[start..];
        let name = rest
            .split("::")
            .next()
            .filter(|s| !s.is_empty())
            .map(str::to_string);
        if let Some(n) = name {
            set.insert(n);
        }
    }
    set
}

#[test]
fn domain_dependencies_match_allowed_list() {
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src/domains"), &mut files);

    let allowed: HashMap<&str, &[&str]> = DOMAIN_DEPS.iter().copied().collect();

    let mut violations = Vec::new();

    for path in &files {
        let Some(dom) = domain_of_src_path(path) else {
            continue;
        };
        if dom == "admin" {
            continue;
        }
        let Some(body) = fs::read_to_string(path).ok() else {
            continue;
        };
        let refs = domain_refs_in_source(&body);
        let allow = allowed.get(dom.as_str()).copied().unwrap_or(&[]);
        for r in refs {
            if r == dom {
                continue;
            }
            if !allow.contains(&r.as_str()) {
                violations.push(format!(
                    "{}: 도메인 `{}`에서 허용되지 않은 참조 `crate::domains::{}` (허용: {:?})",
                    path.strip_prefix(backend_root()).unwrap_or(path).display(),
                    dom,
                    r,
                    allow
                ));
            }
        }
    }

    assert!(
        violations.is_empty(),
        "도메인 의존성 위반:\n{}",
        violations.join("\n")
    );
}

#[test]
fn layer_direction_is_respected() {
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src/domains"), &mut files);
    let mut violations = Vec::new();

    for path in files {
        let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
        if file_name != "dto.rs" {
            continue;
        }
        let Ok(body) = fs::read_to_string(&path) else {
            continue;
        };
        if body.contains("::service::")
            || body.contains("::handlers::")
            || body.contains("use super::service")
            || body.contains("use super::handlers")
            || body.contains("crate::domains::") && body.contains("::service::")
        {
            violations.push(format!(
                "{}: dto.rs는 service/handlers를 참조하면 안 됩니다.",
                path.strip_prefix(backend_root()).unwrap_or(&path).display()
            ));
        }
    }

    assert!(
        violations.is_empty(),
        "DTO 레이어 위반:\n{}",
        violations.join("\n")
    );
}

const MAX_NON_SERVICE_LINES: usize = 800;

#[test]
fn files_should_not_exceed_line_budget() {
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src"), &mut files);
    let mut violations = Vec::new();
    for path in files {
        let ps = path.to_string_lossy();
        if ps.contains("/service.rs") || ps.ends_with("/tests.rs") {
            continue;
        }
        let Ok(body) = fs::read_to_string(&path) else {
            continue;
        };
        let n = body.lines().count();
        if n > MAX_NON_SERVICE_LINES {
            violations.push(format!(
                "{}: {n}줄 (service/tests 제외 파일은 {MAX_NON_SERVICE_LINES}줄 이하로 유지)",
                path.strip_prefix(backend_root()).unwrap_or(&path).display(),
            ));
        }
    }
    assert!(
        violations.is_empty(),
        "파일 크기 위반:\n{}",
        violations.join("\n")
    );
}

fn domain_has_tests(domain_dir: &Path) -> bool {
    if domain_dir.join("tests.rs").exists() {
        return true;
    }
    let mod_rs = domain_dir.join("mod.rs");
    let Ok(body) = fs::read_to_string(&mod_rs) else {
        return false;
    };
    body.contains("#[cfg(test)]")
}

#[test]
fn every_domain_has_tests() {
    let domains_root = backend_root().join("src/domains");
    let mut missing = Vec::new();
    for name in DOMAIN_NAMES {
        let dir = domains_root.join(name);
        if !dir.is_dir() {
            missing.push(format!("도메인 디렉터리 없음: {name}"));
            continue;
        }
        if !domain_has_tests(&dir) {
            missing.push(format!(
                "domains/{name}: tests.rs 또는 mod.rs 내 #[cfg(test)] 필요"
            ));
        }
    }
    assert!(
        missing.is_empty(),
        "도메인 테스트 누락:\n{}",
        missing.join("\n")
    );
}

fn openapi_paths_section() -> String {
    let p = backend_root().join("src/openapi.rs");
    fs::read_to_string(&p).expect("openapi.rs")
}

fn openapi_paths_block(openapi_src: &str) -> &str {
    let start = openapi_src.find("paths(").expect("openapi: paths(") + "paths(".len();
    let after = &openapi_src[start..];
    let end = after
        .find("\n    ),\n    tags(")
        .expect("openapi: paths 블록 끝");
    &after[..end]
}

fn openapi_registered_handlers(openapi_src: &str) -> HashSet<String> {
    let block = openapi_paths_block(openapi_src);
    let mut set = HashSet::new();
    for line in block.lines() {
        let t = line.trim();
        if t.starts_with("crate::") {
            let token = t
                .trim_end_matches(',')
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_string();
            if !token.is_empty() {
                set.insert(token);
            }
        }
    }
    set
}

static UTOIPA_HANDLER_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?s)#\[utoipa::path\((.*?)\)\]\s*pub\s+async\s+fn\s+(\w+)"#)
        .expect("utoipa regex")
});

fn utoipa_handlers_with_paths() -> Vec<(String, String, PathBuf)> {
    let mut out = Vec::new();
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src"), &mut files);
    for path in files {
        let Ok(body) = fs::read_to_string(&path) else {
            continue;
        };
        for cap in UTOIPA_HANDLER_RE.captures_iter(&body) {
            let attr = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            let fname = cap.get(2).map(|m| m.as_str()).unwrap_or("");
            let url = attr
                .lines()
                .find_map(|l| {
                    let t = l.trim();
                    let idx = t.find("path = \"")?;
                    let rest = &t[idx + 9..];
                    rest.split('"').next()
                })
                .unwrap_or("")
                .to_string();
            if !fname.is_empty() {
                out.push((url, fname.to_string(), path.clone()));
            }
        }
    }
    out
}

#[test]
fn all_handlers_registered_in_openapi() {
    let openapi_src = openapi_paths_section();
    let registered = openapi_registered_handlers(&openapi_src);
    let handlers = utoipa_handlers_with_paths();
    let mut missing = Vec::new();
    for (url, fname, file) in handlers {
        if url.contains("/test/") {
            continue;
        }
        let ok = registered
            .iter()
            .any(|line| line.ends_with(&format!("::{fname}")));
        if !ok {
            missing.push(format!(
                "{}: `#[utoipa::path]` 핸들러 `{}` ({})가 openapi.rs paths에 없습니다.",
                file.strip_prefix(backend_root()).unwrap_or(&file).display(),
                fname,
                url
            ));
        }
    }
    assert!(
        missing.is_empty(),
        "OpenAPI 등록 누락:\n{}",
        missing.join("\n")
    );
}

#[test]
fn no_test_endpoints_in_openapi() {
    let s = openapi_paths_section();
    assert!(
        !s.contains("/test/") && !s.contains("/api/v1/test"),
        "openapi.rs에 /test/ 경로가 포함되면 안 됩니다 (프로덕션 문서)."
    );
}

/// `*Dto` 접미사: 입력은 원칙적으로 `Create*Dto` / `Update*Dto` 이거나 아래 예외(중첩·값 객체·특수 액션).
/// 출력 타입은 `*Response`, `*Item`, `*Info` 등을 쓰고 `Dto` 접미사는 피합니다(기존 레거시는 예외 목록).
const DTO_NAME_EXCEPTIONS: &[&str] = &[
    // 중첩/인라인 입력
    "CreateSolutionInlineDto",
    "MediaSourceDto",
    // 메타데이터/변환 단계 입력
    "ExtractMetadataDto",
    "ConvertAffiliateDto",
    // 값 객체·통계(이름에 Dto 유지)
    "PriceDto",
    "VoteStatsDto",
    // 액션명이 동사인 입력
    "AdoptSolutionDto",
    // #333 admin verify 액션 입력
    "VerifyRawPostDto",
];

fn is_acceptable_input_dto_name(name: &str) -> bool {
    name.starts_with("Create") || name.starts_with("Update") || DTO_NAME_EXCEPTIONS.contains(&name)
}

fn is_dto_naming_policy_file(path: &Path) -> bool {
    if path.file_name().and_then(|s| s.to_str()) == Some("dto.rs") {
        return true;
    }
    let s = path.to_string_lossy();
    s.contains("/domains/admin/") && s.ends_with(".rs")
}

#[test]
fn dto_naming_conventions() {
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src/domains"), &mut files);
    files.retain(|p| is_dto_naming_policy_file(p));
    let mut violations = Vec::new();

    for path in files {
        let Ok(body) = fs::read_to_string(&path) else {
            continue;
        };
        for line in body.lines() {
            let t = line.trim();
            if !t.starts_with("pub struct ") {
                continue;
            }
            let name = t
                .strip_prefix("pub struct ")
                .and_then(|s| s.split_whitespace().next())
                .and_then(|s| s.split('{').next())
                .map(str::trim)
                .unwrap_or("");
            if !name.ends_with("Dto") {
                continue;
            }
            if !is_acceptable_input_dto_name(name) {
                violations.push(format!(
                    "{}: `{name}` — 입력 DTO는 `Create*Dto` / `Update*Dto` 패턴이거나 DTO_NAME_EXCEPTIONS에 등록하세요.",
                    path.strip_prefix(backend_root()).unwrap_or(&path).display(),
                ));
            }
        }
    }

    assert!(
        violations.is_empty(),
        "DTO 네이밍 위반:\n{}",
        violations.join("\n")
    );
}

#[test]
fn every_domain_has_readme() {
    let mut missing = Vec::new();
    for name in DOMAIN_NAMES {
        let p = backend_root()
            .join("src/domains")
            .join(name)
            .join("README.md");
        if !p.is_file() {
            missing.push(name.to_string());
        }
    }
    assert!(missing.is_empty(), "README.md 없음: {:?}", missing);
}

#[test]
fn agents_md_references_all_domains() {
    let p = backend_root().join("AGENTS.md");
    let body = fs::read_to_string(&p).expect("AGENTS.md");
    let mut missing = Vec::new();
    for name in DOMAIN_NAMES {
        if !body.contains(&format!("[{name}]")) && !body.contains(&format!("({name})")) {
            // 테이블 또는 링크 형태
            if !body.contains(&format!("domains/{name}")) {
                missing.push(name.to_string());
            }
        }
    }
    assert!(
        missing.is_empty(),
        "AGENTS.md에 도메인 링크/이름 누락: {:?}",
        missing
    );
}

#[test]
fn migration_files_registered_in_lib() {
    let mig_dir = backend_root().join("migration/src");
    let lib_path = mig_dir.join("lib.rs");
    let lib = fs::read_to_string(&lib_path).expect("migration lib.rs");

    let files = list_migration_stems(&mig_dir);

    let mut missing_mod = Vec::new();
    let mut missing_vec = Vec::new();
    for f in &files {
        if !lib.contains(&format!("mod {f};")) {
            missing_mod.push(f.clone());
        }
        if !lib.contains(&format!("Box::new({f}::Migration)")) {
            missing_vec.push(f.clone());
        }
    }

    assert!(
        missing_mod.is_empty(),
        "lib.rs에 mod 선언 누락: {:?}",
        missing_mod
    );
    assert!(
        missing_vec.is_empty(),
        "lib.rs migrations() vec 등록 누락: {:?}",
        missing_vec
    );
}

#[test]
fn migration_naming_convention() {
    let mig_dir = backend_root().join("migration/src");
    let re = regex::Regex::new(r"^m\d{8}_\d{6}_[a-z0-9][a-z0-9_]*$").expect("regex");
    let mut bad = Vec::new();
    for stem in list_migration_stems(&mig_dir) {
        if !re.is_match(&stem) {
            bad.push(stem);
        }
    }
    assert!(
        bad.is_empty(),
        "마이그레이션 파일명 규칙 위반 (mYYYYMMDD_6자리순번_설명.rs): {:?}",
        bad
    );
}

#[test]
fn migration_no_duplicate_sequence() {
    // 기존 merge된 충돌 (이미 dev에 반영, 파일명 변경 불가 — seaql_migrations 레코드 보존)
    const KNOWN_DUPLICATES: &[&str] = &["m20260402_000001_add"];

    let mig_dir = backend_root().join("migration/src");
    let mut keys: HashMap<String, Vec<String>> = HashMap::new();
    for stem in list_migration_stems(&mig_dir) {
        let key = stem.split('_').take(3).collect::<Vec<_>>().join("_");
        keys.entry(key).or_default().push(stem);
    }
    let dups: Vec<_> = keys
        .into_iter()
        .filter(|(k, v)| v.len() > 1 && !KNOWN_DUPLICATES.contains(&k.as_str()))
        .collect();
    assert!(dups.is_empty(), "같은 날짜+순번 충돌: {:?}", dups);
}

#[test]
fn input_dtos_have_validation() {
    let mut files = Vec::new();
    read_source_files(&backend_root().join("src/domains"), &mut files);
    read_source_files(&backend_root().join("src/domains/admin"), &mut files);
    let files: Vec<_> = files
        .into_iter()
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let mut violations = Vec::new();
    for path in files {
        let Ok(body) = fs::read_to_string(&path) else {
            continue;
        };
        let lines: Vec<&str> = body.lines().collect();
        for (i, line) in lines.iter().enumerate() {
            let t = line.trim();
            if !t.starts_with("pub struct ") {
                continue;
            }
            let name = t
                .strip_prefix("pub struct ")
                .and_then(|s| s.split_whitespace().next())
                .unwrap_or("");
            if !(name.starts_with("Create") || name.starts_with("Update")) || !name.ends_with("Dto")
            {
                continue;
            }
            let start = i.saturating_sub(35);
            let window = lines[start..i].join("\n");
            let has_validate = window.contains("Validate");
            if !has_validate {
                violations.push(format!(
                    "{}:{} — `{name}`에 #[derive(..., Validate, ...)] 가 필요합니다.",
                    path.strip_prefix(backend_root()).unwrap_or(&path).display(),
                    i + 1
                ));
            }
        }
    }
    assert!(
        violations.is_empty(),
        "입력 DTO Validate 누락:\n{}",
        violations.join("\n")
    );
}
