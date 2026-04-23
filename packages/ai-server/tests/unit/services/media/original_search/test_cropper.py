"""crop_left_panel: basic geometry + format sanity."""

from __future__ import annotations

from io import BytesIO

import pytest
from PIL import Image

from src.services.media.original_search.cropper import crop_left_panel


def _make_image(w: int, h: int, color: str = "red") -> bytes:
    img = Image.new("RGB", (w, h), color)
    buf = BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def test_default_ratio_crops_left_half():
    composite = _make_image(1000, 800)
    cropped = crop_left_panel(composite)
    img = Image.open(BytesIO(cropped))
    assert img.size == (500, 800)


def test_custom_ratio():
    composite = _make_image(1000, 800)
    cropped = crop_left_panel(composite, ratio=0.3)
    img = Image.open(BytesIO(cropped))
    assert img.size == (300, 800)


def test_output_is_rgb_jpeg():
    composite = _make_image(100, 100)
    cropped = crop_left_panel(composite)
    img = Image.open(BytesIO(cropped))
    assert img.mode == "RGB"
    assert img.format == "JPEG"


def test_rejects_ratio_out_of_bounds():
    composite = _make_image(100, 100)
    with pytest.raises(ValueError):
        crop_left_panel(composite, ratio=0.05)
    with pytest.raises(ValueError):
        crop_left_panel(composite, ratio=1.0)


def test_handles_png_with_alpha():
    """PNG/WebP with alpha channel should convert to RGB cleanly."""
    img = Image.new("RGBA", (400, 400), (255, 0, 0, 128))
    buf = BytesIO()
    img.save(buf, "PNG")
    cropped = crop_left_panel(buf.getvalue())
    out = Image.open(BytesIO(cropped))
    assert out.mode == "RGB"


def test_preserves_full_height():
    composite = _make_image(1080, 2048)
    cropped = crop_left_panel(composite)
    img = Image.open(BytesIO(cropped))
    assert img.size[1] == 2048


def test_small_image_still_produces_valid_output():
    composite = _make_image(10, 20)
    cropped = crop_left_panel(composite)
    img = Image.open(BytesIO(cropped))
    # width must be at least 1px (clamped in cropper)
    assert img.size[0] >= 1
