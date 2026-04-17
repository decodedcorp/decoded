from grpc import aio
from typing import Optional, Dict, Any
from src.grpc.proto.outbound import outbound_pb2, outbound_pb2_grpc
from src.adapters.protobuf_adapter import ProtobufAdapter
from src.database.models.content import ProcessedLinkMetadata, QAPair
from src.config._logger import LoggerService
import time
import asyncio


class GRPCBackendClient:
    def __init__(
        self,
        host: str,
        port: int,
        logger: LoggerService,
    ):
        self.address = f"{host}:{port}"
        self.logger = logger
        self.channel = None
        self.stub = None

    async def __aenter__(self):
        """비동기 컨텍스트 매니저 시작"""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """비동기 컨텍스트 매니저 종료"""
        await self.close()

    async def connect(self, timeout: float = 30.0):
        """
        gRPC 채널 연결

        Args:
            timeout: 연결 타임아웃 (초). 기본값 30초
        """
        try:
            self.logger.info(
                f"Attempting to connect to backend server at {self.address} (timeout: {timeout}s)"
            )
            self.channel = aio.insecure_channel(self.address)
            self.stub = outbound_pb2_grpc.MetadataStub(self.channel)

            # 타임아웃을 포함한 연결 시도
            try:
                await asyncio.wait_for(self.channel.channel_ready(), timeout=timeout)
                self.logger.info(f"Successfully connected to backend server at {self.address}")
            except asyncio.TimeoutError:
                self.logger.error(
                    f"Connection timeout: Failed to connect to backend server at {self.address} "
                    f"within {timeout} seconds. Please check if the server is running and accessible."
                )
                if self.channel:
                    await self.close()
                raise ConnectionError(
                    f"Failed to connect to backend server at {self.address} "
                    f"within {timeout} seconds"
                )
            except Exception as e:
                self.logger.error(f"Connection error: {e}")
                if self.channel:
                    await self.close()
                raise
        except (ConnectionError, asyncio.TimeoutError):
            # 이미 처리된 에러는 그대로 전파
            raise
        except Exception as e:
            self.logger.error(f"Failed to connect: {e}")
            if self.channel:
                await self.close()
            raise

    async def close(self, grace: Optional[float] = None):
        """gRPC 채널 종료"""
        if self.channel:
            try:
                await self.channel.close()
                self.logger.info("Disconnected from backend server")
            except Exception as e:
                self.logger.error(f"Error closing channel: {e}")
            finally:
                self.channel = None
                self.stub = None

    async def send_processed_batch(self, batch_id: str, batch_data: Dict[str, Any]) -> bool:
        """배치 처리 결과를 백엔드로 전송 - Now using ProtobufAdapter"""
        try:
            # Results is now a flat list with 'type' field
            results = batch_data.get("results", [])
            link_results = [r for r in results if r.get("type") == "link"]
            # Note: Image results are not currently implemented
            # image_results = [r for r in results if r.get('type') == 'image']

            link_count = len(link_results)
            self.logger.info(f"Sending processed batch {batch_id} with {link_count} link items")

            # Convert batch_data to protobuf format using adapter
            batch_items = []

            # Process link results
            for link_result in link_results:
                # Combine link_metadata and ai_analysis_result into ProcessedLinkMetadata
                processed_metadata = self._build_processed_link_metadata(link_result)

                batch_item = ProtobufAdapter.to_batch_item_result(
                    item_id=link_result["item_id"],
                    url=link_result["url"],
                    item_type="link",
                    status=link_result["status"],
                    error_message=link_result.get("error_message"),
                    link_metadata=processed_metadata,
                )
                batch_items.append(batch_item)

            # Note: Image results processing is not currently implemented
            # Image results will be added in a future update

            # Create statistics
            stats = batch_data.get("statistics", {})
            batch_statistics = outbound_pb2.BatchStatistics(
                total_count=stats.get("total_count", 0),
                success_count=stats.get("success_count", 0),
                partial_count=stats.get("partial_count", 0),
                failed_count=stats.get("failed_count", 0),
                processing_time_seconds=stats.get("processing_time_seconds", 0.0),
            )

            # Create request
            request = outbound_pb2.ProcessedBatchRequest(
                batch_id=batch_id,
                processing_timestamp=int(time.time()),
                results=batch_items,
                statistics=batch_statistics,
            )

            # Send request
            response = await self.stub.ProcessedBatchUpdate(request)

            if response.success:
                self.logger.info(f"Successfully sent batch {batch_id}: {response.message}")
                return True
            else:
                self.logger.warning(f"Backend rejected batch {batch_id}: {response.message}")
                return False

        except Exception as e:
            self.logger.error(f"Error sending processed batch {batch_id}: {e}")
            return False

    def _build_processed_link_metadata(
        self, link_result: Dict[str, Any]
    ) -> Optional[ProcessedLinkMetadata]:
        """
        Build ProcessedLinkMetadata from link_result dict

        Combines link_metadata into ProcessedLinkMetadata object
        """
        link_metadata = link_result.get("link_metadata", {})

        # If no metadata at all, return None
        if not link_metadata:
            return None

        # Extract Q&A pairs
        qa_pairs = []
        if link_metadata.get("qna"):
            qa_pairs = [
                QAPair(question=q.get("question", ""), answer=q.get("answer", ""))
                for q in link_metadata.get("qna", [])
            ]

        return ProcessedLinkMetadata(
            link_type=link_metadata.get("link_type", "other"),
            summary=link_metadata.get("summary"),
            qa_pairs=qa_pairs,
            keywords=link_metadata.get("keywords"),
            citations=link_metadata.get("citations"),
            metadata=link_metadata.get("metadata", {}),
        )
