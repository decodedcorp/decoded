"use client";

import { DomeGallery } from "@/lib/components/dome";
import { useLatestImages } from "@/lib/hooks/useImages";
import { useMemo } from "react";

export function LoginBackground() {
  const { data: images, isLoading } = useLatestImages(30);

  // API 이미지를 DomeGallery 형식으로 변환
  const galleryImages = useMemo(() => {
    if (!images || images.length === 0) return undefined;
    return images
      .filter((img) => img.image_url)
      .map((img) => ({
        src: img.image_url!,
        alt: "Decoded image",
      }));
  }, [images]);

  // 로딩 중에는 렌더링하지 않음 (폴백 이미지 방지)
  if (isLoading || !galleryImages || galleryImages.length === 0) {
    return <div className="absolute inset-0 z-0 bg-black" />;
  }

  return (
    <div className="absolute inset-0 z-0">
      <DomeGallery
        images={galleryImages}
        grayscale={true}
        overlayBlurColor="#000000"
        segments={30}
        fit={0.7}
        imageBorderRadius="16px"
        dragDampening={1.5}
        autoRotate={true}
        autoRotateSpeed={0.02}
      />
    </div>
  );
}
