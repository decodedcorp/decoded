//! Warehouse domain tests

use super::service::{clamp_limit, DEFAULT_LIMIT, MAX_LIMIT};

#[test]
fn clamp_limit_uses_default_when_none() {
    assert_eq!(clamp_limit(None), DEFAULT_LIMIT);
}

#[test]
fn clamp_limit_respects_upper_bound() {
    assert_eq!(clamp_limit(Some(MAX_LIMIT + 1000)), MAX_LIMIT);
}

#[test]
fn clamp_limit_respects_lower_bound() {
    assert_eq!(clamp_limit(Some(0)), 1);
}

#[test]
fn clamp_limit_passes_through_valid() {
    assert_eq!(clamp_limit(Some(123)), 123);
}
