import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const RATE_LIMITS_COLLECTION = "rate_limits";

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const docRef = adminDb.collection(RATE_LIMITS_COLLECTION).doc(key);
  const windowMs = config.windowMinutes * 60 * 1000;

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const data = doc.data();

      if (!data || now > data.resetAt) {
        transaction.set(docRef, {
          count: 1,
          resetAt: now + windowMs,
          createdAt: now,
        });
        return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMinutes * 60 };
      }

      if (data.count >= config.maxRequests) {
        const resetIn = Math.ceil((data.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, resetIn };
      }

      transaction.update(docRef, {
        count: FieldValue.increment(1),
      });
      return { allowed: true, remaining: config.maxRequests - data.count - 1, resetIn: 0 };
    });

    return result;
  } catch {
    // If Firestore transaction fails (e.g. contention), allow the request
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMinutes * 60 };
  }
}

export function getRateLimitKey(ip: string, userId?: string): string {
  return userId ? `rate_limit_user_${userId}` : `rate_limit_ip_${ip}`;
}
