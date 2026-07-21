const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");

const tableClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage,
  "LoanCheckouts"
);

app.http("loaners", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "loaners",

  handler: async (request, context) => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders,
      };
    }

    try {
      const loaners = [];

      for await (const entity of tableClient.listEntities()) {
        if (entity.status === "checked-out") {
          loaners.push({
            rowKey: entity.rowKey,
            borrowerName: entity.borrowerName,
            category: entity.category,
            item: entity.item,
            id: entity.id || "",
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
        headers: corsHeaders,
        jsonBody: {
          loaners,
        },
      };
    } catch (error) {
      context.error("Unable to load active loaners", error);

      return {
        status: 500,
        headers: corsHeaders,
        jsonBody: {
          error: "Unable to load active loaners",
        },
      };
    }
  },
});
