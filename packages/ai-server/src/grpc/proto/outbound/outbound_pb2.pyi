from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QAPair(_message.Message):
    __slots__ = ("question", "answer")
    QUESTION_FIELD_NUMBER: _ClassVar[int]
    ANSWER_FIELD_NUMBER: _ClassVar[int]
    question: str
    answer: str
    def __init__(self, question: _Optional[str] = ..., answer: _Optional[str] = ...) -> None: ...

class LinkMetadata(_message.Message):
    __slots__ = ("summary", "qna", "metadata", "keywords", "link_type")
    class MetadataEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    SUMMARY_FIELD_NUMBER: _ClassVar[int]
    QNA_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    KEYWORDS_FIELD_NUMBER: _ClassVar[int]
    LINK_TYPE_FIELD_NUMBER: _ClassVar[int]
    summary: str
    qna: _containers.RepeatedCompositeFieldContainer[QAPair]
    metadata: _containers.ScalarMap[str, str]
    keywords: _containers.RepeatedScalarFieldContainer[str]
    link_type: str
    def __init__(self, summary: _Optional[str] = ..., qna: _Optional[_Iterable[_Union[QAPair, _Mapping]]] = ..., metadata: _Optional[_Mapping[str, str]] = ..., keywords: _Optional[_Iterable[str]] = ..., link_type: _Optional[str] = ...) -> None: ...

class BatchItemResult(_message.Message):
    __slots__ = ("item_id", "url", "type", "status", "error_message", "link_metadata")
    ITEM_ID_FIELD_NUMBER: _ClassVar[int]
    URL_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    LINK_METADATA_FIELD_NUMBER: _ClassVar[int]
    item_id: str
    url: str
    type: str
    status: str
    error_message: str
    link_metadata: LinkMetadata
    def __init__(self, item_id: _Optional[str] = ..., url: _Optional[str] = ..., type: _Optional[str] = ..., status: _Optional[str] = ..., error_message: _Optional[str] = ..., link_metadata: _Optional[_Union[LinkMetadata, _Mapping]] = ...) -> None: ...

class ImageMetadata(_message.Message):
    __slots__ = ("summary", "objects", "context", "style", "metadata", "category", "qa_pairs")
    class MetadataEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    SUMMARY_FIELD_NUMBER: _ClassVar[int]
    OBJECTS_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    STYLE_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    QA_PAIRS_FIELD_NUMBER: _ClassVar[int]
    summary: str
    objects: _containers.RepeatedScalarFieldContainer[str]
    context: str
    style: str
    metadata: _containers.ScalarMap[str, str]
    category: str
    qa_pairs: _containers.RepeatedCompositeFieldContainer[QAPair]
    def __init__(self, summary: _Optional[str] = ..., objects: _Optional[_Iterable[str]] = ..., context: _Optional[str] = ..., style: _Optional[str] = ..., metadata: _Optional[_Mapping[str, str]] = ..., category: _Optional[str] = ..., qa_pairs: _Optional[_Iterable[_Union[QAPair, _Mapping]]] = ...) -> None: ...

class BatchStatistics(_message.Message):
    __slots__ = ("total_count", "success_count", "partial_count", "failed_count", "processing_time_seconds")
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_COUNT_FIELD_NUMBER: _ClassVar[int]
    PARTIAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    FAILED_COUNT_FIELD_NUMBER: _ClassVar[int]
    PROCESSING_TIME_SECONDS_FIELD_NUMBER: _ClassVar[int]
    total_count: int
    success_count: int
    partial_count: int
    failed_count: int
    processing_time_seconds: float
    def __init__(self, total_count: _Optional[int] = ..., success_count: _Optional[int] = ..., partial_count: _Optional[int] = ..., failed_count: _Optional[int] = ..., processing_time_seconds: _Optional[float] = ...) -> None: ...

class ProcessedBatchRequest(_message.Message):
    __slots__ = ("batch_id", "processing_timestamp", "results", "statistics")
    BATCH_ID_FIELD_NUMBER: _ClassVar[int]
    PROCESSING_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    RESULTS_FIELD_NUMBER: _ClassVar[int]
    STATISTICS_FIELD_NUMBER: _ClassVar[int]
    batch_id: str
    processing_timestamp: int
    results: _containers.RepeatedCompositeFieldContainer[BatchItemResult]
    statistics: BatchStatistics
    def __init__(self, batch_id: _Optional[str] = ..., processing_timestamp: _Optional[int] = ..., results: _Optional[_Iterable[_Union[BatchItemResult, _Mapping]]] = ..., statistics: _Optional[_Union[BatchStatistics, _Mapping]] = ...) -> None: ...

class ProcessedBatchResponse(_message.Message):
    __slots__ = ("success", "message", "processed_count")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    PROCESSED_COUNT_FIELD_NUMBER: _ClassVar[int]
    success: bool
    message: str
    processed_count: int
    def __init__(self, success: bool = ..., message: _Optional[str] = ..., processed_count: _Optional[int] = ...) -> None: ...
