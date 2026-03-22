//! Solutions 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::solutions::dto::PriceDto;

    #[test]
    fn price_dto_serializes_amount_and_currency() {
        let p = PriceDto {
            amount: "1200.50".to_string(),
            currency: "KRW".to_string(),
        };
        let v = serde_json::to_value(&p).unwrap();
        assert_eq!(v["amount"], "1200.50");
        assert_eq!(v["currency"], "KRW");
    }
}
