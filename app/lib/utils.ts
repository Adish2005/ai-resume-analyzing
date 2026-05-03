import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind + conditional classes
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size (used in uploader)
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
    " " +
    sizes[i]
  );
}

/**
 * Generate unique ID
 */
export const generateUUID = () => {
  return crypto.randomUUID();
};