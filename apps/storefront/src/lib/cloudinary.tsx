import { CldImage as NextCldImage, CldImageProps } from "next-cloudinary";

interface CloudinaryImageProps extends Omit<CldImageProps, "src"> {
  src: string;
  blurDataURL?: string;
}

export function CldImage({
  src,
  alt,
  width = 600,
  height,
  blurDataURL,
  className,
  priority = false,
  ...props
}: CloudinaryImageProps) {
  // Extract public ID from full URL or use as-is
  const publicId = src.includes("cloudinary.com")
    ? src.split("/upload/").pop()?.split("/").pop() || src
    : src;

  return (
    <NextCldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height || width}
      className={className}
      priority={priority}
      placeholder={blurDataURL ? "blur" : undefined}
      blurDataURL={blurDataURL}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}

// Helper to generate optimized Cloudinary URL
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
    crop?: "fill" | "fit" | "scale";
  } = {}
): string {
  const {
    width = 600,
    height,
    quality = 80,
    format = "auto",
    crop = "fit",
  } = options;

  const transformations = [
    `f_${format}`,
    `q_${quality}`,
    `w_${width}`,
    height ? `h_${height}` : "",
    `c_${crop}`,
  ]
    .filter(Boolean)
    .join(",");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

// Helper to generate blur placeholder
export async function generateBlurPlaceholder(
  publicId: string
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/w_10,e_blur:1000,q_auto,f_webp/${publicId}`;

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/webp;base64,${base64}`;
  } catch {
    return "";
  }
}
