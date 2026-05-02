import { Link } from "react-router-dom";

const heroVideos = [
  {
    title: "Golden beaches",
    location: "South Coast",
    video:
      "https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_30fps.mp4",
  },
  {
    title: "Tea country mornings",
    location: "Nuwara Eliya & Ella",
    video:
      "https://videos.pexels.com/video-files/2887463/2887463-uhd_2560_1440_24fps.mp4",
  },
  {
    title: "Island wildlife",
    location: "National Parks",
    video:
      "https://videos.pexels.com/video-files/854982/854982-hd_1920_1080_25fps.mp4",
  },
];

const cultureCards = [
  {
    title: "Culture & Heritage",
    text:
      "Explore ancient kingdoms, sacred temples, colourful festivals, traditional dancing, and UNESCO heritage cities like Kandy, Anuradhapura, Polonnaruwa, and Sigiriya.",
    image:
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "World-famous Cuisine",
    text:
      "Taste Sri Lankan rice and curry, hoppers, kottu, string hoppers, coconut sambol, fresh seafood, tropical fruits, and Ceylon tea.",
    image:
      "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Events & Festivals",
    text:
      "Experience Perahera processions, Vesak lanterns, Sinhala and Tamil New Year, beach festivals, cultural shows, and village celebrations.",
    image:
      "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=80",
  },
];

const gallery = [
  "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1575994532957-773da2f935fb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80",
];

function ExplorePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <span style={styles.eyebrow}>Explore Sri Lanka</span>
          <h1 style={styles.title}>
            Beauty, culture, heritage, cuisine, and unforgettable island events
          </h1>
          <p style={styles.subtitle}>
            A creative travel showcase for tourists to quickly feel why Sri
            Lanka is one of the most beautiful island destinations in the world.
          </p>

          <div style={styles.heroActions}>
            <Link to="/hotels" style={styles.primaryBtn}>
              Find Hotels
            </Link>
            <a href="#videos" style={styles.secondaryBtn}>
              Watch 5s Clips
            </a>
          </div>
        </div>

        <div style={styles.heroImageGrid}>
          {gallery.slice(0, 4).map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`Sri Lanka travel ${index + 1}`}
              style={{
                ...styles.heroImage,
                transform: index % 2 === 0 ? "translateY(20px)" : "none",
              }}
            />
          ))}
        </div>
      </section>

      <section id="videos" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.eyebrow}>Short travel videos</span>
          <h2 style={styles.sectionTitle}>5-second island moments</h2>
          <p style={styles.sectionText}>
            These short looping clips make the Explore page feel alive without
            making the tourist read too much.
          </p>
        </div>

        <div style={styles.videoGrid}>
          {heroVideos.map((item) => (
            <article key={item.title} style={styles.videoCard}>
              <video
                src={item.video}
                style={styles.video}
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />

              <div style={styles.videoOverlay}>
                <span>{item.location}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.eyebrow}>Why tourists love Sri Lanka</span>
          <h2 style={styles.sectionTitle}>One island, many experiences</h2>
        </div>

        <div style={styles.cardGrid}>
          {cultureCards.map((card) => (
            <article key={card.title} style={styles.infoCard}>
              <img src={card.image} alt={card.title} style={styles.infoImage} />
              <div style={styles.infoContent}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.gallerySection}>
        <div style={styles.sectionHeader}>
          <span style={styles.eyebrow}>Photo story</span>
          <h2 style={styles.sectionTitle}>Sri Lankan beauty in pictures</h2>
        </div>

        <div style={styles.galleryGrid}>
          {gallery.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`Sri Lanka gallery ${index + 1}`}
              style={styles.galleryImage}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f0fdfa 0%, #ffffff 45%, #fff7ed 100%)",
    color: "#0f172a",
  },

  hero: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "70px 18px 44px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "36px",
    alignItems: "center",
  },

  heroText: {
    maxWidth: "620px",
  },

  eyebrow: {
    display: "inline-flex",
    background: "#ccfbf1",
    color: "#0f766e",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    marginBottom: "14px",
  },

  title: {
    fontSize: "54px",
    lineHeight: 1,
    margin: "0 0 18px",
    letterSpacing: "-1.6px",
  },

  subtitle: {
    color: "#475569",
    fontSize: "18px",
    lineHeight: 1.7,
    fontWeight: "700",
    margin: 0,
  },

  heroActions: {
    display: "flex",
    gap: "14px",
    marginTop: "26px",
    flexWrap: "wrap",
  },

  primaryBtn: {
    background: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    padding: "14px 20px",
    borderRadius: "999px",
    fontWeight: "900",
    boxShadow: "0 16px 34px rgba(15, 118, 110, 0.25)",
  },

  secondaryBtn: {
    background: "#ffffff",
    color: "#0f766e",
    textDecoration: "none",
    padding: "14px 20px",
    borderRadius: "999px",
    fontWeight: "900",
    border: "1px solid #99f6e4",
  },

  heroImageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  heroImage: {
    width: "100%",
    height: "230px",
    objectFit: "cover",
    borderRadius: "28px",
    boxShadow: "0 22px 45px rgba(15, 23, 42, 0.16)",
  },

  section: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "44px 18px",
  },

  gallerySection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "44px 18px 80px",
  },

  sectionHeader: {
    maxWidth: "760px",
    marginBottom: "24px",
  },

  sectionTitle: {
    fontSize: "36px",
    margin: "0 0 10px",
  },

  sectionText: {
    color: "#64748b",
    fontWeight: "700",
    lineHeight: 1.7,
  },

  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  videoCard: {
    height: "320px",
    borderRadius: "28px",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
    background: "#0f172a",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  videoOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "22px",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  infoCard: {
    background: "#ffffff",
    borderRadius: "26px",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },

  infoImage: {
    width: "100%",
    height: "210px",
    objectFit: "cover",
  },

  infoContent: {
    padding: "20px",
  },

  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },

  galleryImage: {
    width: "100%",
    height: "230px",
    objectFit: "cover",
    borderRadius: "24px",
    boxShadow: "0 16px 35px rgba(15, 23, 42, 0.1)",
  },
};

export default ExplorePage;
