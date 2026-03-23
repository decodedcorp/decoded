from typing import Generic, TypeVar, Type, Optional, List
from ..models import Base
from ..connection import get_db

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """기본 Repository 클래스"""

    def __init__(self, model: Type[ModelType]):
        self.model = model
        self.db = get_db()

    def get(self, id: str) -> Optional[ModelType]:
        """ID로 단일 항목 조회"""
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self) -> List[ModelType]:
        """모든 항목 조회"""
        return self.db.query(self.model).all()

    def create(self, **kwargs) -> ModelType:
        """새 항목 생성"""
        instance = self.model(**kwargs)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def update(self, id: str, **kwargs) -> Optional[ModelType]:
        """항목 업데이트"""
        instance = self.get(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            self.db.commit()
            self.db.refresh(instance)
        return instance

    def delete(self, id: str) -> bool:
        """항목 삭제"""
        instance = self.get(id)
        if instance:
            self.db.delete(instance)
            self.db.commit()
            return True
        return False
