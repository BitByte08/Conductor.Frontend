// Determine API base: prefer VITE_API_BASE, otherwise use relative paths in dev, and production default to the canonical host.
const envBase = (import.meta.env.VITE_API_BASE as string) || '';
const isDev = import.meta.env.DEV as boolean;
export const API_BASE: string = envBase || (isDev ? '' : 'https://conductor.bitworkspace.kr');

export const apiUrl = (path: string) => {
  if (!API_BASE) return path; // relative in dev
  // ensure we don't double-up slashes
  return API_BASE.replace(/\/$/, '') + path;
};
