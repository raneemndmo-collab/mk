/**
 * SafeMediaThumb — A small, reliable image thumbnail component.
 *
 * Handles broken images gracefully using React state (not DOM hacks).
 * Shows a skeleton while loading, a placeholder icon on error.
 * Works on iPhone Safari + desktop.
 *
 * Root cause this solves:
 * Railway uses ephemeral filesystem — uploaded files are lost on redeploy.
 * The server returns 200 OK with SPA HTML instead of 404, so the browser
 * tries to parse HTML as an image → fires onerror. This component catches
 * that and shows a clean fallback.
 */
import { useState, useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";
import { normalizeMediaUrl } from "@/lib/utils";

interface SafeMediaThumbProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  /** Extra classes for the outer wrapper (default: aspect-square) */
  wrapperClassName?: string;
  onClick?: () => void;
}

export function SafeMediaThumb({
  src,
  alt = "",
  className = "w-full h-full object-cover",
  wrapperClassName = "relative block rounded-lg overflow-hidden border bg-muted aspect-square",
  onClick,
}: SafeMediaThumbProps) {
  const normalizedUrl = normalizeMediaUrl(src);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    normalizedUrl ? "loading" : "error"
  );
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset status when src changes
  useEffect(() => {
    setStatus(normalizeMediaUrl(src) ? "loading" : "error");
  }, [src]);

  // Extra safety: if the image loads but is actually HTML (server returned SPA),
  // the naturalWidth will be 0 in some browsers. Check after a short delay.
  const handleLoad = () => {
    const img = imgRef.current;
    if (img && img.naturalWidth === 0 && img.naturalHeight === 0) {
      setStatus("error");
    } else {
      setStatus("loaded");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wrapperClassName} cursor-pointer hover:ring-2 hover:ring-[#3ECFC0] transition-all`}
    >
      {/* Loading skeleton */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual image — hidden when error */}
      {status !== "error" && normalizedUrl && (
        <img
          ref={imgRef}
          src={normalizedUrl}
          alt={alt}
          className={`${className} ${status === "loading" ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
          onLoad={handleLoad}
          onError={() => setStatus("error")}
          loading="lazy"
        />
      )}

      {/* Error fallback */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="h-5 w-5 opacity-50" />
          <span className="text-[10px] mt-1 opacity-40">
            {alt || "—"}
          </span>
        </div>
      )}
    </button>
  );
}
