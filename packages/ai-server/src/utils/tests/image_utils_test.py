import pytest
import numpy as np
import matplotlib.pyplot as plt
from src.utils.image_utils import rotate_image
from src.utils.types import Radian


@pytest.fixture
def sample_image():
    """테스트용 얼굴 모양 이미지 생성"""
    # 100x100 크기의 검은색 이미지 생성
    image = np.zeros((100, 100, 3), dtype=np.uint8)

    # 얼굴 원형 그리기 (살구색)
    center = (50, 50)
    radius = 30
    y, x = np.ogrid[:100, :100]
    mask = (x - center[0]) ** 2 + (y - center[1]) ** 2 <= radius**2
    image[mask] = [204, 232, 255]  # 살구색

    # 눈 그리기 (파란색)
    image[40:45, 35:45] = [255, 0, 0]  # 왼쪽 눈
    image[40:45, 55:65] = [255, 0, 0]  # 오른쪽 눈

    # 코 그리기 (갈색)
    image[45:55, 48:52] = [0, 0, 139]  # 코

    # 입 그리기 (빨간색)
    for i in range(10):
        width = 20 - i  # 아래로 갈수록 줄어드는 너비
        start = 40 + i // 2  # 시작점
        image[60 + i : 61 + i, start : start + width] = [0, 0, 255]  # 빨간색 입

    return image


def visualize_rotation(original, rotated, title):
    """회전 결과를 시각화"""
    plt.figure(figsize=(10, 5))

    plt.subplot(121)
    plt.imshow(original)
    plt.title("Original Image")
    plt.axis("off")

    plt.subplot(122)
    plt.imshow(rotated)
    plt.title(f"Rotated Image ({title})")
    plt.axis("off")

    plt.show()


def test_rotate_image_90_degrees(sample_image):
    """90도 회전 테스트"""
    angle = Radian(np.pi / 2)  # 90도
    rotated = rotate_image(sample_image, angle)

    visualize_rotation(sample_image, rotated, "90 degrees")

    assert rotated.shape == sample_image.shape
    assert np.any(rotated == 255)


def test_rotate_image_45_degrees_keep_size(sample_image):
    """45도 회전 테스트 (크기 유지)"""
    angle = Radian(np.pi / 4)  # 45도
    rotated = rotate_image(sample_image, angle, keep_size=True)

    visualize_rotation(sample_image, rotated, "45 degrees (keep size)")

    assert rotated.shape == sample_image.shape


def test_rotate_image_45_degrees_adjust_size(sample_image):
    """45도 회전 테스트 (크기 조정)"""
    angle = Radian(np.pi / 4)  # 45도
    rotated = rotate_image(sample_image, angle, keep_size=False)

    visualize_rotation(sample_image, rotated, "45 degrees (adjust size)")

    assert rotated.shape[0] > sample_image.shape[0]
    assert rotated.shape[1] > sample_image.shape[1]


def test_rotate_image_360_degrees(sample_image):
    """360도 회전 테스트"""
    angle = Radian(2 * np.pi)  # 360도
    rotated = rotate_image(sample_image, angle)

    visualize_rotation(sample_image, rotated, "360 degrees")

    assert np.allclose(rotated, sample_image, atol=1)


def test_rotate_image_zero_degrees(sample_image):
    """0도 회전 테스트"""
    angle = Radian(0)
    rotated = rotate_image(sample_image, angle)

    visualize_rotation(sample_image, rotated, "0 degrees")

    assert np.array_equal(rotated, sample_image)
