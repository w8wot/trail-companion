const crypto = require("crypto");

const DEFAULT_ALLOWED_ORIGINS = ["https://w8wot.github.io"];
const TENANT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAllowedOrigins() {
  const configuredOrigins = String(
    process.env.COMPANION_ALLOWED_ORIGINS || ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(request) {
  const origin = request.headers.get("origin");
  return !origin || getAllowedOrigins().includes(origin);
}

function corsHeaders(request, methods) {
  const origin = request.headers.get("origin");
  const headers = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Companion-Tenant",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };

  if (origin && getAllowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function preflightResponse(request, methods) {
  if (!isOriginAllowed(request)) {
    return {
      status: 403,
      headers: corsHeaders(request, methods),
    };
  }

  return {
    status: 200,
    headers: corsHeaders(request, methods),
  };
}

function originDeniedResponse(request, methods) {
  return {
    status: 403,
    headers: corsHeaders(request, methods),
    jsonBody: {
      error: "This website is not allowed to use the Companion API",
    },
  };
}

function hashOrganizerKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function getConfiguredTenants() {
  const tenants = new Map();

  for (const entry of String(process.env.COMPANION_TENANTS || "").split(",")) {
    const separatorIndex = entry.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const tenantId = entry.slice(0, separatorIndex).trim().toLowerCase();
    const keyHash = entry.slice(separatorIndex + 1).trim().toLowerCase();

    if (TENANT_ID_PATTERN.test(tenantId) && /^[0-9a-f]{64}$/.test(keyHash)) {
      tenants.set(tenantId, keyHash);
    }
  }

  return tenants;
}

function authenticateOrganizer(request) {
  const tenants = getConfiguredTenants();

  if (tenants.size === 0) {
    return {
      ok: false,
      status: 503,
      error: "Organizer access is not configured",
    };
  }

  const tenantId = String(
    request.headers.get("x-companion-tenant") || ""
  )
    .trim()
    .toLowerCase();
  const authorization = String(
    request.headers.get("authorization") || ""
  );
  const key = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  const expectedHash = tenants.get(tenantId);

  if (!expectedHash || !key) {
    return {
      ok: false,
      status: 401,
      error: "Invalid workspace ID or organizer access key",
    };
  }

  const providedHash = hashOrganizerKey(key);
  const matches = crypto.timingSafeEqual(
    Buffer.from(providedHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );

  if (!matches) {
    return {
      ok: false,
      status: 401,
      error: "Invalid workspace ID or organizer access key",
    };
  }

  return {
    ok: true,
    tenantId,
  };
}

function getSessionSecret() {
  const secret = String(process.env.COMPANION_SESSION_SECRET || "");

  if (secret.length < 32) {
    throw new Error("COMPANION_SESSION_SECRET is not configured securely");
  }

  return secret;
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function createCheckoutToken({ tenantId, category, item, id }) {
  const configuredTtl = Number.parseInt(
    process.env.COMPANION_QR_TTL_MINUTES || "15",
    10
  );
  const ttlMinutes = Number.isFinite(configuredTtl)
    ? Math.min(Math.max(configuredTtl, 1), 60)
    : 15;
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const payload = {
    version: 1,
    tenantId,
    sessionId,
    category,
    item,
    id,
    expiresAt,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  return {
    sessionId,
    expiresAt: new Date(expiresAt).toISOString(),
    token: `${encodedPayload}.${signPayload(encodedPayload)}`,
  };
}

function verifyCheckoutToken(token) {
  try {
    const [encodedPayload, providedSignature, extraPart] = String(
      token || ""
    ).split(".");

    if (!encodedPayload || !providedSignature || extraPart) {
      return { ok: false, status: 401, error: "Invalid checkout link" };
    }

    const expectedSignature = signPayload(encodedPayload);
    const providedBuffer = Buffer.from(providedSignature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return { ok: false, status: 401, error: "Invalid checkout link" };
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
    const payloadIsValid =
      payload.version === 1 &&
      TENANT_ID_PATTERN.test(payload.tenantId) &&
      SESSION_ID_PATTERN.test(payload.sessionId) &&
      typeof payload.category === "string" &&
      payload.category.length >= 2 &&
      payload.category.length <= 50 &&
      typeof payload.item === "string" &&
      payload.item.length >= 2 &&
      payload.item.length <= 120 &&
      typeof payload.id === "string" &&
      payload.id.length <= 120 &&
      Number.isFinite(payload.expiresAt);

    if (!payloadIsValid) {
      return { ok: false, status: 401, error: "Invalid checkout link" };
    }

    if (Date.now() > payload.expiresAt) {
      return {
        ok: false,
        status: 410,
        error: "This checkout QR has expired. Ask the organizer for a new one.",
      };
    }

    return { ok: true, payload };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("COMPANION_SESSION_SECRET")
    ) {
      return {
        ok: false,
        status: 503,
        error: "Checkout security is not configured",
      };
    }

    return { ok: false, status: 401, error: "Invalid checkout link" };
  }
}

module.exports = {
  authenticateOrganizer,
  corsHeaders,
  createCheckoutToken,
  hashOrganizerKey,
  isOriginAllowed,
  originDeniedResponse,
  preflightResponse,
  verifyCheckoutToken,
};
