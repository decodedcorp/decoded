import pytest
from src.config import Application
from src.config.helpers import use_dev_mock_overrides
from src.config import Environment
from PIL import Image
import base64
import io


@pytest.fixture(scope="module")
def container():
    environment = Environment.from_environ(env_file=".dev.env")
    container = Application(environment=environment)
    use_dev_mock_overrides(container)

    yield container


@pytest.fixture(scope="module")
def metadata_service(container):
    return container.services.metadata_service()


@pytest.mark.asyncio
async def test_metadata_service(metadata_service):
    assert metadata_service is not None
    response = await metadata_service.extract_image(
        "https://www.vestiairecollective.com/women-clothing/jackets/chanel/?product_id=43553377&setLocale=20.en.KRW&authfee=false"
    )
    print("response", response.base64_image)
    if "base64," in response.base64_image:
        response.base64_image = response.base64_image.split("base64,")[1]
    assert response is not None
    img_data = base64.b64decode(response.base64_image)
    img = Image.open(io.BytesIO(img_data))

    # 이미지 표시
    img.show()  # 시스템 기본 이미지 뷰어로 열기
