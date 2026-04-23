//! Dev tool: write the current OpenAPI spec to `openapi.json`.
//!
//! Usage: `cargo run --bin dump_openapi`
//! Path can be overridden with the `OPENAPI_OUT` env var.
use decoded_api::openapi::ApiDoc;
use std::fs;
use std::io::Write;
use utoipa::OpenApi;

fn main() {
    let out = std::env::var("OPENAPI_OUT").unwrap_or_else(|_| "openapi.json".to_string());
    let json = ApiDoc::openapi()
        .to_pretty_json()
        .expect("serialize openapi");
    let mut f = fs::File::create(&out).expect("create openapi.json");
    f.write_all(json.as_bytes()).expect("write openapi.json");
    f.write_all(b"\n").expect("newline");
    println!("Wrote {} ({} bytes)", out, json.len());
}
