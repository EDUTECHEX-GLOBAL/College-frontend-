export const DEFAULT_API_BASE_URL = "https://college-backend-render-u2g5.onrender.com";

export const resolveApiBaseUrl = (value = process.env.REACT_APP_API_BASE_URL) => {
  const normalized = String(value || "").trim();

  if (!normalized || normalized === "undefined" || normalized === "null") {
    return DEFAULT_API_BASE_URL;
  }

  return normalized.replace(/\/+$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

export default API_BASE_URL;
