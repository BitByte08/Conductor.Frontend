// Default API base - hardcoded fallback for production
export const API_BASE: string = (import.meta.env.VITE_API_BASE as string) || 'https://conductor.bitworkspace.kr';

export const apiUrl = (path: string) => {
  // ensure we don't double-up slashes
  return API_BASE.replace(/\/$/, '') + path;
};
