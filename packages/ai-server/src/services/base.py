# src/services/base.py
from typing import TypeVar, Any

T = TypeVar("T")


def resource_service(cls: T) -> T:
    """
    저수준(리소스) 서비스임을 나타내는 데코레이터

    Example:
        @resource_service
        class TypesenseService:
            pass
    """
    setattr(cls, "__service_type__", "resource")
    return cls


def business_service(cls: T) -> T:
    """
    비즈니스(상위) 서비스임을 나타내는 데코레이터

    Example:
        @business_service
        class DemoService:
            pass
    """
    setattr(cls, "__service_type__", "business")
    return cls


def get_service_type(cls: Any) -> str:
    """
    서비스의 타입을 반환하는 헬퍼 함수

    Returns:
        str: 'resource' 또는 'business' 또는 'unknown'
    """
    return getattr(cls, "__service_type__", "unknown")
