import { Link } from "react-router-dom";
import { Building2, CheckCircle2, UserRoundPlus } from "lucide-react";

const steps = [
  {
    icon: UserRoundPlus,
    title: "1. Register as Partner",
    text: "Create your partner account with your business details.",
  },
  {
    icon: Building2,
    title: "2. Register Property",
    text: "Add your property details, rooms, photos, and policies.",
  },
  {
    icon: CheckCircle2,
    title: "3. Admin Approval",
    text: "Your property becomes visible to tourists after admin approval.",
  },
];

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
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div className="card" style={styles.card} key={step.title}>
                <div style={styles.icon}>
                  <Icon size={30} strokeWidth={2.3} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            );
          })}
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
    fontSize: "clamp(38px, 5vw, 58px)",
    lineHeight: 1.05,
    margin: "0 0 18px",
    fontWeight: "850",
    color: "#ffffff",
    textShadow: "0 12px 36px rgba(0,0,0,0.48)",
  },
  subtitle: {
    fontSize: "18px",
    lineHeight: "1.6",
    marginBottom: "28px",
    maxWidth: "660px",
    color: "#ffffff",
    textShadow: "0 8px 24px rgba(0,0,0,0.42)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    padding: "26px",
    textAlign: "center",
  },
  icon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 16px",
    borderRadius: "18px",
    background: "#ecfdf5",
    color: "#047857",
    display: "grid",
    placeItems: "center",
  },
  notice: {
    marginTop: "28px",
    padding: "24px",
    borderLeft: "6px solid #16a34a",
  },
};

export default ListYourPropertyPage;
