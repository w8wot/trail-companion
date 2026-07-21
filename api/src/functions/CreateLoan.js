const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const crypto = require("crypto");

const tableClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage,
  "LoanCheckouts"
);

app.http("checkout", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "checkout",

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

      const borrowerName = String(body.borrowerName || "").trim();
      const category = String(body.category || "").trim();
      const item = String(body.item || "").trim();
      const id = String(body.id || "").trim();
      const checkedOutAt =
        body.checkedOutAt || new Date().toISOString();

      if (
        borrowerName.length < 2 ||
        category.length < 2 ||
        item.length < 2
      ) {
        return {
          status: 400,
          headers: corsHeaders,
          jsonBody: {
            error: "borrowerName, category, and item are required",
          },
        };
      }

      try {
        await tableClient.createTable();
      } catch (error) {
        if (error.statusCode !== 409) {
          throw error;
        }
      }

      const rowKey = crypto.randomUUID();

      await tableClient.createEntity({
        partitionKey: category,
        rowKey,
        borrowerName,
        category,
        item,
        id,
        checkedOutAt,
        status: "checked-out",
      });

      context.log("Checkout saved", {
        rowKey,
        borrowerName,
        category,
        item,
      });

      return {
        status: 200,
        headers: corsHeaders,
        jsonBody: {
          ok: true,
          rowKey,
          borrowerName,
          category,
          item,
          id,
          checkedOutAt,
        },
      };
    } catch (error) {
      context.error("Unable to save checkout", error);

      return {
        status: 500,
        headers: corsHeaders,
        jsonBody: {
          error: "Unable to save checkout",
        },
      };
    }
  },
});
