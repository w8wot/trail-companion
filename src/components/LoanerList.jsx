import { useMemo, useState } from "react";
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

  return (
    <main className="loaner-page">
      <section className="loaner-panel">
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
                setSelectedCategory(category);
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
      </section>
    </main>
  );
}

export default LoanerList;