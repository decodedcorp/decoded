import pytest
from src.config import Application
from src.config.helpers import use_dev_mock_overrides
from src.config import Environment
from src.grpc.client.backend_client import GRPCBackendClient
from typing import Generator
from tests.grpc.fixtures import (
    get_example_text_metadata,
    get_example_image_metadata,
    get_example_link_metadata,
)


@pytest.fixture(scope="module")
def backend_grpc_client() -> Generator[GRPCBackendClient, None, None]:
    environment = Environment.from_environ(env_file=".dev.env")
    container = Application(environment=environment)
    use_dev_mock_overrides(container)

    yield container.grpc.grpc_backend_client()


def test_backend_grpc_client(
    backend_grpc_client: GRPCBackendClient,
):
    assert backend_grpc_client is not None


@pytest.mark.asyncio
async def test_update_text_metadata(
    backend_grpc_client: GRPCBackendClient,
):
    async with backend_grpc_client as client:
        assert client is not None
        response = await client.update_text_metadata(
            item_doc_id="test_item_doc_id",
            metadata=get_example_text_metadata(),
        )
    print(response)
    assert response is not None


@pytest.mark.asyncio
async def test_update_image_metadata(
    backend_grpc_client: GRPCBackendClient,
):
    async with backend_grpc_client as client:
        assert client is not None
        response = await client.update_image_metadata(
            item_doc_id="test_item_doc_id",
            metadata=get_example_image_metadata(),
        )
    print(response)
    assert response is not None


@pytest.mark.asyncio
async def test_update_link_metadata(
    backend_grpc_client: GRPCBackendClient,
):
    async with backend_grpc_client as client:
        assert client is not None
        response = await client.update_link_metadata(
            item_doc_id="test_item_doc_id",
            metadata=get_example_link_metadata(),
        )
    print(response)
    assert response is not None
