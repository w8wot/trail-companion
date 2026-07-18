import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Hero from "./components/Hero";

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
<Hero />
<Features />
</main>
    </>
  );
}

export default App;