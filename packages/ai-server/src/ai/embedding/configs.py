from pydantic import BaseModel


class ClipModel(BaseModel):
    model_name: str
    tokenizer: str
    max_length: int
    padding: str
    truncation: bool
    vector_size: int
