import { Link } from "react-router-dom";

function ListYourPropertyPage() {
  return (
    <div>
      <section style={styles.hero}>
        <div style={styles.overlay}>
          <div style={styles.heroContent}>
            <h1 style={styles.title}>List Your Property on TourismHub LK</h1>
            <p style={styles.subtitle}>
              Register your hotel, resort, villa, or guesthouse and reach tourists
              exploring Sri Lanka.
            </p>

            <div style={styles.actions}>
              <Link to="/partner/register" style={styles.primaryBtn}>
                Register Partner
              </Link>

              <Link to="/partner/login" style={styles.secondaryBtn}>
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page">
        <div style={styles.sectionHeader}>
          <h2>How It Works</h2>
          <p>Simple approval process for trusted tourism listings.</p>
        </div>

        <div style={styles.grid}>
          <div className="card" style={styles.card}>
            <div style={styles.icon}>👤</div>
            <h3>1. Register as Partner</h3>
            <p>Create your partner account with your business details.</p>
          </div>

          <div className="card" style={styles.card}>
            <div style={styles.icon}>🏨</div>
            <h3>2. Register Property</h3>
            <p>Add your property details, rooms, photos, and policies.</p>
          </div>

          <div className="card" style={styles.card}>
            <div style={styles.icon}>✅</div>
            <h3>3. Admin Approval</h3>
            <p>Your property becomes visible to tourists after admin approval.</p>
          </div>
        </div>

        <div className="card" style={styles.notice}>
          <h3>Important Approval Rule</h3>
          <p>
            Your property will be saved as <strong>Pending</strong> first.
            It will only appear on the tourist hotel page after the admin approves it.
          </p>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: {
    minHeight: "520px",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    minHeight: "520px",
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    padding: "40px",
  },
  heroContent: {
    maxWidth: "760px",
    color: "white",
  },
  title: {
    fontSize: "54px",
    margin: "0 0 18px",
    fontWeight: "900",
  },
  subtitle: {
    fontSize: "20px",
    lineHeight: "1.6",
    marginBottom: "28px",
  },
  actions: {
    display: "flex",
    gap: "16px",
  },
  primaryBtn: {
    background: "#16a34a",
    color: "white",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
  },
  secondaryBtn: {
    background: "white",
    color: "#102033",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  card: {
    padding: "26px",
    textAlign: "center",
  },
  icon: {
    fontSize: "42px",
  },
  notice: {
    marginTop: "28px",
    padding: "24px",
    borderLeft: "6px solid #16a34a",
  },
};

export default ListYourPropertyPage;