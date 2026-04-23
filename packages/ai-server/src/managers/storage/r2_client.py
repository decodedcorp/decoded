"""Cloudflare R2 client (S3-compatible) for raw-posts bucket.

boto3 is synchronous; all I/O from async contexts should be wrapped in
`asyncio.to_thread` to avoid blocking the event loop.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import boto3
from botocore.client import Config


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class R2PutResult:
    key: str
    url: str


class R2Client:
    """Thin wrapper around boto3 S3 client configured for Cloudflare R2.

    Bucket, credentials and the public URL base are injected via the
    `Environment` object so the same manager can back other buckets in the
    future by swapping env vars.
    """

    def __init__(self, environment) -> None:
        account_id = environment.RAW_POSTS_R2_ACCOUNT_ID
        self._bucket = environment.RAW_POSTS_R2_BUCKET
        self._public_url = (environment.RAW_POSTS_R2_PUBLIC_URL or "").rstrip("/")
        self._configured = bool(account_id and environment.RAW_POSTS_R2_ACCESS_KEY_ID)

        if not self._configured:
            logger.warning(
                "R2Client: RAW_POSTS_R2 credentials not configured; "
                "uploads will fail. Set RAW_POSTS_R2_ACCOUNT_ID / "
                "RAW_POSTS_R2_ACCESS_KEY_ID / RAW_POSTS_R2_SECRET_ACCESS_KEY."
            )
            self._s3 = None
            return

        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
        self._s3 = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=environment.RAW_POSTS_R2_ACCESS_KEY_ID,
            aws_secret_access_key=environment.RAW_POSTS_R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    @property
    def bucket(self) -> str:
        return self._bucket

    @property
    def public_url_base(self) -> str:
        return self._public_url

    def is_configured(self) -> bool:
        return self._configured

    def put(self, key: str, data: bytes, content_type: str) -> R2PutResult:
        """Upload bytes to R2. Sync — wrap with `asyncio.to_thread` in async code."""
        if not self._configured or self._s3 is None:
            raise RuntimeError("R2Client not configured")
        self._s3.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        url = f"{self._public_url}/{key}" if self._public_url else ""
        return R2PutResult(key=key, url=url)

    def get(self, key: str) -> bytes:
        """Download bytes from R2. Sync — wrap with `asyncio.to_thread` in async code."""
        if not self._configured or self._s3 is None:
            raise RuntimeError("R2Client not configured")
        resp = self._s3.get_object(Bucket=self._bucket, Key=key)
        return resp["Body"].read()

    def build_public_url(self, key: str) -> Optional[str]:
        if not self._public_url:
            return None
        return f"{self._public_url}/{key}"
