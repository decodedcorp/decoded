"""Cropping helpers for Fashion Decode composite images (#261).

The composite is left/right split (celeb on the left, product grid on the
right) in the pinner's native format. The product panel on the right is
noise for reverse image search: it's text+thumbnails that pull Vision's
results toward shopping aggregators. We crop the left 50% and search on
that instead.

The crop is never surfaced to users — it's only an intermediate input for
the search provider. The actual seed image is the downloaded high-res
original.
"""

from __future__ import annotations

from io import BytesIO

from PIL import Image


# The default split ratio for Fashion Decode composites. Empirically ~50/50;
# making this configurable is out of scope until we see non-1:1 layouts.
_DEFAULT_LEFT_RATIO = 0.5


def crop_left_panel(image_bytes: bytes, *, ratio: float = _DEFAULT_LEFT_RATIO) -> bytes:
    """Return the left `ratio` fraction of the image as JPEG bytes.

    The crop preserves full height. For non-composite images (single celeb
    photo) the crop still produces a valid image, just tighter — reverse
    search results stay relevant.
    """
    if not 0.1 <= ratio <= 0.9:
        raise ValueError(f"crop ratio must be between 0.1 and 0.9; got {ratio}")
    img = Image.open(BytesIO(image_bytes))
    w, h = img.size
    right_px = max(1, int(w * ratio))
    crop = img.crop((0, 0, right_px, h))
    out = BytesIO()
    # Convert to RGB to handle PNGs/WebPs with alpha
    crop.convert("RGB").save(out, format="JPEG", quality=90)
    return out.getvalue()
