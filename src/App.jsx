import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Hero from "./components/Hero";
import LoanerList from "./components/LoanerList";

function App() {
  const isCheckoutPage = new URLSearchParams(
    window.location.search
  ).get("checkout") === "true";

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

      {!isCheckoutPage && <Features />}
    </>
  );
}

export default App;