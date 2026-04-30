import React, { useState } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import "./LanguageCurrencySelector.css";

function LanguageCurrencySelector() {
  const { language, setLanguage, currency, setCurrency } = useAppSettings();
  const [open, setOpen] = useState(false);

  const languageLabel = {
    en: "EN",
    si: "සිං",
    ta: "தமிழ்",
  };

  return (
    <div className="lc-selector">
      <button
        type="button"
        className="lc-main-btn"
        onClick={() => setOpen(!open)}
      >
        🇱🇰 {languageLabel[language]} / {currency}
      </button>

      {open && (
        <div className="lc-dropdown">
          <div className="lc-section">
            <h4>Language</h4>

            <button
              className={language === "en" ? "active" : ""}
              onClick={() => {
                setLanguage("en");
                setOpen(false);
              }}
            >
              English
            </button>

            <button
              className={language === "si" ? "active" : ""}
              onClick={() => {
                setLanguage("si");
                setOpen(false);
              }}
            >
              සිංහල
            </button>

            <button
              className={language === "ta" ? "active" : ""}
              onClick={() => {
                setLanguage("ta");
                setOpen(false);
              }}
            >
              தமிழ்
            </button>
          </div>

          <div className="lc-section">
            <h4>Currency</h4>

            {["LKR", "USD", "EUR", "GBP"].map((item) => (
              <button
                key={item}
                className={currency === item ? "active" : ""}
                onClick={() => {
                  setCurrency(item);
                  setOpen(false);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageCurrencySelector;