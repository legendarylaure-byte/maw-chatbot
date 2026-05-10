import { parsePage } from "./parser";

export function discoverInternalLinks(html: string, baseDomain: string): string[] {
  const { links } = parsePage("", html);
  return links.filter((link) => {
    try {
      const url = new URL(link);
      return url.hostname === baseDomain || url.hostname.endsWith("." + baseDomain);
    } catch {
      return false;
    }
  });
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return url;
  }
}
