function Features() {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px",
        marginTop: "70px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          padding: "24px",
          border: "1px solid #333",
          borderRadius: "12px",
        }}
      >
        <h3>Plan Rides</h3>
        <p style={{ color: "#bbb" }}>
          Schedule club rides, share meeting points, and keep everyone informed.
        </p>
      </div>

      <div
        style={{
          padding: "24px",
          border: "1px solid #333",
          borderRadius: "12px",
        }}
      >
        <h3>Manage Members</h3>
        <p style={{ color: "#bbb" }}>
          Organize memberships, roles, attendance, and club communication.
        </p>
      </div>

      <div
        style={{
          padding: "24px",
          border: "1px solid #333",
          borderRadius: "12px",
        }}
      >
        <h3>Share Routes</h3>
        <p style={{ color: "#bbb" }}>
          Save trail information, route details, and important ride notes.
        </p>
      </div>

      <div
        style={{
          padding: "24px",
          border: "1px solid #333",
          borderRadius: "12px",
        }}
      >
        <h3>Ride Safer</h3>
        <p style={{ color: "#bbb" }}>
          Help riders stay connected and account for everyone during club
          events.
        </p>
      </div>
    </section>
  );
}

export default Features;