import io
import logging
from typing import Optional
from PIL import Image


class ImageCompressor:
    """Utility class for compressing images to meet size requirements"""

    def __init__(self, max_size_mb: int = 50):
        self.max_size_mb = max_size_mb
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.logger = logging.getLogger(__name__)

    def compress_if_needed(self, image_data: bytes) -> bytes:
        """
        Compress image if it exceeds size limit

        Args:
            image_data: Original image data

        Returns:
            Compressed image data (or original if under limit)
        """
        if len(image_data) <= self.max_size_bytes:
            self.logger.info(f"Image size {len(image_data)} bytes is within limit")
            return image_data

        self.logger.info(
            f"Image size {len(image_data)} bytes exceeds {self.max_size_mb}MB limit, compressing..."
        )

        try:
            compressed_data = self._compress_image(image_data)
            if compressed_data:
                compression_ratio = len(compressed_data) / len(image_data)
                self.logger.info(
                    f"Compressed image from {len(image_data)} to {len(compressed_data)} bytes "
                    f"(ratio: {compression_ratio:.2f})"
                )
                return compressed_data
            else:
                self.logger.warning("Failed to compress image, returning original")
                return image_data
        except Exception as e:
            self.logger.error(f"Error compressing image: {str(e)}")
            return image_data

    def _compress_image(self, image_data: bytes) -> Optional[bytes]:
        """
        Compress image using progressive quality reduction

        Args:
            image_data: Original image data

        Returns:
            Compressed image data or None if failed
        """
        try:
            # Open image with PIL
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary (for JPEG compression)
            if image.mode in ("RGBA", "LA", "P"):
                # Create white background for transparent images
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = background
            elif image.mode != "RGB":
                image = image.convert("RGB")

            # Try different compression strategies
            for strategy in self._get_compression_strategies():
                compressed_data = self._apply_compression_strategy(image, strategy)
                if compressed_data and len(compressed_data) <= self.max_size_bytes:
                    return compressed_data

            # If all strategies fail, try extreme compression
            return self._extreme_compression(image)

        except Exception as e:
            self.logger.error(f"Error in image compression: {str(e)}")
            return None

    def _get_compression_strategies(self):
        """Get list of compression strategies to try"""
        return [
            {"quality": 85, "optimize": True},
            {"quality": 75, "optimize": True},
            {"quality": 65, "optimize": True},
            {"quality": 55, "optimize": True},
            {"quality": 45, "optimize": True},
            {"quality": 35, "optimize": True, "progressive": True},
            {"quality": 25, "optimize": True, "progressive": True},
        ]

    def _apply_compression_strategy(self, image: Image.Image, strategy: dict) -> Optional[bytes]:
        """
        Apply a specific compression strategy

        Args:
            image: PIL Image object
            strategy: Compression parameters

        Returns:
            Compressed image data or None
        """
        try:
            output_buffer = io.BytesIO()

            # Apply resize if image is very large
            max_dimension = 2048
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                self.logger.info(f"Resized image to {new_size}")

            # Save with compression
            image.save(output_buffer, format="JPEG", **strategy)
            return output_buffer.getvalue()

        except Exception as e:
            self.logger.error(f"Error applying compression strategy {strategy}: {str(e)}")
            return None

    def _extreme_compression(self, image: Image.Image) -> Optional[bytes]:
        """
        Apply extreme compression as last resort

        Args:
            image: PIL Image object

        Returns:
            Extremely compressed image data or None
        """
        try:
            # Resize to smaller dimensions
            max_dimension = 1024
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            output_buffer = io.BytesIO()
            image.save(output_buffer, format="JPEG", quality=15, optimize=True, progressive=True)

            compressed_data = output_buffer.getvalue()
            self.logger.warning(
                f"Applied extreme compression: {len(compressed_data)} bytes, "
                f"quality may be significantly reduced"
            )
            return compressed_data

        except Exception as e:
            self.logger.error(f"Error in extreme compression: {str(e)}")
            return None
