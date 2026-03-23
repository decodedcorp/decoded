from pydantic import BaseModel
from typing import Optional


class GetOGTagsResponse(BaseModel):
    """Response model for OG tag extraction (legacy compatibility)"""
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_site_name: Optional[str] = None
    og_url: Optional[str] = None
    og_type: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary for Redis storage"""
        return self.model_dump()