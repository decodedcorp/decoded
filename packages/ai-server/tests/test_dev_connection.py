import pytest
from src.config import Application
from src.config.helpers import use_dev_mock_overrides
from src.config import Environment


@pytest.fixture(scope="module")
def container():
    environment = Environment.from_environ(env_file=".dev.env")
    container = Application(environment=environment)
    use_dev_mock_overrides(container)

    yield container


@pytest.fixture(scope="module")
def backend_manager(container):
    return container.managers.backend_manager()


@pytest.fixture(scope="module")
def redis_manager(container):
    return container.managers.redis_manager()


def test_backend_client(backend_manager):
    assert backend_manager is not None
    assert backend_manager.health_check() == "OK"


def test_redis_client(redis_manager):
    assert redis_manager is not None
    assert redis_manager.health_check()
