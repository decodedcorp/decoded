use std::time::Instant;

use decoded_api::services::DecodedAIGrpcClient;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .init();
    let url = std::env::var("AI_SERVER_GRPC_URL")
        .or_else(|_| std::env::var("DECODED_AI_GRPC_URL"))
        .unwrap_or_else(|_| "http://127.0.0.1:50052".to_string());
    let client = DecodedAIGrpcClient::new(url)?;

    let urls = [
        "https://www.cettire.com/kr/products/dolce-gabbana-dg-essentials-zipped-bomber-jacket-923032405",
        "https://m.bunjang.co.kr/products/382126814?ref=%EC%97%B0%EA%B4%80%EC%83%81%ED%92%88",
        "https://x.com/kimsbinvesting/status/2012912190043369915",
        "https://www.mytheresa.com/kr/en/men/jw-anderson-embroidered-wool-polo-sweater-beige-p01104769?feed_num=P01104769&feed_des=JWAnderson&feed_mwg=clothing",
    ];

    let mut handles = Vec::with_capacity(urls.len());
    for target_url in urls {
        let client = client.clone();
        let url = target_url.to_string();
        let handle = tokio::spawn(async move {
            let start = Instant::now();
            let result = client
                .extract_og_data(url.clone())
                .await
                .map_err(|err| err.to_string());
            let elapsed = start.elapsed();
            (url, elapsed, result)
        });
        handles.push(handle);
    }

    for handle in handles {
        let (url, elapsed, result) = handle.await?;
        match result {
            Ok(og) => tracing::info!(url, ?elapsed, ?og, "ExtractOGData"),
            Err(err) => tracing::warn!(url, ?elapsed, %err, "ExtractOGData"),
        }
    }

    Ok(())
}
