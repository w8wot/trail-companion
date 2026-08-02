const { app } = require("@azure/functions");
const {
  authenticateOrganizer,
  corsHeaders,
  isOriginAllowed,
  originDeniedResponse,
  preflightResponse,
} = require("../security");
const { ensureLoansTable, loansTable } = require("../loansTable");

app.http("checkin", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "checkin",

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
      const rowKey = String(body.rowKey || "").trim();

      if (!/^[0-9a-f-]{36}$/i.test(rowKey)) {
        return {
          status: 400,
          headers,
          jsonBody: {
            error: "A valid loan ID is required",
          },
        };
      }

      await ensureLoansTable();
      await loansTable.updateEntity(
        {
          partitionKey: organizer.tenantId,
          rowKey,
          status: "checked-in",
          checkedInAt: new Date().toISOString(),
        },
        "Merge"
      );

      return {
        status: 200,
        headers,
        jsonBody: {
          ok: true,
          rowKey,
          status: "checked-in",
        },
      };
    } catch (error) {
      context.error("Unable to check in loaner", error);

      return {
        status: error.statusCode === 404 ? 404 : 500,
        headers,
        jsonBody: {
          error:
            error.statusCode === 404
              ? "Loan not found in this workspace"
              : "Unable to check in loaner",
        },
      };
    }
  },
});
