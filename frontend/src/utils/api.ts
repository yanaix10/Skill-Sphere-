/// <reference types="vite/client" />

const getBackendUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "http://localhost:5000";
};

export const BACKEND_URL = getBackendUrl();
