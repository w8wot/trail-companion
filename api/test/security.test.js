const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  authenticateOrganizer,
  corsHeaders,
  createCheckoutToken,
  hashOrganizerKey,
  isOriginAllowed,
  verifyCheckoutToken,
} = require("../src/security");

const originalEnvironment = {
  allowedOrigins: process.env.COMPANION_ALLOWED_ORIGINS,
  qrTtl: process.env.COMPANION_QR_TTL_MINUTES,
  sessionSecret: process.env.COMPANION_SESSION_SECRET,
  tenants: process.env.COMPANION_TENANTS,
};

function requestWithHeaders(headers = {}) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ])
  );

  return {
    headers: {
      get(name) {
        return normalizedHeaders.get(name.toLowerCase()) || null;
      },
    },
  };
}

afterEach(() => {
  for (const [name, value] of Object.entries({
    COMPANION_ALLOWED_ORIGINS: originalEnvironment.allowedOrigins,
    COMPANION_QR_TTL_MINUTES: originalEnvironment.qrTtl,
    COMPANION_SESSION_SECRET: originalEnvironment.sessionSecret,
    COMPANION_TENANTS: originalEnvironment.tenants,
  })) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test("organizer keys are hashed and validated per workspace", () => {
  const organizerKey = "correct-horse-battery-staple-for-alpha";
  process.env.COMPANION_TENANTS =
    `alpha=${hashOrganizerKey(organizerKey)}`;

  const accepted = authenticateOrganizer(
    requestWithHeaders({
      authorization: `Bearer ${organizerKey}`,
      "x-companion-tenant": "alpha",
    })
  );
  const rejected = authenticateOrganizer(
    requestWithHeaders({
      authorization: "Bearer wrong-key",
      "x-companion-tenant": "alpha",
    })
  );

  assert.deepEqual(accepted, { ok: true, tenantId: "alpha" });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, 401);
});

test("signed checkout tokens verify and reject tampering", () => {
  process.env.COMPANION_SESSION_SECRET =
    "a-test-secret-that-is-at-least-thirty-two-characters";

  const session = createCheckoutToken({
    tenantId: "alpha",
    category: "Radio",
    item: "Wouxun GMRS",
    id: "Radio 2",
  });
  const verified = verifyCheckoutToken(session.token);
  const [payload, signature] = session.token.split(".");
  const tamperedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
  const tamperedToken = `${payload}.${tamperedSignature}`;
  const tampered = verifyCheckoutToken(tamperedToken);

  assert.equal(verified.ok, true);
  assert.equal(verified.payload.sessionId, session.sessionId);
  assert.equal(verified.payload.tenantId, "alpha");
  assert.equal(tampered.ok, false);
  assert.equal(tampered.status, 401);
});

test("signed checkout tokens expire", () => {
  process.env.COMPANION_SESSION_SECRET =
    "another-test-secret-that-is-long-enough-for-hmac";
  process.env.COMPANION_QR_TTL_MINUTES = "1";
  const originalNow = Date.now;

  try {
    const createdAt = 1_800_000_000_000;
    Date.now = () => createdAt;

    const session = createCheckoutToken({
      tenantId: "alpha",
      category: "Gear",
      item: "Recovery strap",
      id: "Gear 1",
    });

    Date.now = () => createdAt + 61_000;
    const expired = verifyCheckoutToken(session.token);

    assert.equal(expired.ok, false);
    assert.equal(expired.status, 410);
  } finally {
    Date.now = originalNow;
  }
});

test("CORS allows configured sites and rejects other browser origins", () => {
  process.env.COMPANION_ALLOWED_ORIGINS =
    "https://w8wot.github.io,http://localhost:5173";
  const allowedRequest = requestWithHeaders({
    origin: "https://w8wot.github.io",
  });
  const deniedRequest = requestWithHeaders({
    origin: "https://example.com",
  });

  assert.equal(isOriginAllowed(allowedRequest), true);
  assert.equal(isOriginAllowed(deniedRequest), false);
  assert.equal(
    corsHeaders(allowedRequest, "GET, OPTIONS")[
      "Access-Control-Allow-Origin"
    ],
    "https://w8wot.github.io"
  );
  assert.equal(
    corsHeaders(deniedRequest, "GET, OPTIONS")[
      "Access-Control-Allow-Origin"
    ],
    undefined
  );
});
