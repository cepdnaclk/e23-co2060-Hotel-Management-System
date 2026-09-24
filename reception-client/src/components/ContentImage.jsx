import { useState } from "react";
import { assetUrl, IMAGE_PLACEHOLDER } from "../utils/assetUrl";

// Keep the original img element, dimensions, classes and alt text on failure.
// Track the failed URL so a new gallery slide/upload can load after a failure.
export default function ContentImage({ src, alt = "", onError, ...props }) {
  const resolved = assetUrl(src);
  const [failedUrl, setFailedUrl] = useState(null);
  const unavailable = !resolved || failedUrl === resolved;

  return (
    <img
      {...props}
      src={unavailable ? assetUrl(IMAGE_PLACEHOLDER) : resolved}
      alt={alt}
      data-image-unavailable={unavailable || undefined}
      onError={(event) => {
        if (unavailable) return;
        setFailedUrl(resolved);
        onError?.(event);
      }}
    />
  );
}
