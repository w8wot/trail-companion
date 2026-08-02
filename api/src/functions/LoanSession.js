const { app } = require("@azure/functions");
const {
  authenticateOrganizer,
  corsHeaders,
  createCheckoutToken,
  isOriginAllowed,
  originDeniedResponse,
  preflightResponse,
} = require("../security");

app.http("loanSession", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "loan-session",

  handler: async (request, context) => {
    const methods = "POST, OPTIONS";
    const headers = corsHeaders(request, methods);

    if (request.method === "OPTIONS") {
      return preflightResponse(request, methods);
    }

    if (!isOriginAllowed(request)) {
      return originDeniedResponse(request, methods);
    }

    const organizer = authenticateOrganizer(request);

    if (!organizer.ok) {
      return {
        status: organizer.status,
        headers,
        jsonBody: { error: organizer.error },
      };
    }

    try {
      const body = await request.json();
      const category = String(body.category || "").trim();
      const item = String(body.item || "").trim();
      const id = String(body.id || "").trim();

      if (
        category.length < 2 ||
        category.length > 50 ||
        item.length < 2 ||
        item.length > 120 ||
        id.length > 120
      ) {
        return {
          status: 400,
          headers,
          jsonBody: {
            error: "Enter a valid category, item, and optional ID",
          },
        };
      }

      const checkoutSession = createCheckoutToken({
        tenantId: organizer.tenantId,
        category,
        item,
        id,
      });

      context.log("Checkout session created", {
        tenantId: organizer.tenantId,
        sessionId: checkoutSession.sessionId,
      });

      return {
        status: 200,
        headers,
        jsonBody: checkoutSession,
      };
    } catch (error) {
      context.error("Unable to create checkout session", error);

      const configurationError =
        error instanceof Error &&
        error.message.includes("COMPANION_SESSION_SECRET");

      return {
        status: configurationError ? 503 : 500,
        headers,
        jsonBody: {
          error: configurationError
            ? "Loan security is not configured"
            : "Unable to create loan session",
        },
      };
    }
  },
});
