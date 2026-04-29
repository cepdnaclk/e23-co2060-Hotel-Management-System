import { useMemo, useState } from "react";

function GuidesPage() {
  const [filters, setFilters] = useState({
    city: "All",
    language: "All",
    specialization: "All",
    searchText: "",
  });

  const guides = [
    {
      id: 1,
      name: "Nimal Perera",
      city: "Kandy",
      languages: ["English", "Sinhala"],
      specialization: "Cultural Guide",
      rating: 4.8,
      reviews: 124,
      price: 6500,
      experience: "8 years",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=80",
      description:
        "Experienced cultural guide for Kandy, Temple of the Tooth, Peradeniya, and traditional experiences.",
    },
    {
      id: 2,
      name: "Ayesha Fernando",
      city: "Galle",
      languages: ["English", "Sinhala", "French"],
      specialization: "City Guide",
      rating: 4.9,
      reviews: 98,
      price: 7000,
      experience: "6 years",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80",
      description:
        "Friendly guide for Galle Fort, southern beaches, cafes, colonial history, and photography walks.",
    },
    {
      id: 3,
      name: "Suresh Jayawardena",
      city: "Yala",
      languages: ["English", "Sinhala"],
      specialization: "Wildlife Guide",
      rating: 4.7,
      reviews: 156,
      price: 9500,
      experience: "10 years",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
      description:
        "Safari and wildlife guide specialized in Yala, Udawalawe, leopards, elephants, and nature photography.",
    },
    {
      id: 4,
      name: "Tharindu Silva",
      city: "Ella",
      languages: ["English", "Sinhala", "German"],
      specialization: "Adventure Guide",
      rating: 4.6,
      reviews: 87,
      price: 7500,
      experience: "5 years",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80",
      description:
        "Adventure guide for Ella hikes, waterfalls, viewpoints, Nine Arches Bridge, and hill country routes.",
    },
    {
      id: 5,
      name: "Fathima Rizna",
      city: "Colombo",
      languages: ["English", "Tamil", "Arabic"],
      specialization: "City Guide",
      rating: 4.8,
      reviews: 73,
      price: 6000,
      experience: "4 years",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=700&q=80",
      description:
        "Colombo city guide for shopping, food, local markets, cultural places, and airport arrival support.",
    },
    {
      id: 6,
      name: "Kasun Bandara",
      city: "Sigiriya",
      languages: ["English", "Sinhala", "Hindi"],
      specialization: "Heritage Guide",
      rating: 4.9,
      reviews: 132,
      price: 8000,
      experience: "9 years",
      image:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=80",
      description:
        "Heritage guide for Sigiriya, Dambulla, Pidurangala, village tours, and cultural triangle routes.",
    },
  ];

  const cities = ["All", ...new Set(guides.map((guide) => guide.city))];

  const languages = [
    "All",
    ...new Set(guides.flatMap((guide) => guide.languages)),
  ];

  const specializations = [
    "All",
    ...new Set(guides.map((guide) => guide.specialization)),
  ];

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesCity = filters.city === "All" || guide.city === filters.city;

      const matchesLanguage =
        filters.language === "All" ||
        guide.languages.includes(filters.language);

      const matchesSpecialization =
        filters.specialization === "All" ||
        guide.specialization === filters.specialization;

      const searchValue = filters.searchText.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        guide.name.toLowerCase().includes(searchValue) ||
        guide.city.toLowerCase().includes(searchValue) ||
        guide.specialization.toLowerCase().includes(searchValue);

      return (
        matchesCity &&
        matchesLanguage &&
        matchesSpecialization &&
        matchesSearch
      );
    });
  }, [filters, guides]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      city: "All",
      language: "All",
      specialization: "All",
      searchText: "",
    });
  }

  function requestGuide(guide) {
    const request = {
      guideId: guide.id,
      guideName: guide.name,
      city: guide.city,
      specialization: guide.specialization,
      price: guide.price,
      requestedAt: new Date().toISOString(),
      status: "Pending",
    };

    const existingRequests = JSON.parse(
      localStorage.getItem("tourismhub_guide_requests") || "[]"
    );

    localStorage.setItem(
      "tourismhub_guide_requests",
      JSON.stringify([...existingRequests, request])
    );

    alert(
      `Guide request sent successfully!\n\nGuide: ${guide.name}\nCity: ${guide.city}\nStatus: Pending`
    );
  }

  return (
    <div className="guides-page">
      <section className="guides-hero">
        <div className="guides-hero-content">
          <p className="guides-eyebrow">Tour Guides</p>
          <h1>Find local guides for your Sri Lanka journey</h1>
          <p>
            Choose trusted guides by destination, language, specialization,
            rating, and price. Tourists can request a guide for cultural trips,
            wildlife safaris, city walks, and adventure experiences.
          </p>
        </div>
      </section>

      <section className="guides-filter-card">
        <div className="guides-filter-header">
          <div>
            <p className="guides-eyebrow">Guide search</p>
            <h2>Filter available guides</h2>
          </div>

          <button type="button" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="guides-filter-grid">
          <label>
            Search
            <input
              type="text"
              name="searchText"
              placeholder="Search by name, city, or type..."
              value={filters.searchText}
              onChange={handleChange}
            />
          </label>

          <label>
            City
            <select name="city" value={filters.city} onChange={handleChange}>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Language
            <select
              name="language"
              value={filters.language}
              onChange={handleChange}
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>

          <label>
            Specialization
            <select
              name="specialization"
              value={filters.specialization}
              onChange={handleChange}
            >
              {specializations.map((specialization) => (
                <option key={specialization} value={specialization}>
                  {specialization}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="guides-results-section">
        <div className="guides-results-header">
          <div>
            <p className="guides-eyebrow">Available guides</p>
            <h2>{filteredGuides.length} guide(s) found</h2>
          </div>

          <p>
            Guide requests are saved locally for now. Later we will connect this
            to backend, database, and admin approval.
          </p>
        </div>

        <div className="guides-grid">
          {filteredGuides.map((guide) => (
            <article className="guide-card" key={guide.id}>
              <img src={guide.image} alt={guide.name} />

              <div className="guide-card-body">
                <div className="guide-title-row">
                  <div>
                    <h3>{guide.name}</h3>
                    <p>{guide.city}</p>
                  </div>

                  <span>{guide.rating} ★</span>
                </div>

                <p className="guide-description">{guide.description}</p>

                <div className="guide-tags">
                  <span>{guide.specialization}</span>
                  <span>{guide.experience}</span>
                  <span>{guide.reviews} reviews</span>
                </div>

                <div className="guide-language-row">
                  {guide.languages.map((language) => (
                    <span key={language}>{language}</span>
                  ))}
                </div>

                <div className="guide-price-row">
                  <div>
                    <p>Starting from</p>
                    <strong>LKR {guide.price.toLocaleString()} / day</strong>
                  </div>

                  <button type="button" onClick={() => requestGuide(guide)}>
                    Request guide
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredGuides.length === 0 && (
          <div className="no-guides-card">
            <h3>No guides found</h3>
            <p>Try changing city, language, specialization, or search text.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default GuidesPage;