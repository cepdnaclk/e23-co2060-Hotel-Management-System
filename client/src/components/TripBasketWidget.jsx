import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearTripItems,
  getTripItemImage,
  getTripItemTypeLabel,
  groupTripItemsByType,
  readTripItems,
  removeTripItem,
  SAVED_TRIP_EVENT,
} from "../utils/tripBasket";

function TripBasketWidget({ assetUrl = (value) => value, sourceLabel = "Trip basket" }) {
  const [items, setItems] = useState(readTripItems);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("destinations");

  useEffect(() => {
    const refreshItems = () => setItems(readTripItems());
    window.addEventListener("storage", refreshItems);
    window.addEventListener(SAVED_TRIP_EVENT, refreshItems);

    return () => {
      window.removeEventListener("storage", refreshItems);
      window.removeEventListener(SAVED_TRIP_EVENT, refreshItems);
    };
  }, []);

  const handleRemove = (itemId) => {
    setItems(removeTripItem(itemId));
  };

  const handleClear = () => {
    if (!items.length) return;
    if (!window.confirm("Remove all saved trip items?")) return;
    clearTripItems();
    setItems([]);
  };

  return (
    <>
      <style>{basketCss}</style>
      <button
        type="button"
        className={`trip-basket-fab ${items.length ? "has-items" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close trip basket" : "Open trip basket"}
      >
        <span>+</span>
        <strong>Trip Basket</strong>
        <b>{items.length}</b>
      </button>

      {open ? (
        <aside className="trip-basket-panel" aria-label="Saved trip basket">
          <div className="trip-basket-head">
            <div>
              <span>{sourceLabel}</span>
              <h3>Saved for trip</h3>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close trip basket">
              x
            </button>
          </div>

          {items.length ? (
            <>
              <div className="trip-basket-tabs">
                {groupTripItemsByType(items, { includeEmpty: true }).map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    className={activeCategory === group.key ? "active" : ""}
                    onClick={() => setActiveCategory(group.key)}
                  >
                    <span>{group.icon} {group.label}</span>
                    <b>{group.items.length}</b>
                  </button>
                ))}
              </div>

              <div className="trip-basket-list">
                {(() => {
                  const activeGroup = groupTripItemsByType(items, { includeEmpty: true }).find(
                    (group) => group.key === activeCategory
                  );
                  const activeItems = activeGroup?.items || [];

                  if (!activeItems.length) {
                    return (
                      <div className="trip-basket-category-empty">
                        No {activeGroup?.label.toLowerCase()} saved yet.
                      </div>
                    );
                  }

                  return activeItems.map((item) => {
                    const image = assetUrl(getTripItemImage(item));

                    return (
                      <article key={item.id} className="trip-basket-item">
                        {image ? <img src={image} alt={item.name} /> : <div>{getTripItemTypeLabel(item)}</div>}
                        <section>
                          <strong>{item.name}</strong>
                          <p>
                            {getTripItemTypeLabel(item)} - {item.city || item.region || "Sri Lanka"}
                          </p>
                        </section>
                        <button type="button" onClick={() => handleRemove(item.id)}>
                          Remove
                        </button>
                      </article>
                    );
                  });
                })()}
              </div>
              <div className="trip-basket-foot">
                <button type="button" onClick={handleClear}>Clear all</button>
                <Link to="/trip-planner" onClick={() => setOpen(false)}>Open trip planner</Link>
              </div>
            </>
          ) : (
            <div className="trip-basket-empty">
              <strong>No saved trip items yet</strong>
              <p>Add hotels, events, guides, or places and they will appear in Plan Trip.</p>
            </div>
          )}
        </aside>
      ) : null}
    </>
  );
}

const basketCss = `
.trip-basket-fab{position:fixed;right:22px;bottom:24px;z-index:72;border:2px solid rgba(255,194,43,.82);border-radius:999px;background:linear-gradient(135deg,#064e45,#087768);color:#fff;box-shadow:0 18px 44px rgba(3,58,54,.28),0 0 0 6px rgba(255,194,43,.14);padding:12px 14px 12px 12px;display:flex;align-items:center;gap:10px;font-weight:900;cursor:pointer}.trip-basket-fab span{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#ffc22b;color:#063c38;font-size:22px}.trip-basket-fab strong{font-size:13px;letter-spacing:.06em;text-transform:uppercase}.trip-basket-fab b{min-width:28px;height:28px;border-radius:999px;display:grid;place-items:center;background:#fff;color:#064e45;font-size:13px}.trip-basket-fab.has-items{animation:tripBasketPulse 2.8s ease-in-out infinite}.trip-basket-panel{position:fixed;right:22px;bottom:94px;width:min(440px,calc(100vw - 32px));max-height:min(650px,calc(100vh - 130px));z-index:76;background:#fff;border:1px solid #dbece4;border-radius:26px;box-shadow:0 24px 70px rgba(2,50,49,.24);overflow:hidden;display:flex;flex-direction:column}.trip-basket-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px;background:linear-gradient(135deg,#064e45,#08806f);color:#fff}.trip-basket-head span{display:block;color:#ffe183;font-weight:900;letter-spacing:.18em;font-size:11px;text-transform:uppercase}.trip-basket-head h3{margin:6px 0 0;font-size:26px}.trip-basket-head button{border:none;background:rgba(255,255,255,.14);color:#fff;border-radius:50%;width:38px;height:38px;font-size:20px;line-height:1;cursor:pointer}.trip-basket-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:14px 14px 0}.trip-basket-tabs button{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid #dbece4;background:#f9fdf9;border-radius:14px;padding:9px 6px;cursor:pointer}.trip-basket-tabs button span{color:#064e45;font-weight:900;font-size:11px;text-align:center;line-height:1.2}.trip-basket-tabs button b{background:#eef8f4;color:#07584e;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:950}.trip-basket-tabs button.active{background:#064e45;border-color:#064e45}.trip-basket-tabs button.active span{color:#fff}.trip-basket-tabs button.active b{background:#ffc22b;color:#063c38}.trip-basket-list{padding:14px;overflow:auto;display:grid;gap:12px}.trip-basket-category-empty{padding:24px 8px;text-align:center;color:#657285;font-weight:750}.trip-basket-item{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid #e3efe8;border-radius:18px;background:#f9fdf9}.trip-basket-item img,.trip-basket-item>div{width:74px;height:66px;object-fit:cover;border-radius:14px;background:#e5eee9;display:grid;place-items:center;color:#064e45;font-size:12px;font-weight:950}.trip-basket-item strong{display:block;color:#064e45;font-size:15px;line-height:1.2}.trip-basket-item p{margin:4px 0 0;color:#657285;font-weight:750;font-size:12px}.trip-basket-item button{border:none;background:#fee2e2;color:#991b1b;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer}.trip-basket-foot{display:flex;gap:10px;justify-content:space-between;padding:14px;border-top:1px solid #e5efe9;background:#fbfcf7}.trip-basket-foot button,.trip-basket-foot a{border:none;text-decoration:none;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;text-align:center}.trip-basket-foot button{background:#fff0f0;color:#a31515}.trip-basket-foot a{background:#ffc22b;color:#063c38;flex:1}.trip-basket-empty{padding:28px;text-align:center}.trip-basket-empty strong{color:#064e45;font-size:20px}.trip-basket-empty p{color:#657285;font-weight:700;line-height:1.6}@keyframes tripBasketPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@media(max-width:680px){.trip-basket-fab{right:14px;bottom:18px}.trip-basket-fab strong{display:none}.trip-basket-panel{right:12px;bottom:82px;width:calc(100vw - 24px)}.trip-basket-item{grid-template-columns:64px 1fr}.trip-basket-item button{grid-column:1/-1}.trip-basket-item img,.trip-basket-item>div{width:64px;height:58px}}
`;

export default TripBasketWidget;
