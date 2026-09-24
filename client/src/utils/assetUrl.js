import { createAssetUrl, IMAGE_PLACEHOLDER } from "../../../shared/media.mjs";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export const assetUrl = createAssetUrl({
  serverBaseUrl: import.meta.env.VITE_SERVER_BASE_URL || apiBase.replace(/\/api$/, ""),
  publicBaseUrl: import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL,
});

export { IMAGE_PLACEHOLDER };
