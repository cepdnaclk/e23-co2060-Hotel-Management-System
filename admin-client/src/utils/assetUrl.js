import { createAssetUrl, IMAGE_PLACEHOLDER } from "../../../shared/media.mjs";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL || apiBase.replace(/\/api$/, "");
export const assetUrl = createAssetUrl({ serverBaseUrl, publicBaseUrl: serverBaseUrl });
export { IMAGE_PLACEHOLDER };
