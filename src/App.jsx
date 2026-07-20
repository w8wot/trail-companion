import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Hero from "./components/Hero";
import LoanerList from "./components/LoanerList";

function App() {
  return (
    <>
      <Navbar />

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