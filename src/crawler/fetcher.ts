import axios from "axios";
import { CRAWL_CONFIG } from "./config";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchPage(url: string): Promise<{ html: string; status: number } | null> {
  for (let attempt = 0; attempt < CRAWL_CONFIG.maxRetries; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: CRAWL_CONFIG.timeoutMs,
        headers: {
          "User-Agent": "MAWbot-Crawler/1.0 (MAW Group Knowledge Collector)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (res.status === 200 && typeof res.data === "string") {
        return { html: res.data, status: res.status };
      }
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status || 0 : 0;
      if (status === 404 || status === 403 || status === 410) {
        return null;
      }
      if (attempt < CRAWL_CONFIG.maxRetries - 1) {
        await delay(2000 * (attempt + 1));
      }
    }
  }
  return null;
}
