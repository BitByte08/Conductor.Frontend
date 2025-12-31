export const API_BASE: string = (import.meta.env.VITE_API_BASE as string) || '';

export const apiUrl = (path: string) => {
  if (!API_BASE) return path;
  // ensure we don't double-up slashes
  return API_BASE.replace(/\/$/, '') + path;
};
