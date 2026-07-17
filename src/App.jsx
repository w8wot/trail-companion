import Navbar from "./components/Navbar";
import Features from "./components/Features";

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
  <h2 style={{ fontSize: "3rem", marginBottom: "20px" }}>
    Ride Together. Ride Smarter.
  </h2>

  <p
    style={{
      fontSize: "1.25rem",
      color: "#bbb",
      maxWidth: "700px",
      margin: "0 auto 40px",
    }}
  >
    Trail Companion helps off-road clubs organize rides, manage members,
    share routes, and keep everyone connected on and off the trail.
  </p>

  <button
    style={{
      padding: "15px 35px",
      fontSize: "1rem",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      background: "#22c55e",
      color: "white",
      fontWeight: "bold",
    }}
  >
    Coming Soon
  </button>
<Features />
</main>
    </>
  );
}

export default App;