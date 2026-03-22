//! Post magazines 도메인 테스트

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use crate::domains::post_magazines::dto::GeneratePostMagazineRequest;
    use serde_json::json;
    use uuid::Uuid;

    #[test]
    fn generate_request_deserializes_post_id() {
        let id = Uuid::new_v4();
        let v = json!({ "post_id": id });
        let req: GeneratePostMagazineRequest = serde_json::from_value(v).unwrap();
        assert_eq!(req.post_id, id);
    }
}
