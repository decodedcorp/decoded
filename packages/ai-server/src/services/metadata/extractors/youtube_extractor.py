"""
YouTube metadata extractor using transcript API and OG tags
"""

from typing import Dict, Any, Optional
import re
from .base_extractor import BaseExtractor

try:
    from youtube_transcript_api import YouTubeTranscriptApi

    YOUTUBE_TRANSCRIPT_AVAILABLE = True
except ImportError:
    YOUTUBE_TRANSCRIPT_AVAILABLE = False


class YouTubeExtractor(BaseExtractor):
    """YouTube-specific metadata extractor"""

    def __init__(self, og_extractor=None):
        super().__init__()
        self.og_extractor = og_extractor
        self.ytt_api = YouTubeTranscriptApi()
        if not YOUTUBE_TRANSCRIPT_AVAILABLE:
            self.logger.warning(
                "youtube-transcript-api not available. Transcript extraction will be disabled."
            )

    def can_handle(self, url: str) -> bool:
        """Check if URL is a YouTube URL"""
        return self._is_youtube_url(url)

    async def extract_metadata(self, url: str) -> Dict[str, Any]:
        """
        Extract YouTube metadata including transcript and OG tags

        Returns:
            {
                'success': bool,
                'transcript': str,
                'og_tags': dict,
                'video_id': str,
                'transcript_info': dict,
                'error': str (if failed)
            }
        """
        if not self.can_handle(url):
            return {"success": False, "error": f"URL is not a YouTube URL: {url}"}

        # Extract video ID
        video_id = self._extract_video_id(url)
        if not video_id:
            return {"success": False, "error": f"Could not extract video ID from URL: {url}"}

        result = {
            "success": True,
            "video_id": video_id,
            "transcript": "",
            "og_tags": {},
            "transcript_info": {},
        }

        # Extract transcript
        if YOUTUBE_TRANSCRIPT_AVAILABLE:
            transcript_result = await self._get_youtube_transcript(video_id)
            if transcript_result["success"]:
                result["transcript"] = transcript_result["text"]
                result["transcript_info"] = {
                    "language": transcript_result["language"],
                    "is_manual": transcript_result["is_manual"],
                    "items_count": transcript_result["items_count"],
                }
            else:
                self.logger.warning(
                    f"Failed to get transcript for {video_id}: {transcript_result.get('error', 'Unknown error')}"
                )
        else:
            self.logger.warning(
                "youtube-transcript-api not available, skipping transcript extraction"
            )

        # Extract OG tags if og_extractor is available
        if self.og_extractor:
            try:
                # Note: This would require web scraping the YouTube page
                # For now, we'll leave this as a placeholder
                # og_result = await self.og_extractor.extract_og_tags(url)
                # result['og_tags'] = og_result
                pass
            except Exception as e:
                self.logger.warning(f"Failed to extract OG tags for {url}: {str(e)}")

        return result

    def _is_youtube_url(self, url: str) -> bool:
        """Check if URL is a YouTube URL"""
        youtube_pattern = r"(?:https?://)?(?:www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)"
        return bool(re.search(youtube_pattern, url.lower()))

    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL"""
        patterns = [
            r"(?:v=|\\/)([0-9A-Za-z_-]{11}).*",
            r"(?:embed\\/)([0-9A-Za-z_-]{11})",
            r"(?:v\\/)([0-9A-Za-z_-]{11})",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    async def _get_youtube_transcript(
        self, video_id: str, preferred_language: str = "ko"
    ) -> Dict[str, Any]:
        """
        Get YouTube transcript using YouTubeTranscriptApi

        Args:
            video_id: YouTube video ID
            preferred_language: Preferred language code (default: 'ko')

        Returns:
            Dictionary with transcript data or error info
        """
        if not YOUTUBE_TRANSCRIPT_AVAILABLE:
            return {"success": False, "error": "youtube-transcript-api not available"}

        try:
            # Get transcript list
            transcript_list = self.ytt_api.list(video_id)

            self.logger.debug(f"Video ID: {video_id}")
            self.logger.debug("Available transcripts:")
            for transcript in transcript_list:
                lang = transcript.language
                created = "manual" if not transcript.is_generated else "auto"
                self.logger.debug(f"  - {lang} ({created})")

            # Select transcript with priority
            transcript = None

            # 1. Preferred language manual transcript
            try:
                transcript = transcript_list.find_manually_created_transcript([preferred_language])
                self.logger.debug(f"✓ Using {preferred_language} manual transcript")
            except Exception:
                # 2. Preferred language auto-generated transcript
                try:
                    transcript = transcript_list.find_generated_transcript([preferred_language])
                    self.logger.debug(f"✓ Using {preferred_language} auto-generated transcript")
                except Exception:
                    # 3. English transcript
                    try:
                        transcript = transcript_list.find_transcript(["en"])
                        self.logger.debug("✓ Using English transcript")
                    except Exception:
                        # 4. First available transcript
                        transcript = next(iter(transcript_list))
                        self.logger.debug(f"✓ Using {transcript.language} transcript")

            # Fetch transcript data
            transcript_data = transcript.fetch()

            # Extract text
            full_text = " ".join([item.text for item in transcript_data.snippets])

            # Limit transcript length for token optimization (3000 chars ≈ 750 tokens)
            max_transcript_length = 3000
            if len(full_text) > max_transcript_length:
                full_text = full_text[:max_transcript_length]
                # Add truncation indicator
                if not full_text.endswith("."):
                    # Find last sentence boundary
                    last_period = full_text.rfind(".")
                    if last_period > max_transcript_length * 0.8:  # If period is in last 20%
                        full_text = full_text[: last_period + 1]
                full_text += " [transcript truncated for optimization]"
                original_length = len(" ".join([item.text for item in transcript_data.snippets]))
                self.logger.info(
                    f"Truncated transcript for video {video_id}: "
                    f"original length {original_length} chars -> {len(full_text)} chars"
                )

            return {
                "success": True,
                "language": transcript.language,
                "is_manual": not transcript.is_generated,
                "text": full_text,
                "items_count": len(transcript_data),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
