function Navbar() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid #333",
      }}
    >
      <h1 style={{ margin: 0 }}>Trail Companion</h1>

      <nav style={{ display: "flex", gap: "24px" }}>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Home
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Features
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          About
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Contact
        </a>
      </nav>
    </header>
  );
}

export default Navbar;