from typing import Optional
import torch
from transformers import AutoProcessor
from PIL import Image
from src.config._logger import LoggerService
from src.ai.embedding.models import ClipModel, fashion_clip
from transformers import CLIPProcessor, CLIPModel
from transformers import CLIPTokenizerFast


class ClipEmbeddingModel:
    def __init__(
        self,
        clip_model: Optional[ClipModel] = fashion_clip,
        device: Optional[str] = None,
        logger: Optional[LoggerService] = None,
    ):
        """
        임베딩 모델을 초기화합니다.

        Args:
            model_name: 모델 이름 또는 경로
            model_class: 모델 클래스 (예: CLIPModel)
            tokenizer_class: 토크나이저 클래스 (예: CLIPTokenizerFast)
        """
        self.logger = logger
        self.device = device or (
            "cuda"
            if torch.cuda.is_available()
            else "mps" if torch.backends.mps.is_available() else "cpu"
        )
        self.logger.info(f"Embedding Model Using device: {self.device}")
        self.clip_model = clip_model
        self.model = None
        self.processor = None
        self.tokenizer = None
        self.vector_size = None
        self.model_load()

    def model_load(self, image_usage: bool = False):
        self.logger.info(f"Loading CLIP model from {self.clip_model.model_name}")
        self.vector_size = self.clip_model.vector_size
        try:
            self.model = CLIPModel.from_pretrained(
                self.clip_model.model_name,
                cache_dir="./download/models",
            ).to(self.device)
            self.tokenizer = CLIPTokenizerFast.from_pretrained(
                self.clip_model.model_name,
                cache_dir="./download/models",
            )
            self.logger.info("CLIP model loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading CLIP model: {e}")
            raise e

        # 디바이스 이동 전 상태 확인
        self.logger.info(f"Moving model to device: {self.device}")
        self.model.eval()  # 평가 모드로 설정

        # 디바이스 이동 후 상태 확인
        for name, param in self.model.named_parameters():
            if torch.isnan(param).any():
                self.logger.warning(f"NaN weights found after device move in {name}")

        if image_usage:
            self.processor = CLIPProcessor.from_pretrained(self.clip_model.model_name)
            self.logger.info("Processor loaded successfully")

    def get_multimodal_embedding(
        self,
        text: str,
        image: Image.Image,
        max_length: int = 77,
        return_tensors: str = "pt",
    ) -> torch.Tensor:
        """
        이미지와 텍스트의 다중 모델 임베딩을 생성합니다.

        Args:
            image: PIL 이미지
            text: 입력 텍스트
            max_length: 최대 시퀀스 길이
            return_tensors: 반환 텐서 타입

        Returns:
            이미지와 텍스트의 다중 모델 임베딩 텐서
        """
        inputs = self.processor(
            text=[text],
            images=image,
            padding=True,
            truncation=True,
            max_length=max_length,
        ).to(self.device)

        with torch.no_grad():
            text_embeddings = self.model.get_text_features(**inputs)
            image_embeddings = self.model.get_image_features(**inputs)

        return (text_embeddings + image_embeddings) / 2

    def get_text_embedding(
        self,
        text: str,
        max_length: int = 77,
        return_tensors: str = "pt",
    ) -> torch.Tensor:
        """
        텍스트 임베딩을 생성합니다.

        Args:
            text: 입력 텍스트 또는 텍스트 리스트
            max_length: 최대 시퀀스 길이
            return_tensors: 반환 텐서 타입

        Returns:
            텍스트 임베딩 텐서
        """
        inputs = self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors=return_tensors,
        ).to(self.device)

        with torch.no_grad():
            text_outputs = self.model.get_text_features(**inputs)
            norm = text_outputs.norm(dim=-1, keepdim=True)
            text_features = text_outputs / norm

        return text_features

    def get_text_embeddings_batch(
        self,
        texts: list[str],
        max_length: int = 77,
        return_tensors: str = "pt",
    ) -> torch.Tensor:
        """
        여러 텍스트의 임베딩을 한번에 생성합니다.

        Args:
            products: 제품 정보 딕셔너리 리스트
            max_length: 최대 시퀀스 길이
            return_tensors: 반환 텐서 타입

        Returns:
            텍스트 임베딩 텐서들
        """
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors=return_tensors,
        ).to(self.device)

        with torch.no_grad():
            text_outputs = self.model.get_text_features(**inputs)
            norm = text_outputs.norm(dim=-1, keepdim=True)
            text_features = text_outputs / norm

        return text_features

    def get_image_embedding(
        self, image: Image.Image, return_tensors: str = "pt"
    ) -> torch.Tensor:
        """
        이미지 임베딩을 생성합니다.

        Args:
            image: PIL 이미지 또는 이미지 리스트
            return_tensors: 반환 텐서 타입

        Returns:
            이미지 임베딩 텐서

        """
        if self.processor is None:
            self.processor = AutoProcessor.from_pretrained(self.clip_model.model_name)
            self.logger.info("Processor loaded successfully")
        # 이미지 전처리
        inputs = self.processor(images=image, return_tensors=return_tensors).to(
            self.device
        )

        # 임베딩 생성
        with torch.no_grad():
            image_embeddings = self.model.get_image_features(**inputs)

        return image_embeddings
