from pydantic import BaseModel


class QueueItem(BaseModel):
    doc_id: str
    link_url: str
    label: str


class QueueBatch(BaseModel):
    items: list[QueueItem]
