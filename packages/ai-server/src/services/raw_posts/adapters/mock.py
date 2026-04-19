"""MockAdapter — used in #258 to verify the pipeline end-to-end.

Returns a deterministic, fixed list of RawMedia pointing at small public
placeholder images so R2 upload succeeds without any external credentials.
Replaced by real Pinterest adapter in #214.
"""

from __future__ import annotations

from typing import List

from ..models import FetchRequest, RawMedia


class MockAdapter:
    platform: str = "pinterest"

    async def fetch(self, req: FetchRequest) -> List[RawMedia]:
        limit = max(1, min(req.limit, 5))
        items: List[RawMedia] = []
        for i in range(1, limit + 1):
            external_id = f"mock-{req.dispatch_id}-{i}"
            # picsum.photos returns a small real JPEG; good enough for e2e.
            image_url = f"https://picsum.photos/seed/{external_id}/400/600.jpg"
            items.append(
                RawMedia(
                    external_id=external_id,
                    external_url=f"https://example.test/mock/{external_id}",
                    image_url=image_url,
                    caption=f"Mock post {i} for {req.source_identifier}",
                    author_name="mock-author",
                    platform_metadata={
                        "mock": True,
                        "source_type": req.source_type,
                        "source_identifier": req.source_identifier,
                    },
                )
            )
        return items
