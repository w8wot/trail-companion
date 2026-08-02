const { app } = require("@azure/functions");
const {
  authenticateOrganizer,
  corsHeaders,
  isOriginAllowed,
  originDeniedResponse,
  preflightResponse,
} = require("../security");
const { ensureLoansTable, loansTable } = require("../loansTable");

app.http("loaners", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "loaners",

  handler: async (request, context) => {
    const methods = "GET, OPTIONS";
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
      await ensureLoansTable();

      const loaners = [];
      const filter = `PartitionKey eq '${organizer.tenantId}'`;

      for await (const entity of loansTable.listEntities({
        queryOptions: { filter },
      })) {
        if (entity.status === "checked-out") {
          loaners.push({
            rowKey: entity.rowKey,
            borrowerName: entity.borrowerName,
            category: entity.category,
            item: entity.item,
            id: entity.id || "",
            checkoutSessionId: entity.checkoutSessionId || "",
            checkedOutAt: entity.checkedOutAt,
            status: entity.status,
          });
        }
      }

      loaners.sort(
        (a, b) =>
          new Date(b.checkedOutAt).getTime() -
          new Date(a.checkedOutAt).getTime()
      );

      return {
        status: 200,
        headers,
        jsonBody: { loaners },
      };
    } catch (error) {
      context.error("Unable to load active loaners", error);

      return {
        status: 500,
        headers,
        jsonBody: {
          error: "Unable to load active loaners",
        },
      };
    }
  },
});
