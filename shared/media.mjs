import { legacyImagePaths } from "./legacyImagePaths.mjs";

export const IMAGE_PLACEHOLDER = "/images/image-unavailable.svg";

// Public catalogue assets belong to the tourist client. Uploads belong to the API.
// Admin/reception clients set publicBaseUrl to the API's shared /images mount.
export function createAssetUrl({ serverBaseUrl = "", publicBaseUrl = "" } = {}) {
  const server = serverBaseUrl.trim().replace(/\/+$/, "");
  const publicBase = publicBaseUrl.trim().replace(/\/+$/, "");
  const publicUrl = (value) => `${publicBase}${value}`;

  return (input) => {
    if (typeof input !== "string") return "";
    const value = input.trim();
    if (!value) return "";
    if (/^(?:data:|blob:)/i.test(value)) return value;

    if (/^(?:https?:)?\/\//i.test(value)) {
      try {
        const parsed = new URL(value.startsWith("//") ? `https:${value}` : value);
        // Convert old saved basket/planner snapshots without contacting image hosts.
        if (/^images\.(?:unsplash|pexels)\.com$/i.test(parsed.hostname)) {
          const source = `${parsed.hostname}${parsed.pathname}`;
          return publicUrl(legacyImagePaths[`${source}${parsed.search}`] || legacyImagePaths[source] || IMAGE_PLACEHOLDER);
        }
        const apiOrigin = /^https?:\/\//i.test(server) ? new URL(server).origin : "";
        const isOldApiAsset = parsed.origin === apiOrigin ||
          (["localhost", "127.0.0.1"].includes(parsed.hostname) && parsed.port === "5000");
        if (isOldApiAsset && /^\/images\//.test(parsed.pathname)) {
          return publicUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
        }
      } catch {
        return "";
      }
      return value;
    }

    if (/^[a-z][a-z\d+.-]*:/i.test(value)) return "";
    const pathname = `/${value.replace(/^(?:\.\/|\/)+/, "")}`;
    if (publicBase.startsWith("/") && pathname.startsWith(`${publicBase}/`)) return pathname;
    if (/^\/(?:images|videos)\//.test(pathname)) return publicUrl(pathname);
    return `${server}${pathname}`;
  };
}
