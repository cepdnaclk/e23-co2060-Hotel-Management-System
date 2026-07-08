import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hotel,
  Lightbulb,
  MapPin,
  Plus,
  Store,
  Ticket,
  X,
} from "lucide-react";
import { formatLkr } from "../data/exploreData";

export default function PlaceDetailModal({
  place,
  isOpen,
  onClose,
  onAddToTrip,
  isSaved,
  onRemoveFromTrip,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setActiveTab("overview");
  }, [place]);

  if (!isOpen || !place) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % place.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + place.images.length) % place.images.length);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={22} strokeWidth={2.4} />
        </button>

        {/* Image Gallery */}
        <div className="modal-gallery">
          <img
            src={place.images[currentImageIndex]}
            alt={`${place.name} - Image ${currentImageIndex + 1}`}
            className="gallery-main-image"
          />
          {place.images.length > 1 && (
            <>
              <button className="gallery-nav gallery-prev" onClick={prevImage}>
                <ChevronLeft size={28} strokeWidth={2.4} />
              </button>
              <button className="gallery-nav gallery-next" onClick={nextImage}>
                <ChevronRight size={28} strokeWidth={2.4} />
              </button>
              <div className="gallery-dots">
                {place.images.map((_, index) => (
                  <button
                    key={index}
                    className={`gallery-dot ${index === currentImageIndex ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
          <div className="gallery-region-badge">{place.region}</div>
          <div className="gallery-counter">
            {currentImageIndex + 1} / {place.images.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="thumbnail-strip">
          {place.images.map((img, index) => (
            <button
              key={index}
              className={`thumbnail ${index === currentImageIndex ? "active" : ""}`}
              onClick={() => setCurrentImageIndex(index)}
            >
              <img src={img} alt={`Thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="header-main">
              <h2>{place.name}</h2>
              <p className="location-text">
                <MapPin size={16} strokeWidth={2.4} />
                <span>{place.city}, {place.district} / {place.duration}</span>
              </p>
            </div>
            <div className="header-meta">
              <span className={`budget-badge budget-${place.budget.toLowerCase()}`}>
                {place.budget} Budget
              </span>
              <span className="cost-badge">{formatLkr(place.estimatedCost)}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-icon"><Clock size={20} /></span>
              <div>
                <strong>Duration</strong>
                <span>{place.duration}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><CalendarDays size={20} /></span>
              <div>
                <strong>Best Time</strong>
                <span>{place.bestTime}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><Ticket size={20} /></span>
              <div>
                <strong>Entry Fee</strong>
                <span>{place.entryFee}</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><Clock size={20} /></span>
              <div>
                <strong>Hours</strong>
                <span>{place.openingHours}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === "experiences" ? "active" : ""}`}
              onClick={() => setActiveTab("experiences")}
            >
              Things to Do ({place.experiences.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "tips" ? "active" : ""}`}
              onClick={() => setActiveTab("tips")}
            >
              Tips & Info
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="overview-tab">
                {/* Full Description */}
                <div className="description-section">
                  <h3>About {place.name}</h3>
                  {place.fullDescription.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {/* Highlights */}
                <div className="highlights-section">
                  <h3>Highlights</h3>
                  <div className="highlights-grid">
                    {place.highlights.map((highlight, index) => (
                      <div key={index} className="highlight-card">
                        <span className="highlight-icon">{highlight.icon}</span>
                        <div>
                          <strong>{highlight.title}</strong>
                          <p>{highlight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="tags-section">
                  <h3>Categories & Tags</h3>
                  <div className="tags-list">
                    {place.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nearby Places */}
                <div className="nearby-section">
                  <h3>Nearby Attractions</h3>
                  <div className="nearby-list">
                    {place.nearbyPlaces.map((nearby, index) => (
                      <div key={index} className="nearby-item">
                        <span className="nearby-name">{nearby.name}</span>
                        <span className="nearby-distance">{nearby.distance}</span>
                        <span className="nearby-type">{nearby.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "experiences" && (
              <div className="experiences-tab">
                <h3>Things to Experience</h3>
                <div className="experiences-list">
                  {place.experiences.map((exp, index) => (
                    <div key={index} className="experience-card">
                      <div className="exp-header">
                        <h4>{exp.title}</h4>
                        <div className="exp-meta">
                          <span className="exp-duration">
                            <Clock size={15} /> {exp.duration}
                          </span>
                          {exp.cost !== undefined && (
                            <span className="exp-cost">
                              {exp.cost === 0 ? "Free" : formatLkr(exp.cost)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p>{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "tips" && (
              <div className="tips-tab">
                {/* Travel Tips */}
                <div className="tips-section">
                  <h3><Lightbulb size={18} /> Travel Tips</h3>
                  <ul className="tips-list">
                    {place.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Facilities */}
                <div className="facilities-section">
                  <h3><Store size={18} /> Available Facilities</h3>
                  <div className="facilities-grid">
                    {place.facilities.map((facility, index) => (
                      <span key={index} className="facility-chip">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="location-section">
                  <h3><MapPin size={18} /> Location Details</h3>
                  <div className="location-info">
                    <p>
                      <strong>City:</strong> {place.city}
                    </p>
                    <p>
                      <strong>District:</strong> {place.district}
                    </p>
                    <p>
                      <strong>Region:</strong> {place.region}
                    </p>
                    <p className="coordinates">
                      <strong>GPS:</strong> {place.lat}, {place.lng}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="maps-link"
                  >
                    <MapPin size={16} />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            {isSaved ? (
              <button
                className="action-btn saved-btn"
                onClick={() => onRemoveFromTrip(place.id)}
              >
                <Check size={17} /> Saved - Remove from Trip
              </button>
            ) : (
              <button className="action-btn add-btn" onClick={() => onAddToTrip(place)}>
                <Plus size={17} /> Add to My Trip
              </button>
            )}
            <Link
              to={`/hotels?city=${encodeURIComponent(place.city)}`}
              className="action-btn hotel-btn"
            >
              <Hotel size={17} /> Find Hotels in {place.city}
            </Link>
          </div>
        </div>
      </div>

      <style>{modalStyles}</style>
    </div>
  );
}

const modalStyles = `
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(14, 59, 58, 0.85);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
  }

  .modal-container {
    background: #F6F0E4;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 30px 80px rgba(0,0,0,0.4);
  }

  .modal-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 100;
    width: 44px;
    height: 44px;
    border: none;
    background: rgba(255,255,255,0.95);
    color: #0E3B3A;
    font-size: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }

  /* Gallery Styles */
  .modal-gallery {
    position: relative;
    height: 350px;
    overflow: hidden;
    background: #0E3B3A;
  }

  .gallery-main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .gallery-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    background: rgba(255,255,255,0.9);
    border: none;
    color: #0E3B3A;
    font-size: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-prev { left: 12px; }
  .gallery-next { right: 12px; }

  .gallery-dots {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
  }

  .gallery-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid white;
    background: transparent;
    cursor: pointer;
    padding: 0;
  }

  .gallery-dot.active {
    background: white;
  }

  .gallery-region-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    background: #D79922;
    color: #0E3B3A;
    padding: 8px 14px;
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gallery-counter {
    position: absolute;
    bottom: 16px;
    right: 16px;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 700;
    font-family: monospace;
  }

  /* Thumbnail Strip */
  .thumbnail-strip {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: #0E3B3A;
    overflow-x: auto;
  }

  .thumbnail {
    flex: 0 0 auto;
    width: 70px;
    height: 50px;
    padding: 0;
    border: 3px solid transparent;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.2s;
    background: none;
  }

  .thumbnail.active {
    border-color: #D79922;
    opacity: 1;
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Content Area */
  .modal-content {
    padding: 24px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 32px;
    color: #0E3B3A;
    line-height: 1.1;
  }

  .location-text {
    margin: 8px 0 0;
    color: #3B6E52;
    font-weight: 700;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .header-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .budget-badge, .cost-badge {
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .budget-badge.budget-low { background: #e3ede4; color: #3B6E52; }
  .budget-badge.budget-medium { background: #f6e6c4; color: #8a5d10; }
  .budget-badge.budget-high { background: #f1dcd8; color: #A6392E; }

  .cost-badge {
    background: #0E3B3A;
    color: #F6F0E4;
    font-family: var(--font-mono);
  }

  /* Quick Stats */
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: white;
    border: 1px solid #e4d9bf;
  }

  .stat-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .stat-icon {
    color: #3B6E52;
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
  }

  .stat-item strong {
    display: block;
    font-size: 11px;
    color: #4B463D;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-item span {
    font-size: 13px;
    color: #0E3B3A;
    font-weight: 600;
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid #e4d9bf;
    margin-bottom: 20px;
  }

  .tab-btn {
    flex: 1;
    padding: 14px 16px;
    background: transparent;
    border: none;
    font-weight: 700;
    color: #4B463D;
    cursor: pointer;
    position: relative;
    font-size: 14px;
  }

  .tab-btn.active {
    color: #0E3B3A;
  }

  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 3px;
    background: #D79922;
  }

  /* Tab Content */
  .tab-content {
    min-height: 300px;
  }

  .tab-content h3 {
    font-size: 20px;
    color: #0E3B3A;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Overview Tab */
  .description-section p {
    color: #4B463D;
    line-height: 1.8;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .highlights-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .highlight-card {
    display: flex;
    gap: 12px;
    padding: 14px;
    background: white;
    border: 1px solid #e4d9bf;
  }

  .highlight-icon {
    font-size: 24px;
  }

  .highlight-card strong {
    display: block;
    color: #0E3B3A;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .highlight-card p {
    margin: 0;
    font-size: 13px;
    color: #4B463D;
    line-height: 1.4;
  }

  .tags-section {
    margin-bottom: 24px;
  }

  .tags-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tag-chip {
    background: #0E3B3A;
    color: #F6F0E4;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
  }

  .nearby-section {
    margin-bottom: 24px;
  }

  .nearby-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nearby-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 16px;
    padding: 12px;
    background: white;
    border: 1px solid #e4d9bf;
  }

  .nearby-name {
    font-weight: 700;
    color: #0E3B3A;
  }

  .nearby-distance {
    color: #3B6E52;
    font-weight: 700;
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .nearby-type {
    background: #EFE6D3;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #4B463D;
  }

  /* Experiences Tab */
  .experiences-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .experience-card {
    padding: 18px;
    background: white;
    border: 1px solid #e4d9bf;
    border-left: 4px solid #D79922;
  }

  .exp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .experience-card h4 {
    margin: 0;
    color: #0E3B3A;
    font-size: 16px;
  }

  .exp-meta {
    display: flex;
    gap: 12px;
  }

  .exp-duration, .exp-cost {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    background: #EFE6D3;
    color: #4B463D;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .exp-cost {
    background: #3B6E52;
    color: white;
  }

  .experience-card p {
    margin: 0;
    color: #4B463D;
    line-height: 1.6;
    font-size: 14px;
  }

  /* Tips Tab */
  .tips-section, .facilities-section, .location-section {
    margin-bottom: 24px;
  }

  .tips-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tips-list li {
    padding: 12px 16px;
    background: white;
    border: 1px solid #e4d9bf;
    margin-bottom: 8px;
    color: #4B463D;
    font-weight: 500;
    position: relative;
    padding-left: 40px;
  }

  .tips-list li::before {
    content: "";
    position: absolute;
    left: 17px;
    top: 16px;
    width: 8px;
    height: 13px;
    border: solid #3B6E52;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .facilities-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .facility-chip {
    background: #3B6E52;
    color: white;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
  }

  .location-info {
    background: white;
    padding: 16px;
    border: 1px solid #e4d9bf;
    margin-bottom: 12px;
  }

  .location-info p {
    margin: 8px 0;
    color: #4B463D;
  }

  .coordinates {
    font-family: var(--font-mono);
    color: #0E3B3A !important;
  }

  .maps-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0E3B3A;
    color: #F6F0E4;
    padding: 12px 20px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
  }

  /* Action Buttons */
  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 2px solid #e4d9bf;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 200px;
    padding: 16px 24px;
    border: none;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .action-btn.add-btn {
    background: #D79922;
    color: #0E3B3A;
  }

  .action-btn.saved-btn {
    background: #f1dcd8;
    color: #A6392E;
    border: 2px dashed #A6392E;
  }

  .action-btn.hotel-btn {
    background: #0E3B3A;
    color: #F6F0E4;
  }

  @media (max-width: 768px) {
    .modal-overlay {
      padding: 0;
      align-items: flex-start;
    }

    .modal-container {
      max-height: 100vh;
      min-height: 100vh;
    }

    .modal-gallery {
      height: 250px;
    }

    .quick-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .highlights-grid {
      grid-template-columns: 1fr;
    }

    .tab-btn {
      font-size: 12px;
      padding: 12px 8px;
    }

    .modal-header h2 {
      font-size: 26px;
    }
  }
`;
