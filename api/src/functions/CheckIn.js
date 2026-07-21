const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");

const tableClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage,
  "LoanCheckouts"
);

app.http("checkin", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "checkin",

  handler: async (request, context) => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders,
      };
    }

    try {
      const body = await request.json();
      const partitionKey = String(body.partitionKey || body.category || "").trim();
      const rowKey = String(body.rowKey || "").trim();

      if (!partitionKey || !rowKey) {
        return {
          status: 400,
          headers: corsHeaders,
          jsonBody: {
            error: "category and rowKey are required",
          },
        };
      }

      await tableClient.updateEntity(
        {
          partitionKey,
          rowKey,
          status: "checked-in",
          checkedInAt: new Date().toISOString(),
        },
        "Merge"
      );

      return {
        status: 200,
        headers: corsHeaders,
        jsonBody: {
          ok: true,
          rowKey,
          status: "checked-in",
        },
      };
    } catch (error) {
      context.error("Unable to check in loaner", error);

      return {
        status: 500,
        headers: corsHeaders,
        jsonBody: {
          error: "Unable to check in loaner",
        },
      };
    }
  },
});
