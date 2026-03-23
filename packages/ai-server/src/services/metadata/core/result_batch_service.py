"""
ResultBatchService: ARQ job 결과를 버퍼링하고 배치로 백엔드에 전송하는 서비스
"""
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
import logging
from src.managers.redis._manager import RedisManager
from src.grpc.client.backend_client import GRPCBackendClient
from src.config._environment import Environment
from src.config._logger import LoggerService
from src.database.models.content import LinkProcessingResult, ProcessingStatus
from src.services.base import resource_service


@resource_service
class ResultBatchService:
    """ARQ job 결과를 버퍼링하고 배치로 백엔드에 전송하는 서비스"""

    BUFFER_KEY = "pending_link_results"
    MAX_RETRIES = 3

    def __init__(
        self,
        redis_manager: RedisManager,
        backend_client: GRPCBackendClient,
        environment: Environment,
        logger: LoggerService = None,
    ):
        self.redis_manager = redis_manager
        self.backend_client = backend_client
        self.environment = environment
        self.logger = logger or logging.getLogger(__name__)
        self.batch_size = environment.RESULT_BATCH_SIZE

    async def buffer_result(self, result: LinkProcessingResult) -> bool:
        """
        결과를 Redis 리스트에 추가
        
        Args:
            result: LinkProcessingResult 객체
            
        Returns:
            True if buffered successfully, False otherwise
        """
        try:
            # FAILED 상태는 버퍼링하지 않음 (FailedItemsManager가 처리)
            if result.status == ProcessingStatus.FAILED:
                self.logger.debug(f"Skipping FAILED result for {result.url}")
                return False

            # SUCCESS, PARTIAL 상태만 버퍼링
            # Pydantic v2: model_dump(mode='json')으로 JSON 호환 형식 변환
            result_dict = result.model_dump(mode='json')
            result_json = json.dumps(result_dict)

            await self.redis_manager.rpush(self.BUFFER_KEY, result_json)
            self.logger.info(
                f"Buffered result for {result.url} (status: {result.status.value}, solution_id: {result.item_id})"
            )
            return True
        except Exception as e:
            self.logger.error(f"Error buffering result: {str(e)}", exc_info=True)
            return False

    async def flush_results(self, max_batch_size: int = None) -> Dict[str, Any]:
        """
        버퍼된 결과를 배치로 백엔드에 전송
        
        Args:
            max_batch_size: 최대 배치 크기 (None이면 환경 변수 값 사용)
            
        Returns:
            전송 결과 통계 딕셔너리
        """
        batch_size = max_batch_size or self.batch_size

        try:
            # 1. Redis LRANGE로 결과 가져오기
            results_json = await self.redis_manager.lrange(
                self.BUFFER_KEY, 0, batch_size - 1
            )

            if not results_json:
                return {"flushed": 0, "success": True, "message": "No results to flush"}

            # 2. JSON 파싱 및 배치 데이터 구성
            batch_data = self._build_batch_data(results_json)
            batch_id = f"batch_{int(time.time())}"

            # 3. 재시도 로직으로 백엔드 전송
            success = await self._send_with_retry(batch_id, batch_data)

            if success:
                # 4. 성공 시 Redis LTRIM으로 처리된 항목 제거
                await self.redis_manager.ltrim(
                    self.BUFFER_KEY, len(results_json), -1
                )
                self.logger.info(
                    f"Flushed {len(results_json)} results successfully (batch_id: {batch_id})"
                )
                return {
                    "flushed": len(results_json),
                    "success": True,
                    "batch_id": batch_id,
                }
            else:
                # 5. 실패 시 Redis에 유지 (다음 flush에서 재시도)
                self.logger.warning(
                    f"Failed to flush {len(results_json)} results, "
                    "keeping in buffer for next attempt"
                )
                return {
                    "flushed": 0,
                    "success": False,
                    "error": "Backend send failed after retries",
                }

        except Exception as e:
            self.logger.error(f"Error flushing results: {str(e)}", exc_info=True)
            return {"flushed": 0, "success": False, "error": str(e)}

    async def get_pending_count(self) -> int:
        """
        버퍼에 대기 중인 결과 수 조회
        
        Returns:
            대기 중인 결과 수
        """
        try:
            count = await self.redis_manager.llen(self.BUFFER_KEY)
            return count
        except Exception as e:
            self.logger.error(f"Error getting pending count: {str(e)}")
            return 0

    def _build_batch_data(self, results_json: List[str]) -> Dict[str, Any]:
        """
        Redis에서 가져온 JSON 문자열들을 배치 형식으로 변환
        
        Args:
            results_json: JSON 문자열 리스트
            
        Returns:
            백엔드가 기대하는 배치 데이터 형식
        """
        results = []
        success_count = 0
        partial_count = 0
        failed_count = 0

        for result_json in results_json:
            try:
                result_dict = json.loads(result_json)
                
                # LinkProcessingResult를 백엔드 형식으로 변환
                # item_id는 solution_id와 동일한 값 (백엔드에서 솔루션 식별에 사용)
                result_item = {
                    "item_id": result_dict.get("item_id"),
                    "url": result_dict.get("url"),
                    "type": "link",
                    "status": result_dict.get("status"),  # "success", "partial", "failed"
                }

                # 에러 메시지 추가
                if result_dict.get("error_message"):
                    result_item["error_message"] = result_dict.get("error_message")

                # 메타데이터 변환
                if result_dict.get("metadata"):
                    metadata = result_dict.get("metadata")
                    link_metadata = {
                        "link_type": metadata.get("link_type", "other"),
                        "summary": metadata.get("summary"),
                        "qna": [
                            {"question": q.get("question"), "answer": q.get("answer")}
                            for q in metadata.get("qa_pairs", [])
                        ],
                        "keywords": metadata.get("keywords", []),
                        "metadata": metadata.get("metadata", {}),
                    }
                    result_item["link_metadata"] = link_metadata

                results.append(result_item)

                # 통계 카운트
                status = result_dict.get("status")
                if status == "success":
                    success_count += 1
                elif status == "partial":
                    partial_count += 1
                else:
                    failed_count += 1

            except Exception as e:
                self.logger.error(f"Error parsing result JSON: {str(e)}")
                continue

        return {
            "results": results,
            "statistics": {
                "total_count": len(results),
                "success_count": success_count,
                "partial_count": partial_count,
                "failed_count": failed_count,
                "processing_time_seconds": 0.0,  # 배치 전송이므로 처리 시간 없음
            },
        }

    async def _send_with_retry(
        self, batch_id: str, batch_data: Dict[str, Any]
    ) -> bool:
        """
        재시도 로직으로 배치 전송
        
        Args:
            batch_id: 배치 ID
            batch_data: 배치 데이터
            
        Returns:
            True if sent successfully, False otherwise
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                async with self.backend_client as client:
                    success = await client.send_processed_batch(
                        batch_id=batch_id, batch_data=batch_data
                    )
                    if success:
                        return True
                    else:
                        self.logger.warning(
                            f"Backend rejected batch {batch_id} (attempt {attempt + 1}/{self.MAX_RETRIES})"
                        )
            except (ConnectionError, asyncio.TimeoutError) as e:
                self.logger.warning(
                    f"Connection error on attempt {attempt + 1}/{self.MAX_RETRIES}: {str(e)}"
                )
                if attempt < self.MAX_RETRIES - 1:
                    wait_time = 2 ** attempt * 2  # 2s, 4s, 8s
                    self.logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
            except Exception as e:
                self.logger.error(
                    f"Unexpected error on attempt {attempt + 1}: {str(e)}", exc_info=True
                )
                if attempt < self.MAX_RETRIES - 1:
                    wait_time = 2 ** attempt * 2
                    await asyncio.sleep(wait_time)
                else:
                    return False

        return False
