const { TableClient } = require("@azure/data-tables");

const loansTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage,
  "CompanionLoans"
);

async function ensureLoansTable() {
  try {
    await loansTable.createTable();
  } catch (error) {
    if (error.statusCode !== 409) {
      throw error;
    }
  }
}

module.exports = {
  ensureLoansTable,
  loansTable,
};
