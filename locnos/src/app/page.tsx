export default function Home() {
  return (
    <div className="container">
      <main style={{ padding: "4rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "hsl(var(--primary))" }}>
          Locnos Rental App
        </h1>
        <p style={{ fontSize: "1.2rem", color: "hsl(var(--muted-foreground))", marginBottom: "2rem" }}>
          Manage your rentals with ease.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn btn-primary">Get Started</button>
          <button className="btn btn-secondary">Learn More</button>
        </div>
      </main>
    </div>
  );
}
