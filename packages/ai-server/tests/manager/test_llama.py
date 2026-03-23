import pytest
from src.config import Application
from src.config.helpers import use_dev_mock_overrides
from src.config import Environment


@pytest.fixture(scope="module")
def llama_manager():
    environment = Environment.from_environ(env_file=".dev.env")
    container = Application(environment=environment)
    use_dev_mock_overrides(container)

    yield container.managers.llama_manager()


def test_llama_manager(llama_manager):
    assert llama_manager is not None
    assert llama_manager.health_check()


@pytest.mark.asyncio
async def test_llama_manager_completion(llama_manager):
    response = await llama_manager.completion("나을 위해서 시를 써줘")
    print(response)
    assert response is not None
