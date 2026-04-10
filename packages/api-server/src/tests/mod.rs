//! 라이브러리 내 테스트 전용 (`#[cfg(test)] pub mod tests` 하위). `unwrap` 등은 Clippy 예외.
//! (`lib.rs`의 `#[allow(clippy::disallowed_methods)]`가 이 모듈 트리에 적용됨.)

pub mod fixtures;
pub mod helpers;

#[cfg(test)]
mod architecture;

#[cfg(test)]
pub use helpers::*;
