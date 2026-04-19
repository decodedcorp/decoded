"""Platform-independent raw posts collection pipeline (#258).

This package holds:
- `models`: shared Pydantic / protocol definitions (RawMedia, RawPostResult, SourceAdapter).
- `pipeline`: RawPostsPipeline that runs an adapter, downloads images, uploads to R2
  and returns results. No DB writes — api-server receives results via gRPC callback.
- `jobs`: ARQ job wrapper that runs the pipeline + calls the api-server callback.
- `adapters/`: per-platform SourceAdapter implementations. v1 ships `MockAdapter`
  only — real Pinterest (#214) / Instagram (#259) adapters come in follow-up PRs.
"""

from .models import FetchRequest, RawMedia, RawPostResult, SourceAdapter
from .pipeline import RawPostsPipeline

__all__ = [
    "FetchRequest",
    "RawMedia",
    "RawPostResult",
    "RawPostsPipeline",
    "SourceAdapter",
]
