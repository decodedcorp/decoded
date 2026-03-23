"""
Base extractor class for platform-specific metadata extraction
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging


class BaseExtractor(ABC):
    """Abstract base class for platform-specific metadata extractors"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    async def extract_metadata(self, url: str) -> Dict[str, Any]:
        """
        Extract metadata from the given URL
        
        Args:
            url: URL to extract metadata from
            
        Returns:
            Dictionary containing extracted metadata
            Format: {
                'success': bool,
                'transcript': str (optional),
                'og_tags': dict (optional),
                'metadata': dict (optional),
                'error': str (optional)
            }
        """
        pass
    
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """
        Check if this extractor can handle the given URL
        
        Args:
            url: URL to check
            
        Returns:
            True if this extractor can handle the URL, False otherwise
        """
        pass
    
    def _safe_extract(self, url: str, extract_func) -> Dict[str, Any]:
        """
        Safely execute extraction function with error handling
        
        Args:
            url: URL being processed
            extract_func: Function to execute
            
        Returns:
            Result dictionary with success/error status
        """
        try:
            result = extract_func()
            return {
                'success': True,
                **result
            }
        except Exception as e:
            error_msg = f"Error extracting metadata from {url}: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }