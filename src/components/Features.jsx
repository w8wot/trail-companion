import FeatureCard from "./FeatureCard";

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
      <FeatureCard
        title="Plan Rides"
        description="Schedule club rides, share meeting points, and keep everyone informed."
      />

      <FeatureCard
        title="Manage Members"
        description="Organize memberships, roles, attendance, and club communication."
      />

      <FeatureCard
        title="Share Routes"
        description="Save trail information, route details, and important ride notes."
      />

      <FeatureCard
        title="Ride Safer"
        description="Help riders stay connected and account for everyone during club events."
      />

    </section>
  );
}

export default Features;