import Navbar from "./components/Navbar";
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
    </>
  );
}

export default App;
