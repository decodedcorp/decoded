"""
Prompt template manager for LLM adapters using Jinja2
"""

from pathlib import Path
from typing import Optional
import logging

try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    raise ImportError(
        "jinja2 is required for PromptManager. Please install it with: pip install jinja2"
    )


class PromptManager:
    """
    Manages prompt templates for LLM adapters with locale support
    """

    def __init__(self):
        """Initialize the prompt manager with template directory"""
        self.logger = logging.getLogger(__name__)

        # Set up template directory
        template_dir = Path(__file__).parent / "templates"
        template_dir.mkdir(exist_ok=True)

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)), trim_blocks=True, lstrip_blocks=True
        )

        self.logger.info(f"PromptManager initialized with template directory: {template_dir}")

    def _get_language_instruction(self, locale: Optional[str]) -> str:
        """
        Convert locale to language instruction

        Args:
            locale: Language locale code (e.g., 'ko', 'ja', 'zh', 'en')

        Returns:
            Language instruction string
        """
        if not locale:
            return ""

        language_map = {
            "ko": "Please respond in Korean.",
            "ja": "Please respond in Japanese.",
            "zh": "Please respond in Chinese.",
            "zh-cn": "Please respond in Simplified Chinese.",
            "zh-tw": "Please respond in Traditional Chinese.",
            "en": "",  # English is default, no instruction needed
        }

        return language_map.get(locale.lower(), "")

    def render_template(self, template_name: str, locale: Optional[str] = None, **kwargs) -> str:
        """
        Render a template with given parameters

        Args:
            template_name: Name of the template file (e.g., 'link_analysis.j2')
            locale: Language locale code for response language
            **kwargs: Additional template variables

        Returns:
            Rendered template string

        Raises:
            TemplateNotFound: If template file doesn't exist
            TemplateError: If template rendering fails
        """
        try:
            template = self.env.get_template(template_name)
            language_instruction = self._get_language_instruction(locale)

            # Render template with all provided variables
            rendered = template.render(language_instruction=language_instruction, **kwargs)

            self.logger.debug(
                f"Successfully rendered template: {template_name} with locale: {locale}"
            )
            return rendered

        except Exception as e:
            self.logger.error(f"Failed to render template {template_name}: {str(e)}")
            raise

    def template_exists(self, template_name: str) -> bool:
        """
        Check if a template file exists

        Args:
            template_name: Name of the template file

        Returns:
            True if template exists, False otherwise
        """
        try:
            self.env.get_template(template_name)
            return True
        except:
            return False

    def list_templates(self) -> list[str]:
        """
        List all available template files

        Returns:
            List of template file names
        """
        template_dir = Path(__file__).parent / "templates"
        if not template_dir.exists():
            return []

        return [f.name for f in template_dir.glob("*.j2") if f.is_file()]

    def get_supported_locales(self) -> list[str]:
        """
        Get list of supported locale codes

        Returns:
            List of supported locale codes
        """
        return ["ko", "ja", "zh", "zh-cn", "zh-tw", "en"]
