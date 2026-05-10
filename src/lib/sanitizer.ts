export function sanitizeInput(input: string, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  let sanitized = input.trim().slice(0, maxLength);
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/on\w+=/gi, "");
  return sanitized;
}

export function validateMessageBody(body: unknown): {
  valid: boolean;
  error?: string;
  sanitized?: { message: string; language?: string };
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const data = body as Record<string, unknown>;

  if (!data.message || typeof data.message !== "string") {
    return { valid: false, error: "Message is required and must be a string" };
  }

  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 10240) {
    return { valid: false, error: "Payload too large" };
  }

  const message = sanitizeInput(data.message);
  if (!message) {
    return { valid: false, error: "Message is empty after sanitization" };
  }

  const language = typeof data.language === "string" ? data.language : undefined;

  return { valid: true, sanitized: { message, language } };
}

export function validateAdminBody(body: unknown, requiredFields: string[]): {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const data = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 10240) {
    return { valid: false, error: "Payload too large" };
  }

  return { valid: true, data };
}
