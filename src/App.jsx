import Navbar from "./components/Navbar";
import LoanerList from "./components/LoanerList";

function App() {
  const searchCheckout = new URLSearchParams(
    window.location.search
  ).get("checkout");
  const hashCheckout = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : ""
  ).get("checkout");
  const isCheckoutPage =
    searchCheckout === "true" || hashCheckout === "true";

  return (
    <>
      {!isCheckoutPage && <Navbar />}

      <main
        style={{
          maxWidth: "1100px",
          margin: "60px auto",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <LoanerList />
      </main>
    </>
  );
}

export default App;
