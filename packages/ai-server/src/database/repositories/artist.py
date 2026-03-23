# 아티스트 관련 레포지토리 (해당 코드는 현재 예시 코드입니다.)
from typing import List, Dict
from pathlib import Path
from .base import BaseRepository
from ..models import Artist, ArtistImage, ArtistEmbedding


class ArtistRepository(BaseRepository[Artist]):
    def __init__(self, db):
        super().__init__(Artist, db)

    def get_artist_images(self, artist_id: str) -> List[Path]:
        """특정 아티스트의 이미지 경로 조회"""
        images = (
            self.db.query(ArtistImage).filter(ArtistImage.artist_id == artist_id).all()
        )
        return [Path(img.image_path) for img in images]

    def save_embedding(self, artist_id: str, embedding: bytes) -> None:
        """아티스트 임베딩 저장/업데이트"""
        embedding_record = (
            self.db.query(ArtistEmbedding)
            .filter(ArtistEmbedding.artist_id == artist_id)
            .first()
        )

        if embedding_record:
            embedding_record.embedding_vector = embedding
        else:
            embedding_record = ArtistEmbedding(
                artist_id=artist_id, embedding_vector=embedding
            )
            self.db.add(embedding_record)

        self.db.commit()
