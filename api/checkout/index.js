module.exports = async function (context, req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: corsHeaders,
    };

    return;
  }

  const body = req.body || {};
  const borrowerName = String(body.borrowerName || "").trim();
  const category = String(body.category || "").trim();
  const item = String(body.item || "").trim();
  const id = String(body.id || "").trim();
  const checkedOutAt = body.checkedOutAt || new Date().toISOString();

  if (borrowerName.length < 2 || category.length < 2 || item.length < 2) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: {
        error: "borrowerName, category, and item are required",
      },
    };

    return;
  }

  context.log("Received checkout", {
    borrowerName,
    category,
    item,
    id,
    checkedOutAt,
  });

  context.res = {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: {
      ok: true,
      borrowerName,
      category,
      item,
      id,
      checkedOutAt,
    },
  };
};