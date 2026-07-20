function Navbar() {
  return (
    <header
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        borderBottom: "3px solid #FF7A00",
        backgroundColor: "#1c1c1c",
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "#FF7A00",
          fontSize: "1.8rem",
          letterSpacing: "1px",
        }}
      >
        Trail Companion
      </h1>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <a href="#" style={linkStyle}>
          Home
        </a>

        <a href="#" style={linkStyle}>
          Features
        </a>

        <a href="#" style={linkStyle}>
          About
        </a>

        <a href="#" style={linkStyle}>
          Contact
        </a>
      </nav>
    </header>
  );
}

const linkStyle = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: "600",
  padding: "8px 14px",
  borderRadius: "8px",
  backgroundColor: "#2B2B2B",
};

export default Navbar;