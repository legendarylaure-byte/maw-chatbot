import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, maxLength);
  return trimmed.replace(/<[^>]*>/g, "");
}

export function isValidPayload(payload: unknown, maxSize = 10240): boolean {
  const str = JSON.stringify(payload);
  return str.length <= maxSize;
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 15);
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}
