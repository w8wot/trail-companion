const { app } = require("@azure/functions");
const {
  corsHeaders,
  isOriginAllowed,
  originDeniedResponse,
  preflightResponse,
  verifyCheckoutToken,
} = require("../security");
const { ensureLoansTable, loansTable } = require("../loansTable");

app.http("checkout", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "checkout",

  handler: async (request, context) => {
    const methods = "POST, OPTIONS";
    const headers = corsHeaders(request, methods);

    if (request.method === "OPTIONS") {
      return preflightResponse(request, methods);
    }

    if (!isOriginAllowed(request)) {
      return originDeniedResponse(request, methods);
    }

    try {
      const body = await request.json();
      const borrowerName = String(body.borrowerName || "").trim();
      const checkoutToken = String(body.checkoutToken || "");

      if (
        borrowerName.length < 2 ||
        borrowerName.length > 100 ||
        !checkoutToken ||
        checkoutToken.length > 4096
      ) {
        return {
          status: 400,
          headers,
          jsonBody: { error: "Enter a valid name and use a valid loan link" },
        };
      }

      const verification = verifyCheckoutToken(checkoutToken);

      if (!verification.ok) {
        return {
          status: verification.status,
          headers,
          jsonBody: { error: verification.error },
        };
      }

      const {
        tenantId,
        sessionId,
        category,
        item,
        id,
      } = verification.payload;
      const checkedOutAt = new Date().toISOString();

      await ensureLoansTable();

      try {
        await loansTable.createEntity({
          partitionKey: tenantId,
          rowKey: sessionId,
          borrowerName,
          category,
          item,
          id,
          checkoutSessionId: sessionId,
          checkedOutAt,
          status: "checked-out",
        });
      } catch (error) {
        if (error.statusCode === 409) {
          return {
            status: 409,
            headers,
            jsonBody: {
              error: "This loan QR has already been used",
            },
          };
        }

        throw error;
      }

      context.log("Checkout saved", {
        tenantId,
        sessionId,
        category,
      });

      return {
        status: 200,
        headers,
        jsonBody: {
          ok: true,
          rowKey: sessionId,
          borrowerName,
          category,
          item,
          id,
          checkoutSessionId: sessionId,
          checkedOutAt,
        },
      };
    } catch (error) {
      context.error("Unable to save checkout", error);

      return {
        status: 500,
        headers,
        jsonBody: {
          error: "Unable to save loan",
        },
      };
    }
  },
});
