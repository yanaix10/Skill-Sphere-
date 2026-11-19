import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  inView?: boolean;
  ratio?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  fallback = "https://cdn.21st.dev/assets/mirror/cc/ccf6e78beb7f7cc5b720069cb4f86696912be109614973d49df165d1e51631c8.svg",
  alt,
  className,
  ratio = 16 / 9,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-muted/60 w-full"
      style={{ aspectRatio: ratio }}
    >
      <img
        src={currentSrc}
        alt={alt || "Post thumbnail"}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setCurrentSrc(fallback)}
        className={cn(
          "h-full w-full object-cover transition-all duration-300",
          isLoaded ? "opacity-100" : "opacity-30 blur-xs",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default LazyImage;

