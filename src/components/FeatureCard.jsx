function FeatureCard({ title, description }) {
  return (
    <div
      style={{
        padding: "24px",
        border: "1px solid #333",
        borderRadius: "12px",
      }}
    >
      <h3>{title}</h3>
      <p style={{ color: "#bbb" }}>{description}</p>
    </div>
  );
}

export default FeatureCard;