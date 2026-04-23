"""Selector logic: domain exclusion + source priority + URL resize strip.

Explicitly verifies that we do NOT prefer any specific domain beyond the
hard-exclusion list.
"""

from __future__ import annotations

from src.services.media.original_search.models import OriginalCandidate
from src.services.media.original_search.selector import (
    select_best_candidate,
    strip_resize_params,
    url_variants,
)


class TestExclusion:
    def test_excludes_pinimg(self):
        ins = [
            OriginalCandidate("https://i.pinimg.com/originals/aa/bb.jpg", "partial_match"),
            OriginalCandidate("https://img.news.co.kr/123.jpg", "partial_match"),
        ]
        out = select_best_candidate(ins)
        assert len(out) == 1
        assert "pinimg" not in out[0].url

    def test_excludes_reddit_thumbs(self):
        ins = [
            OriginalCandidate("https://b.thumbs.redditmedia.com/xyz.jpg", "partial_match"),
            OriginalCandidate("https://www.reddit.com/r/kpop/comments/x.jpg", "partial_match"),
        ]
        assert select_best_candidate(ins) == []

    def test_excludes_meta_crawler_proxies(self):
        ins = [
            OriginalCandidate(
                "https://lookaside.fbsbx.com/lookaside/crawler/instagram/ABC/0/image.jpg",
                "partial_match",
            ),
            OriginalCandidate(
                "https://lookaside.instagram.com/seo/google_widget/crawler/?media_id=123",
                "partial_match",
            ),
        ]
        assert select_best_candidate(ins) == []

    def test_excludes_twimg_thumbs_tiktok_ytimg(self):
        ins = [
            OriginalCandidate("https://pbs.twimg.com/media/xyz.jpg", "partial_match"),
            OriginalCandidate(
                "https://video.twimg.com/tweet_video_thumb/x.jpg", "partial_match"
            ),
            OriginalCandidate("https://www.tiktok.com/api/img/?itemId=1", "partial_match"),
            OriginalCandidate("https://i.ytimg.com/vi/x/frame0.jpg", "partial_match"),
        ]
        assert select_best_candidate(ins) == []

    def test_no_preferred_news_domain_boost(self):
        """Neither a kpop news site nor a marketplace is boosted/penalized —
        ordering is purely by source priority when domains are not excluded."""
        news_partial = OriginalCandidate(
            "https://ssl.pstatic.net/news/foo.jpg", "partial_match"
        )
        shop_full = OriginalCandidate(
            "https://media.bunjang.co.kr/product/xxx.jpg", "full_match"
        )
        ranked = select_best_candidate([news_partial, shop_full])
        # `full_match` wins over `partial_match` regardless of domain.
        assert ranked[0] == shop_full
        assert ranked[1] == news_partial

    def test_dedupes_exact_url(self):
        url = "https://example.com/a.jpg"
        ins = [
            OriginalCandidate(url, "partial_match"),
            OriginalCandidate(url, "partial_match"),
            OriginalCandidate(url, "full_match"),
        ]
        out = select_best_candidate(ins)
        assert len(out) == 1

    def test_full_match_outranks_partial(self):
        partial = OriginalCandidate("https://example.com/p.jpg", "partial_match")
        full = OriginalCandidate("https://other.com/f.jpg", "full_match")
        out = select_best_candidate([partial, full])
        assert out[0] == full
        assert out[1] == partial

    def test_empty_input(self):
        assert select_best_candidate([]) == []


class TestStripResizeParams:
    def test_strip_width(self):
        assert (
            strip_resize_params("https://cdn.x/img.jpg?w=540")
            == "https://cdn.x/img.jpg"
        )

    def test_strip_type_param(self):
        assert (
            strip_resize_params(
                "https://ssl.pstatic.net/news/x.jpg?type=w540"
            )
            == "https://ssl.pstatic.net/news/x.jpg"
        )

    def test_strip_multiple_params_preserves_others(self):
        stripped = strip_resize_params(
            "https://x.com/a.jpg?w=800&keep=yes&height=600"
        )
        assert "w=" not in stripped
        assert "height=" not in stripped
        assert "keep=yes" in stripped

    def test_no_query_params(self):
        url = "https://cdn.x/img.jpg"
        assert strip_resize_params(url) == url

    def test_preserves_url_if_no_match(self):
        url = "https://cdn.x/img.jpg?custom=value"
        assert strip_resize_params(url) == url

    def test_invalid_url_returns_as_is(self):
        assert strip_resize_params("") == ""


class TestUrlVariants:
    def test_returns_stripped_then_original(self):
        variants = url_variants("https://cdn.x/img.jpg?w=540")
        assert variants == [
            "https://cdn.x/img.jpg",
            "https://cdn.x/img.jpg?w=540",
        ]

    def test_returns_single_when_no_strip(self):
        variants = url_variants("https://cdn.x/img.jpg")
        assert variants == ["https://cdn.x/img.jpg"]
