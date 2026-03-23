from src.ai.embedding.configs import ClipModel

fashion_clip = ClipModel(
    model_name="patrickjohncyh/fashion-clip",
    tokenizer="openai/clip-vit-base-patch32",
    max_length=512,
    padding="max_length",
    truncation=True,
    vector_size=512,
)
