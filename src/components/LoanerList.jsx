import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./LoanerList.css";

const categories = [
  "Radio",
  "Gear",
  "Tire",
  "Gas",
  "Co-driver",
  "Other",
];

function LoanerList() {
  const params = new URLSearchParams(window.location.search);
  const checkoutApiUrl =
    import.meta.env.VITE_CHECKOUT_API_URL || "/api/checkout";

  const loanersApiUrl =
    import.meta.env.VITE_LOANERS_API_URL ||
    checkoutApiUrl.replace(/\/checkout$/, "/loaners");

  const checkinApiUrl =
    import.meta.env.VITE_CHECKIN_API_URL ||
    checkoutApiUrl.replace(/\/checkout$/, "/checkin");

  const isCheckoutPage = params.get("checkout") === "true";
  const checkoutCategory = params.get("category") || "";
  const checkoutItem = params.get("item") || "";
  const checkoutId = params.get("id") || "";

  const [selectedCategory, setSelectedCategory] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemId, setItemId] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const [borrowerName, setBorrowerName] = useState("");
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [checkoutSyncState, setCheckoutSyncState] = useState("idle");
  const [activeLoaners, setActiveLoaners] = useState([]);
  const [loanersLoading, setLoanersLoading] = useState(true);
  const [loanersError, setLoanersError] = useState("");
  const [appView, setAppView] = useState("checkout");
  const [returnCategory, setReturnCategory] = useState("");
  const [checkinRowKey, setCheckinRowKey] = useState("");
  const [checkinError, setCheckinError] = useState("");

  const cleanedBorrowerName = borrowerName.trim();
  const borrowerNameIsValid = cleanedBorrowerName.length >= 2;

  const decodedCheckout = useMemo(
    () => ({
      category: decodeURIComponent(checkoutCategory),
      item: decodeURIComponent(checkoutItem),
      id: decodeURIComponent(checkoutId),
    }),
    [checkoutCategory, checkoutItem, checkoutId]
  );

  async function loadActiveLoaners() {
    setLoanersLoading(true);
    setLoanersError("");

    try {
      const response = await fetch(loanersApiUrl);

      if (!response.ok) {
        throw new Error(`Loaners API returned ${response.status}`);
      }

      const data = await response.json();
      setActiveLoaners(data.loaners || []);
    } catch (error) {
      console.error("Unable to load active loaners", error);
      setLoanersError("Unable to load active loans.");
    } finally {
      setLoanersLoading(false);
    }
  }

  useEffect(() => {
    if (!isCheckoutPage) {
      loadActiveLoaners();
    }
  }, [isCheckoutPage]);

  async function handleCheckIn(loan) {
    setCheckinRowKey(loan.rowKey);
    setCheckinError("");

    try {
      const response = await fetch(checkinApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: loan.category,
          rowKey: loan.rowKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Check-in API returned ${response.status}`);
      }

      await loadActiveLoaners();
    } catch (error) {
      console.error("Unable to check in loaner", error);
      setCheckinError("Unable to return this item. Please try again.");
    } finally {
      setCheckinRowKey("");
    }
  }

  function createCheckoutQr() {
    if (!selectedCategory || itemDescription.trim().length < 2) {
      return;
    }

    const checkoutParams = new URLSearchParams({
      checkout: "true",
      category: selectedCategory,
      item: itemDescription.trim(),
      id: itemId.trim(),
    });

    setCheckoutUrl(
      `${window.location.origin}/?${checkoutParams.toString()}`
    );
  }

  async function handleBorrowerSubmit(event) {
    event.preventDefault();

    if (!borrowerNameIsValid) {
      return;
    }

    setCheckoutConfirmed(true);
    setCheckoutSyncState("saving");

    try {
      const response = await fetch(checkoutApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borrowerName: cleanedBorrowerName,
          category: decodedCheckout.category,
          item: decodedCheckout.item,
          id: decodedCheckout.id,
          checkedOutAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout API returned ${response.status}`);
      }

      setCheckoutSyncState("saved");
    } catch (error) {
      console.error("Unable to sync checkout to Azure Functions", error);
      setCheckoutSyncState("error");
    }
  }

  if (isCheckoutPage) {
    if (checkoutConfirmed) {
      return (
        <main className="loaner-page">
          <section className="loaner-panel">
            <h1>Checkout Confirmed</h1>

            <p className="confirmation-message">
              <strong>{cleanedBorrowerName}</strong> checked out:
            </p>

            <div className="checkout-summary">
              <p>
                <strong>Category:</strong> {decodedCheckout.category}
              </p>

              <p>
                <strong>Item:</strong> {decodedCheckout.item}
              </p>

              {decodedCheckout.id && (
                <p>
                  <strong>ID:</strong> {decodedCheckout.id}
                </p>
              )}

              <p>
                <strong>Sync status:</strong>{" "}
                {checkoutSyncState === "saved"
                  ? "Saved to Azure Functions"
                  : checkoutSyncState === "error"
                    ? "Saved locally, but Azure Functions sync failed"
                    : "Saving to Azure Functions..."}
              </p>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="loaner-page">
        <section className="loaner-panel">
          <h1>Confirm Checkout</h1>

          <div className="checkout-summary">
            <p>
              <strong>Category:</strong> {decodedCheckout.category}
            </p>

            <p>
              <strong>Item:</strong> {decodedCheckout.item}
            </p>

            {decodedCheckout.id && (
              <p>
                <strong>ID:</strong> {decodedCheckout.id}
              </p>
            )}
          </div>

          <form
            className="loaner-form"
            onSubmit={handleBorrowerSubmit}
          >
            <label htmlFor="borrower-name">Your name</label>

            <input
              id="borrower-name"
              type="text"
              value={borrowerName}
              onChange={(event) =>
                setBorrowerName(event.target.value)
              }
              placeholder="Enter your name"
              autoFocus
              minLength={2}
            />

            <button
              className="primary-button"
              type="submit"
              disabled={!borrowerNameIsValid}
            >
              {checkoutSyncState === "saving"
                ? "Saving..."
                : "Confirm Checkout"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const filteredReturnLoans = activeLoaners.filter(
    (loan) => !returnCategory || loan.category === returnCategory
  );

  return (
    <main className="loaner-page">
      <section className="loaner-panel">
        <div className="category-grid">
          <button
            className={`category-button ${
              appView === "checkout" ? "selected" : ""
            }`}
            type="button"
            onClick={() => setAppView("checkout")}
          >
            Check Out
          </button>

          <button
            className={`category-button ${
              appView === "return" ? "selected" : ""
            }`}
            type="button"
            onClick={() => {
              setAppView("return");
              loadActiveLoaners();
            }}
          >
            Return Items
          </button>
        </div>

        {appView === "checkout" && (
          <>
            <h1>Loaner Checkout</h1>
            <h2>Select a category</h2>

            <div className="category-grid">
              {categories.map((category) => (
                <button
                  className={`category-button ${
                    selectedCategory === category ? "selected" : ""
                  }`}
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory((current) =>
                      current === category ? "" : category
                    );
                    setCheckoutUrl("");
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {selectedCategory && (
              <section className="item-section">
                <h2>{selectedCategory}</h2>

                <div className="loaner-form">
                  <label htmlFor="item-description">
                    Item description
                  </label>

                  <input
                    id="item-description"
                    type="text"
                    value={itemDescription}
                    onChange={(event) => {
                      setItemDescription(event.target.value);
                      setCheckoutUrl("");
                    }}
                    placeholder="Example: Midland handheld radio"
                  />

                  <label htmlFor="item-id">
                    ID number or notes
                  </label>

                  <input
                    id="item-id"
                    type="text"
                    value={itemId}
                    onChange={(event) => {
                      setItemId(event.target.value);
                      setCheckoutUrl("");
                    }}
                    placeholder="Example: Radio 3"
                  />

                  <button
                    className="primary-button"
                    type="button"
                    onClick={createCheckoutQr}
                    disabled={itemDescription.trim().length < 2}
                  >
                    Create Checkout QR
                  </button>
                </div>
              </section>
            )}

            {checkoutUrl && (
              <section className="qr-section">
                <h2>Scan to Check Out</h2>

                <div className="qr-code">
                  <QRCodeSVG value={checkoutUrl} size={240} />
                </div>

                <p className="checkout-link">{checkoutUrl}</p>
              </section>
            )}
          </>
        )}

        {appView === "return" && (
          <>
            <h1>Return Loaners</h1>
            <h2>Select a category</h2>

            <div className="category-grid">
              {categories.map((category) => (
                <button
                  className={`category-button ${
                    returnCategory === category ? "selected" : ""
                  }`}
                  key={category}
                  type="button"
                  onClick={() =>
                    setReturnCategory((current) =>
                      current === category ? "" : category
                    )
                  }
                >
                  {category}
                </button>
              ))}
            </div>

            {returnCategory && (
              <section className="active-loans-section">
                <div className="active-loans-heading">
                  <h2>Checked-Out {returnCategory} Items</h2>

                  <button
                    className="primary-button"
                    type="button"
                    onClick={loadActiveLoaners}
                    disabled={loanersLoading}
                  >
                    {loanersLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {loanersError && <p>{loanersError}</p>}
                {checkinError && <p>{checkinError}</p>}

                {!loanersLoading &&
                  !loanersError &&
                  filteredReturnLoans.length === 0 && (
                    <p>No {returnCategory.toLowerCase()} items are checked out.</p>
                  )}

                <div className="active-loans-list">
                  {filteredReturnLoans.map((loan) => (
                    <article className="active-loan-card" key={loan.rowKey}>
                      <h3>{loan.item}</h3>

                      <p>
                        <strong>Borrower:</strong> {loan.borrowerName}
                      </p>

                      {loan.id && (
                        <p>
                          <strong>ID:</strong> {loan.id}
                        </p>
                      )}

                      <p>
                        <strong>Checked out:</strong>{" "}
                        {new Date(loan.checkedOutAt).toLocaleString()}
                      </p>

                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => {
                          const itemName = loan.id
                            ? `${loan.item} (${loan.id})`
                            : loan.item;

                          const confirmed = window.confirm(
                            `Return ${itemName}?\n\nBorrower: ${loan.borrowerName}`
                          );

                          if (confirmed) {
                            handleCheckIn(loan);
                          }
                        }}
                        disabled={checkinRowKey === loan.rowKey}
                      >
                        {checkinRowKey === loan.rowKey
                          ? "Returning..."
                          : "Return Item"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default LoanerList;