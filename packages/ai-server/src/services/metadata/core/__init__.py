"""
Metadata processing core package

This package contains the core processing engine and service classes.
"""

from .metadata_extract_service import MetadataExtractService
from .result_aggregator import ResultAggregator
from .result_batch_service import ResultBatchService

__all__ = [
    "MetadataExtractService",
    "ResultAggregator",
    "ResultBatchService",
]