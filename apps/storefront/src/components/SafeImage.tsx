"use client";

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends ImageProps {
    fallbackSrc?: string;
}

export function SafeImage({ src, alt, fallbackSrc = '/placeholder-image.png', ...props }: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
}
