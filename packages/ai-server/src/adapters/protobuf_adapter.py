"""
Protobuf adapter for converting domain models to protobuf messages
"""
import json
from typing import Optional
from src.database.models.content import ProcessedLinkMetadata, ProcessedImageMetadata
from src.grpc.proto.outbound import outbound_pb2


class ProtobufAdapter:
    """Adapter for converting domain models to protobuf messages"""
    
    @staticmethod
    def to_link_metadata(metadata: ProcessedLinkMetadata) -> outbound_pb2.LinkMetadata:
        """
        Convert ProcessedLinkMetadata to protobuf LinkMetadata
        
        Args:
            metadata: Domain model for link metadata
            
        Returns:
            outbound_pb2.LinkMetadata instance
        """
        # Convert QA pairs to protobuf format
        qa_pairs = []
        for qa in metadata.qa_pairs:
            qa_pairs.append(outbound_pb2.QAPair(
                question=qa.question,
                answer=qa.answer
            ))
        
        # Convert metadata dict values to string (JSON serialize complex types)
        metadata_map = {}
        for k, v in metadata.metadata.items():
            if isinstance(v, (list, dict)):
                metadata_map[k] = json.dumps(v, ensure_ascii=False)
            else:
                metadata_map[k] = str(v) if v is not None else ''
        
        # Create LinkMetadata protobuf instance
        return outbound_pb2.LinkMetadata(
            link_type=metadata.link_type,
            summary=metadata.summary or '',
            qna=qa_pairs,
            metadata=metadata_map,
            keywords=metadata.keywords or []
        )
    
    @staticmethod
    def to_image_metadata(metadata: ProcessedImageMetadata) -> outbound_pb2.ImageMetadata:
        """
        Convert ProcessedImageMetadata to protobuf ImageMetadata
        
        Args:
            metadata: Domain model for image metadata
            
        Returns:
            outbound_pb2.ImageMetadata instance
        """
        qa_pairs = []
        for qa in metadata.qna:
            qa_pairs.append(outbound_pb2.QAPair(
                question=qa.question,
                answer=qa.answer
            ))

        return outbound_pb2.ImageMetadata(
            summary=metadata.description or '',
            objects=metadata.objects or [],
            context=metadata.context or '',
            style=metadata.style or '',
            metadata=metadata.metadata or {},
            category=metadata.category or '',
            qa_pairs=qa_pairs
        )
    
    @staticmethod
    def to_batch_item_result(
        item_id: str,
        url: str,
        item_type: str,
        status: str,
        error_message: Optional[str] = None,
        link_metadata: Optional[ProcessedLinkMetadata] = None,
        image_metadata: Optional[ProcessedImageMetadata] = None
    ) -> outbound_pb2.BatchItemResult:
        """
        Create BatchItemResult protobuf message
        
        Args:
            item_id: Item identifier (solution_id from backend)
            url: Item URL
            item_type: Type of item ("link" or "image")
            status: Processing status
            error_message: Optional error message
            link_metadata: Optional link metadata
            image_metadata: Optional image metadata
            
        Returns:
            outbound_pb2.BatchItemResult instance
        """
        batch_item = outbound_pb2.BatchItemResult(
            item_id=item_id,
            url=url,
            type=item_type,
            status=status
        )
        
        if error_message:
            batch_item.error_message = error_message
        
        if link_metadata:
            batch_item.link_metadata.CopyFrom(
                ProtobufAdapter.to_link_metadata(link_metadata)
            )
        
        if image_metadata:
            batch_item.image_metadata.CopyFrom(
                ProtobufAdapter.to_image_metadata(image_metadata)
            )
        
        return batch_item