function Navbar() {
  const navItems = ["Home", "Features", "About", "Contact"];

  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "14px",
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
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "8px",
          width: "100%",
        }}
      >
        {navItems.map((item) => (
          <div key={item} style={navItemStyle}>
            <a
              href="#"
              style={linkStyle}
              onClick={(event) => event.preventDefault()}
            >
              {item}
            </a>

            <span style={comingSoonStyle}>COMING SOON</span>
          </div>
        ))}
      </nav>
    </header>
  );
}

const navItemStyle = {
  position: "relative",
  minWidth: 0,
  paddingTop: "7px",
};

const linkStyle = {
  display: "block",
  color: "#FFFFFF",
  textDecoration: "none",
  fontWeight: "600",
  padding: "9px 4px",
  borderRadius: "8px",
  textAlign: "center",
  fontSize: "0.9rem",
  backgroundColor: "#2B2B2B",
  opacity: 0.65,
};

const comingSoonStyle = {
  position: "absolute",
  top: "0",
  left: "50%",
  transform: "translateX(-50%) rotate(-7deg)",
  whiteSpace: "nowrap",
  padding: "1px 3px",
  color: "#FF3B30",
  backgroundColor: "#1c1c1c",
  border: "2px solid #FF3B30",
  borderRadius: "3px",
  fontSize: "0.42rem",
  fontWeight: "900",
  letterSpacing: "0.2px",
  lineHeight: "1.1",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.5)",
  pointerEvents: "none",
};

export default Navbar;
