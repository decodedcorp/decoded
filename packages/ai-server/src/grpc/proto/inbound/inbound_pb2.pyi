from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ExtractOGDataRequest(_message.Message):
    __slots__ = ("url",)
    URL_FIELD_NUMBER: _ClassVar[int]
    url: str
    def __init__(self, url: _Optional[str] = ...) -> None: ...

class ExtractOGDataResponse(_message.Message):
    __slots__ = ("success", "url", "title", "description", "image", "site_name", "error_message")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    URL_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    IMAGE_FIELD_NUMBER: _ClassVar[int]
    SITE_NAME_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    url: str
    title: str
    description: str
    image: str
    site_name: str
    error_message: str
    def __init__(
        self,
        success: bool = ...,
        url: _Optional[str] = ...,
        title: _Optional[str] = ...,
        description: _Optional[str] = ...,
        image: _Optional[str] = ...,
        site_name: _Optional[str] = ...,
        error_message: _Optional[str] = ...,
    ) -> None: ...

class AnalyzeLinkRequest(_message.Message):
    __slots__ = ("url", "post_id", "title", "description", "site_name")
    URL_FIELD_NUMBER: _ClassVar[int]
    POST_ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    SITE_NAME_FIELD_NUMBER: _ClassVar[int]
    url: str
    post_id: str
    title: str
    description: str
    site_name: str
    def __init__(
        self,
        url: _Optional[str] = ...,
        post_id: _Optional[str] = ...,
        title: _Optional[str] = ...,
        description: _Optional[str] = ...,
        site_name: _Optional[str] = ...,
    ) -> None: ...

class AnalyzeLinkResponse(_message.Message):
    __slots__ = ("success", "message", "batch_id")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    BATCH_ID_FIELD_NUMBER: _ClassVar[int]
    success: bool
    message: str
    batch_id: str
    def __init__(
        self, success: bool = ..., message: _Optional[str] = ..., batch_id: _Optional[str] = ...
    ) -> None: ...

class QAPair(_message.Message):
    __slots__ = ("question", "answer")
    QUESTION_FIELD_NUMBER: _ClassVar[int]
    ANSWER_FIELD_NUMBER: _ClassVar[int]
    question: str
    answer: str
    def __init__(self, question: _Optional[str] = ..., answer: _Optional[str] = ...) -> None: ...

class ProductMetadata(_message.Message):
    __slots__ = ("category", "sub_category", "brand", "price", "currency", "materials", "origin")
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SUB_CATEGORY_FIELD_NUMBER: _ClassVar[int]
    BRAND_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_FIELD_NUMBER: _ClassVar[int]
    MATERIALS_FIELD_NUMBER: _ClassVar[int]
    ORIGIN_FIELD_NUMBER: _ClassVar[int]
    category: str
    sub_category: str
    brand: str
    price: str
    currency: str
    materials: _containers.RepeatedScalarFieldContainer[str]
    origin: str
    def __init__(
        self,
        category: _Optional[str] = ...,
        sub_category: _Optional[str] = ...,
        brand: _Optional[str] = ...,
        price: _Optional[str] = ...,
        currency: _Optional[str] = ...,
        materials: _Optional[_Iterable[str]] = ...,
        origin: _Optional[str] = ...,
    ) -> None: ...

class ArticleMetadata(_message.Message):
    __slots__ = ("category", "sub_category", "author", "published_date", "reading_time", "topics")
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SUB_CATEGORY_FIELD_NUMBER: _ClassVar[int]
    AUTHOR_FIELD_NUMBER: _ClassVar[int]
    PUBLISHED_DATE_FIELD_NUMBER: _ClassVar[int]
    READING_TIME_FIELD_NUMBER: _ClassVar[int]
    TOPICS_FIELD_NUMBER: _ClassVar[int]
    category: str
    sub_category: str
    author: str
    published_date: str
    reading_time: str
    topics: _containers.RepeatedScalarFieldContainer[str]
    def __init__(
        self,
        category: _Optional[str] = ...,
        sub_category: _Optional[str] = ...,
        author: _Optional[str] = ...,
        published_date: _Optional[str] = ...,
        reading_time: _Optional[str] = ...,
        topics: _Optional[_Iterable[str]] = ...,
    ) -> None: ...

class VideoMetadata(_message.Message):
    __slots__ = ("category", "sub_category", "channel", "duration", "view_count", "upload_date")
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SUB_CATEGORY_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    DURATION_FIELD_NUMBER: _ClassVar[int]
    VIEW_COUNT_FIELD_NUMBER: _ClassVar[int]
    UPLOAD_DATE_FIELD_NUMBER: _ClassVar[int]
    category: str
    sub_category: str
    channel: str
    duration: str
    view_count: str
    upload_date: str
    def __init__(
        self,
        category: _Optional[str] = ...,
        sub_category: _Optional[str] = ...,
        channel: _Optional[str] = ...,
        duration: _Optional[str] = ...,
        view_count: _Optional[str] = ...,
        upload_date: _Optional[str] = ...,
    ) -> None: ...

class OtherMetadata(_message.Message):
    __slots__ = ("category", "sub_category", "content_type")
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SUB_CATEGORY_FIELD_NUMBER: _ClassVar[int]
    CONTENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    category: str
    sub_category: str
    content_type: str
    def __init__(
        self,
        category: _Optional[str] = ...,
        sub_category: _Optional[str] = ...,
        content_type: _Optional[str] = ...,
    ) -> None: ...

class AnalyzeLinkDirectResponse(_message.Message):
    __slots__ = (
        "success",
        "message",
        "summary",
        "keywords",
        "qna",
        "product_metadata",
        "article_metadata",
        "video_metadata",
        "other_metadata",
        "error_message",
    )
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    SUMMARY_FIELD_NUMBER: _ClassVar[int]
    KEYWORDS_FIELD_NUMBER: _ClassVar[int]
    QNA_FIELD_NUMBER: _ClassVar[int]
    PRODUCT_METADATA_FIELD_NUMBER: _ClassVar[int]
    ARTICLE_METADATA_FIELD_NUMBER: _ClassVar[int]
    VIDEO_METADATA_FIELD_NUMBER: _ClassVar[int]
    OTHER_METADATA_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    message: str
    summary: str
    keywords: _containers.RepeatedScalarFieldContainer[str]
    qna: _containers.RepeatedCompositeFieldContainer[QAPair]
    product_metadata: ProductMetadata
    article_metadata: ArticleMetadata
    video_metadata: VideoMetadata
    other_metadata: OtherMetadata
    error_message: str
    def __init__(
        self,
        success: bool = ...,
        message: _Optional[str] = ...,
        summary: _Optional[str] = ...,
        keywords: _Optional[_Iterable[str]] = ...,
        qna: _Optional[_Iterable[_Union[QAPair, _Mapping]]] = ...,
        product_metadata: _Optional[_Union[ProductMetadata, _Mapping]] = ...,
        article_metadata: _Optional[_Union[ArticleMetadata, _Mapping]] = ...,
        video_metadata: _Optional[_Union[VideoMetadata, _Mapping]] = ...,
        other_metadata: _Optional[_Union[OtherMetadata, _Mapping]] = ...,
        error_message: _Optional[str] = ...,
    ) -> None: ...

class AnalyzeImageRequest(_message.Message):
    __slots__ = ("image_data", "item_id", "category_rules")
    IMAGE_DATA_FIELD_NUMBER: _ClassVar[int]
    ITEM_ID_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_RULES_FIELD_NUMBER: _ClassVar[int]
    image_data: str
    item_id: str
    category_rules: _containers.RepeatedCompositeFieldContainer[CategoryRule]
    def __init__(
        self,
        image_data: _Optional[str] = ...,
        item_id: _Optional[str] = ...,
        category_rules: _Optional[_Iterable[_Union[CategoryRule, _Mapping]]] = ...,
    ) -> None: ...

class CategoryRule(_message.Message):
    __slots__ = ("category", "sub_categories")
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SUB_CATEGORIES_FIELD_NUMBER: _ClassVar[int]
    category: str
    sub_categories: _containers.RepeatedScalarFieldContainer[str]
    def __init__(
        self, category: _Optional[str] = ..., sub_categories: _Optional[_Iterable[str]] = ...
    ) -> None: ...

class ItemWithCoordinates(_message.Message):
    __slots__ = ("sub_category", "type", "top", "left")
    SUB_CATEGORY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    TOP_FIELD_NUMBER: _ClassVar[int]
    LEFT_FIELD_NUMBER: _ClassVar[int]
    sub_category: str
    type: str
    top: int
    left: int
    def __init__(
        self,
        sub_category: _Optional[str] = ...,
        type: _Optional[str] = ...,
        top: _Optional[int] = ...,
        left: _Optional[int] = ...,
    ) -> None: ...

class ItemList(_message.Message):
    __slots__ = ("items",)
    ITEMS_FIELD_NUMBER: _ClassVar[int]
    items: _containers.RepeatedCompositeFieldContainer[ItemWithCoordinates]
    def __init__(
        self, items: _Optional[_Iterable[_Union[ItemWithCoordinates, _Mapping]]] = ...
    ) -> None: ...

class AnalyzeImageResponse(_message.Message):
    __slots__ = (
        "success",
        "subject",
        "title",
        "artist_name",
        "group_name",
        "context",
        "items",
        "error_message",
    )
    class ItemsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: ItemList
        def __init__(
            self, key: _Optional[str] = ..., value: _Optional[_Union[ItemList, _Mapping]] = ...
        ) -> None: ...

    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    SUBJECT_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    ARTIST_NAME_FIELD_NUMBER: _ClassVar[int]
    GROUP_NAME_FIELD_NUMBER: _ClassVar[int]
    CONTEXT_FIELD_NUMBER: _ClassVar[int]
    ITEMS_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    subject: str
    title: str
    artist_name: str
    group_name: str
    context: str
    items: _containers.MessageMap[str, ItemList]
    error_message: str
    def __init__(
        self,
        success: bool = ...,
        subject: _Optional[str] = ...,
        title: _Optional[str] = ...,
        artist_name: _Optional[str] = ...,
        group_name: _Optional[str] = ...,
        context: _Optional[str] = ...,
        items: _Optional[_Mapping[str, ItemList]] = ...,
        error_message: _Optional[str] = ...,
    ) -> None: ...
