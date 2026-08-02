import { useCallback, useEffect, useMemo, useState } from "react";
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

const organizerSessionStorageKey = "companion-organizer-access";

function getCheckoutParams() {
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : ""
  );

  if (hashParams.get("checkout") === "true") {
    return hashParams;
  }

  return new URLSearchParams(window.location.search);
}

function getStoredOrganizerAccess() {
  try {
    const storedAccess = JSON.parse(
      sessionStorage.getItem(organizerSessionStorageKey) || "null"
    );

    if (storedAccess?.tenantId && storedAccess?.key) {
      return storedAccess;
    }
  } catch {
    sessionStorage.removeItem(organizerSessionStorageKey);
  }

  return null;
}

async function getResponseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function LoanerList() {
  const params = getCheckoutParams();
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  const checkoutApiUrl = `${apiBaseUrl}/checkout`;
  const loanersApiUrl = `${apiBaseUrl}/loaners`;
  const checkinApiUrl = `${apiBaseUrl}/checkin`;
  const loanSessionApiUrl = `${apiBaseUrl}/loan-session`;

  const isCheckoutPage = params.get("checkout") === "true";
  const checkoutCategory = params.get("category") || "";
  const checkoutItem = params.get("item") || "";
  const checkoutId = params.get("id") || "";
  const checkoutSessionId = params.get("session") || "";
  const checkoutToken = params.get("token") || "";

  const [selectedCategory, setSelectedCategory] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemId, setItemId] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [activeCheckoutSessionId, setActiveCheckoutSessionId] = useState("");
  const [checkoutExpiresAt, setCheckoutExpiresAt] = useState("");
  const [qrCreationState, setQrCreationState] = useState("idle");
  const [qrCreationError, setQrCreationError] = useState("");

  const [borrowerName, setBorrowerName] = useState("");
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [checkoutSyncState, setCheckoutSyncState] = useState("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [completedCheckout, setCompletedCheckout] = useState(null);
  const [organizerAccess, setOrganizerAccess] = useState(
    getStoredOrganizerAccess
  );
  const [workspaceId, setWorkspaceId] = useState("");
  const [organizerKey, setOrganizerKey] = useState("");
  const [accessState, setAccessState] = useState("idle");
  const [accessError, setAccessError] = useState("");
  const [activeLoaners, setActiveLoaners] = useState([]);
  const [loanersLoading, setLoanersLoading] = useState(true);
  const [loanersError, setLoanersError] = useState("");
  const [appView, setAppView] = useState("checkout");
  const [returnCategory, setReturnCategory] = useState("");
  const [checkinRowKey, setCheckinRowKey] = useState("");
  const [checkinError, setCheckinError] = useState("");

  const cleanedBorrowerName = borrowerName.trim();
  const borrowerNameIsValid = cleanedBorrowerName.length >= 2;
  const organizerHeaders = useMemo(
    () =>
      organizerAccess
        ? {
            Authorization: `Bearer ${organizerAccess.key}`,
            "X-Companion-Tenant": organizerAccess.tenantId,
          }
        : {},
    [organizerAccess]
  );

  const decodedCheckout = useMemo(
    () => ({
      category: checkoutCategory,
      item: checkoutItem,
      id: checkoutId,
      sessionId: checkoutSessionId,
    }),
    [checkoutCategory, checkoutItem, checkoutId, checkoutSessionId]
  );

  const clearGeneratedCheckout = useCallback(() => {
    setCheckoutUrl("");
    setActiveCheckoutSessionId("");
    setCheckoutExpiresAt("");
    setQrCreationState("idle");
    setQrCreationError("");
  }, []);

  const lockOrganizer = useCallback(
    (message = "") => {
      sessionStorage.removeItem(organizerSessionStorageKey);
      clearGeneratedCheckout();
      setOrganizerAccess(null);
      setActiveLoaners([]);
      setReturnCategory("");
      setWorkspaceId("");
      setOrganizerKey("");
      setAccessState("idle");
      setAccessError(message);
    },
    [clearGeneratedCheckout]
  );

  async function handleOrganizerUnlock(event) {
    event.preventDefault();

    const tenantId = workspaceId.trim().toLowerCase();
    const key = organizerKey.trim();

    if (!tenantId || !key) {
      return;
    }

    setAccessState("checking");
    setAccessError("");

    try {
      const response = await fetch(loanersApiUrl, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-Companion-Tenant": tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to unlock this workspace")
        );
      }

      const data = await response.json();
      const access = { tenantId, key };

      sessionStorage.setItem(
        organizerSessionStorageKey,
        JSON.stringify(access)
      );
      setOrganizerAccess(access);
      setActiveLoaners(data.loaners || []);
      setLoanersLoading(false);
      setWorkspaceId("");
      setOrganizerKey("");
      setAccessState("idle");
    } catch (error) {
      setAccessError(
        error instanceof Error
          ? error.message
          : "Unable to unlock this workspace"
      );
      setAccessState("idle");
    }
  }

  const loadActiveLoaners = useCallback(
    async ({ background = false } = {}) => {
      if (!organizerAccess) {
        return;
      }

      if (!background) {
        setLoanersLoading(true);
        setLoanersError("");
      }

      try {
        const response = await fetch(loanersApiUrl, {
          headers: organizerHeaders,
        });

        if (!response.ok) {
          const message = await getResponseError(
            response,
            "Unable to load active loans"
          );

          if (response.status === 401) {
            lockOrganizer(message);
            return;
          }

          throw new Error(message);
        }

        const data = await response.json();
        setActiveLoaners(data.loaners || []);
        setLoanersError("");
      } catch (error) {
        console.error("Unable to load active loaners", error);
        if (!background) {
          setLoanersError("Unable to load active loans.");
        }
      } finally {
        if (!background) {
          setLoanersLoading(false);
        }
      }
    },
    [loanersApiUrl, lockOrganizer, organizerAccess, organizerHeaders]
  );

  useEffect(() => {
    if (isCheckoutPage || !organizerAccess) {
      return;
    }

    const initialRefreshTimer = setTimeout(() => {
      loadActiveLoaners();
    }, 0);

    const refreshTimer = setInterval(() => {
      loadActiveLoaners({ background: true });
    }, 3000);

    return () => {
      clearTimeout(initialRefreshTimer);
      clearInterval(refreshTimer);
    };
  }, [isCheckoutPage, loadActiveLoaners, organizerAccess]);

  useEffect(() => {
    if (
      isCheckoutPage ||
      !checkoutUrl ||
      !activeCheckoutSessionId
    ) {
      return;
    }

    const checkoutWasCompleted = activeLoaners.some(
      (loan) => loan.checkoutSessionId === activeCheckoutSessionId
    );

    if (checkoutWasCompleted) {
      const resetTimer = setTimeout(() => {
        setCheckoutUrl("");
        setActiveCheckoutSessionId("");
        setCheckoutExpiresAt("");
        setQrCreationState("idle");
        setSelectedCategory("");
        setItemDescription("");
        setItemId("");
      }, 0);

      return () => clearTimeout(resetTimer);
    }
  }, [
    activeLoaners,
    checkoutUrl,
    activeCheckoutSessionId,
    isCheckoutPage,
  ]);

  async function handleCheckIn(loan) {
    setCheckinRowKey(loan.rowKey);
    setCheckinError("");

    try {
      const response = await fetch(checkinApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...organizerHeaders,
        },
        body: JSON.stringify({
          rowKey: loan.rowKey,
        }),
      });

      if (!response.ok) {
        const message = await getResponseError(
          response,
          "Unable to return this item"
        );

        if (response.status === 401) {
          lockOrganizer(message);
          return;
        }

        throw new Error(message);
      }

      await loadActiveLoaners();
    } catch (error) {
      console.error("Unable to check in loaner", error);
      setCheckinError(
        error instanceof Error
          ? error.message
          : "Unable to return this item. Please try again."
      );
    } finally {
      setCheckinRowKey("");
    }
  }

  async function createCheckoutQr() {
    if (!selectedCategory || itemDescription.trim().length < 2) {
      return;
    }

    setQrCreationState("creating");
    setQrCreationError("");
    setCheckoutUrl("");
    setActiveCheckoutSessionId("");

    try {
      const response = await fetch(loanSessionApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...organizerHeaders,
        },
        body: JSON.stringify({
          category: selectedCategory,
          item: itemDescription.trim(),
          id: itemId.trim(),
        }),
      });

      if (!response.ok) {
        const message = await getResponseError(
          response,
          "Unable to create a secure checkout QR"
        );

        if (response.status === 401) {
          lockOrganizer(message);
          return;
        }

        throw new Error(message);
      }

      const data = await response.json();
      const checkoutParams = new URLSearchParams({
        checkout: "true",
        category: selectedCategory,
        item: itemDescription.trim(),
        id: itemId.trim(),
        session: data.sessionId,
        token: data.token,
      });

      setCheckoutUrl(
        `${window.location.origin}${window.location.pathname}#${checkoutParams.toString()}`
      );
      setActiveCheckoutSessionId(data.sessionId);
      setCheckoutExpiresAt(data.expiresAt);
      setQrCreationState("ready");
    } catch (error) {
      setQrCreationError(
        error instanceof Error
          ? error.message
          : "Unable to create a secure checkout QR"
      );
      setQrCreationState("error");
    }
  }

  async function handleBorrowerSubmit(event) {
    event.preventDefault();

    if (!borrowerNameIsValid || !checkoutToken) {
      return;
    }

    setCheckoutSyncState("saving");
    setCheckoutError("");

    try {
      const response = await fetch(checkoutApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borrowerName: cleanedBorrowerName,
          checkoutToken,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to record checkout")
        );
      }

      const data = await response.json();
      setCompletedCheckout(data);
      setCheckoutSyncState("saved");
      setCheckoutConfirmed(true);
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error) {
      console.error("Unable to record checkout", error);
      setCheckoutError(error instanceof Error ? error.message : String(error));
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
                <strong>Category:</strong> {completedCheckout.category}
              </p>

              <p>
                <strong>Item:</strong> {completedCheckout.item}
              </p>

              {completedCheckout.id && (
                <p>
                  <strong>ID:</strong> {completedCheckout.id}
                </p>
              )}

              <p>
                <strong>Status:</strong> Checkout recorded securely
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
              disabled={
                !borrowerNameIsValid ||
                !checkoutToken ||
                checkoutSyncState === "saving"
              }
            >
              {checkoutSyncState === "saving"
                ? "Saving..."
                : "Confirm Checkout"}
            </button>

            {!checkoutToken && (
              <p className="form-error">
                This checkout link is invalid. Ask the organizer for a new QR.
              </p>
            )}

            {checkoutSyncState === "error" && (
              <p className="form-error">{checkoutError}</p>
            )}
          </form>
        </section>
      </main>
    );
  }

  if (!organizerAccess) {
    return (
      <main className="loaner-page">
        <section className="loaner-panel organizer-access-panel">
          <h1>Organizer Access</h1>

          <p className="access-explanation">
            Enter the private workspace details provided for this organizer.
          </p>

          <form className="loaner-form" onSubmit={handleOrganizerUnlock}>
            <label htmlFor="workspace-id">Workspace ID</label>
            <input
              id="workspace-id"
              type="text"
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              placeholder="Example: club-alpha"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
            />

            <label htmlFor="organizer-key">Organizer access key</label>
            <input
              id="organizer-key"
              type="password"
              value={organizerKey}
              onChange={(event) => setOrganizerKey(event.target.value)}
              placeholder="Enter the private access key"
              autoComplete="current-password"
            />

            <button
              className="primary-button"
              type="submit"
              disabled={
                !workspaceId.trim() ||
                !organizerKey.trim() ||
                accessState === "checking"
              }
            >
              {accessState === "checking" ? "Checking..." : "Unlock Workspace"}
            </button>

            {accessError && <p className="form-error">{accessError}</p>}
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
        <h1 className="loaners-title">Loaners</h1>

        <div className="organizer-session-bar">
          <span>Workspace: {organizerAccess.tenantId}</span>
          <button type="button" onClick={() => lockOrganizer()}>
            Lock
          </button>
        </div>

        <div className="loaner-mode-tabs">
          <button
            className={`loaner-mode-button checkout-mode ${
              appView === "checkout" ? "selected" : ""
            }`}
            type="button"
            onClick={() => setAppView("checkout")}
          >
            Check Out
          </button>

          <button
            className={`loaner-mode-button return-mode ${
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
            <h2 className="section-heading">Select a category</h2>

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
                    clearGeneratedCheckout();
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
                      clearGeneratedCheckout();
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
                      clearGeneratedCheckout();
                    }}
                    placeholder="Example: Radio 3"
                  />

                  <button
                    className="primary-button"
                    type="button"
                    onClick={createCheckoutQr}
                    disabled={
                      itemDescription.trim().length < 2 ||
                      qrCreationState === "creating"
                    }
                  >
                    {qrCreationState === "creating"
                      ? "Creating Secure QR..."
                      : "Create Checkout QR"}
                  </button>

                  {qrCreationError && (
                    <p className="form-error">{qrCreationError}</p>
                  )}
                </div>
              </section>
            )}

            {checkoutUrl && (
              <section className="qr-section">
                <h2>Scan to Check Out</h2>

                <div className="qr-code">
                  <QRCodeSVG value={checkoutUrl} size={240} />
                </div>

                <p className="qr-expiration">
                  This QR works once and expires at{" "}
                  {new Date(checkoutExpiresAt).toLocaleTimeString()}.
                </p>
              </section>
            )}
          </>
        )}

        {appView === "return" && (
          <>
            <h2 className="section-heading">Select a category</h2>

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
