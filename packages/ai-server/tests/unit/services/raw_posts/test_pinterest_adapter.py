"""Unit tests for PinterestAdapter pure helpers (#214).

The adapter's network path is exercised via the E2E flow; here we cover
the string-munging helpers and pin→RawMedia mapping, which are the parts
that can silently drift.
"""

from __future__ import annotations

import pytest

from src.services.raw_posts.adapters.pinterest import (
    _parse_board_identifier,
    _pin_to_raw_media,
    _upgrade_to_originals,
)


class TestParseBoardIdentifier:
    def test_user_slash_slug(self):
        assert _parse_board_identifier("foo/bar") == ("foo", "bar")

    def test_leading_and_trailing_slashes(self):
        assert _parse_board_identifier("/foo/bar/") == ("foo", "bar")

    def test_full_https_url(self):
        assert _parse_board_identifier(
            "https://www.pinterest.com/foo/bar/"
        ) == ("foo", "bar")

    def test_full_http_url_without_trailing_slash(self):
        assert _parse_board_identifier(
            "http://www.pinterest.com/foo/bar"
        ) == ("foo", "bar")

    def test_regional_subdomain(self):
        # urlparse strips the jp. subdomain out of the path; user/slug comes
        # from the path only.
        assert _parse_board_identifier(
            "https://jp.pinterest.com/foo/bar/"
        ) == ("foo", "bar")

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            _parse_board_identifier("")

    def test_single_segment_raises(self):
        with pytest.raises(ValueError):
            _parse_board_identifier("onlyuser")


class TestUpgradeToOriginals:
    @pytest.mark.parametrize("seg", ["/236x/", "/474x/", "/736x/", "/1200x/"])
    def test_known_segments_upgraded(self, seg):
        url = f"https://i.pinimg.com{seg}aa/bb/cc.jpg"
        assert _upgrade_to_originals(url) == (
            "https://i.pinimg.com/originals/aa/bb/cc.jpg"
        )

    def test_originals_unchanged(self):
        url = "https://i.pinimg.com/originals/aa/bb/cc.jpg"
        assert _upgrade_to_originals(url) == url

    def test_unknown_host_unchanged(self):
        url = "https://example.test/image.png"
        assert _upgrade_to_originals(url) == url

    def test_none_unchanged(self):
        assert _upgrade_to_originals(None) is None


class TestPinToRawMedia:
    def _pin(self, **overrides):
        base = {
            "id": "123",
            "images": {"orig": {"url": "https://i.pinimg.com/originals/ab/cd/ef.jpg"}},
            "title": "  hello  ",
            "description": "",
            "pinner": {"username": "alice"},
            "link": "https://example.test/item",
        }
        base.update(overrides)
        return base

    def test_happy_path(self):
        media = _pin_to_raw_media(self._pin(), "me", "board")
        assert media is not None
        assert media.external_id == "123"
        assert media.external_url == "https://www.pinterest.com/pin/123/"
        assert media.image_url == "https://i.pinimg.com/originals/ab/cd/ef.jpg"
        assert media.caption == "hello"
        assert media.author_name == "alice"
        assert media.platform_metadata["board"] == "me/board"
        assert media.platform_metadata["title"] == "hello"
        assert media.platform_metadata["pinner"] == "alice"
        assert media.platform_metadata["link"] == "https://example.test/item"

    def test_missing_id_returns_none(self):
        assert _pin_to_raw_media({"id": None, "images": {}}, "me", "board") is None

    def test_missing_images_returns_none(self):
        pin = self._pin(images={})
        assert _pin_to_raw_media(pin, "me", "board") is None

    def test_falls_back_to_lower_resolution_then_upgrades(self):
        pin = self._pin(images={"736x": {"url": "https://i.pinimg.com/736x/a/b/c.jpg"}})
        media = _pin_to_raw_media(pin, "me", "board")
        assert media is not None
        assert media.image_url == "https://i.pinimg.com/originals/a/b/c.jpg"

    def test_grid_title_fallback(self):
        pin = self._pin(title="", description="", grid_title="grid-ish")
        media = _pin_to_raw_media(pin, "me", "board")
        assert media is not None
        assert media.caption == "grid-ish"

    def test_empty_title_empty_description_caption_none(self):
        pin = self._pin(title="", description="")
        media = _pin_to_raw_media(pin, "me", "board")
        assert media is not None
        assert media.caption is None

    def test_description_used_when_title_missing(self):
        pin = self._pin(title="", description="a detailed description")
        media = _pin_to_raw_media(pin, "me", "board")
        assert media is not None
        assert media.caption == "a detailed description"

    def test_falsy_metadata_stripped(self):
        pin = self._pin(pinner={"username": None}, link=None)
        media = _pin_to_raw_media(pin, "me", "board")
        assert media is not None
        assert "pinner" not in media.platform_metadata
        assert "link" not in media.platform_metadata


class TestAdapterRejectsNonBoardSourceType:
    @pytest.mark.asyncio
    async def test_search_not_supported_in_phase_1(self):
        from src.services.raw_posts.adapters.pinterest import PinterestAdapter
        from src.services.raw_posts.models import FetchRequest

        class _Env:
            PINTEREST_INITIAL_LIMIT = 500
            PINTEREST_INCREMENTAL_LIMIT = 25
            PINTEREST_PAGE_DELAY_MS = 500

        adapter = PinterestAdapter(_Env())
        req = FetchRequest(
            source_id="00000000-0000-0000-0000-000000000000",
            platform="pinterest",
            source_type="search",
            source_identifier="fashion",
            dispatch_id="d1",
        )
        with pytest.raises(NotImplementedError):
            await adapter.fetch(req)
