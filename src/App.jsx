import Navbar from "./components/Navbar";
import LoanerList from "./components/LoanerList";

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : ""
  );
  const isLoanPage = [searchParams, hashParams].some(
    (params) =>
      params.get("loan") === "true" ||
      params.get("checkout") === "true"
  );

  return (
    <>
      {!isLoanPage && <Navbar />}

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
