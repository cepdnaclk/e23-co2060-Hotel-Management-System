import ContentImage from "./ContentImage";
import { assetUrl as resolveAssetUrl } from "../utils/assetUrl";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  CalendarDays,
  Compass,
  ExternalLink,
  Hotel,
  MapPin,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  clearTripItems,
  getTripItemCategoryKey,
  getTripItemImage,
  getTripItemKey,
  getTripItemLink,
  getTripItemLocation,
  getTripItemTypeLabel,
  groupTripItemsByType,
  readTripItems,
  removeTripItem,
  SAVED_TRIP_EVENT,
} from "../utils/tripBasket";


const CATEGORY_ICONS = {
  destinations: MapPin,
  hotels: Hotel,
  events: Ticket,
  guides: UserRound,
};


const EXPLORE_LINKS = [
  {
    key: "destinations",
    label: "Explore places",
    to: "/explore",
    icon: MapPin,
  },
  {
    key: "hotels",
    label: "Find hotels",
    to: "/hotels",
    icon: Hotel,
  },
  {
    key: "events",
    label: "Explore events",
    to: "/events",
    icon: CalendarDays,
  },
  {
    key: "guides",
    label: "Explore guides",
    to: "/tourist-guides",
    icon: Compass,
  },
];


const formatCost = (value) => {
  const amount = Number(value || 0);

  if (!amount) {
    return "";
  }

  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
};


function TripBasketWidget({
  assetUrl = resolveAssetUrl,
  sourceLabel = "Trip basket",
  embedded = false,
  days = [],
  onAddToDay,
  onNavigateAway,
}) {
  const location =
    useLocation();

  const [
    items,
    setItems,
  ] = useState(
    readTripItems
  );

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    activeCategory,
    setActiveCategory,
  ] = useState(
    "destinations"
  );

  const [
    selectedDayByItem,
    setSelectedDayByItem,
  ] = useState({});


  useEffect(() => {
    const refreshItems =
      () =>
        setItems(
          readTripItems()
        );

    window.addEventListener(
      "storage",
      refreshItems
    );

    window.addEventListener(
      SAVED_TRIP_EVENT,
      refreshItems
    );

    return () => {
      window.removeEventListener(
        "storage",
        refreshItems
      );

      window.removeEventListener(
        SAVED_TRIP_EVENT,
        refreshItems
      );
    };
  }, []);


  const [panelBounds, setPanelBounds] = useState({});

  useLayoutEffect(() => {
    if (!open || embedded) return undefined;
    const header = document.querySelector(".site-header");
    const viewport = window.visualViewport;
    const updateBounds = () => {
      const viewportTop = viewport?.offsetTop || 0;
      const viewportHeight = viewport?.height || window.innerHeight;
      const headerBottom = header?.getBoundingClientRect().bottom || 0;
      const top = Math.max(viewportTop, headerBottom) + 12;
      const bottomGap = window.innerWidth <= 680 ? 74 : 84;
      const bottom = window.innerHeight - viewportTop - viewportHeight + bottomGap;
      setPanelBounds({
        "--trip-basket-bottom": `${bottom}px`,
        "--trip-basket-available": `${Math.max(0, viewportTop + viewportHeight - bottomGap - top)}px`,
      });
    };
    const observer = new ResizeObserver(updateBounds);
    if (header) observer.observe(header);
    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, { passive: true });
    viewport?.addEventListener("resize", updateBounds);
    viewport?.addEventListener("scroll", updateBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
      viewport?.removeEventListener("resize", updateBounds);
      viewport?.removeEventListener("scroll", updateBounds);
    };
  }, [open, embedded]);

  const groups =
    useMemo(
      () =>
        groupTripItemsByType(
          items,
          {
            includeEmpty: true,
          }
        ),
      [
        items,
      ]
    );


  const activeGroup =
    groups.find(
      (group) =>
        group.key ===
        activeCategory
    ) ||
    groups[0];


  const getUsageDays =
    (item) => {
      const category =
        getTripItemCategoryKey(
          item
        );

      const key =
        getTripItemKey(
          item
        );

      return days
        .map(
          (
            day,
            dayIndex
          ) => {
            const dayItems =
              Array.isArray(
                day?.[
                  category
                ]
              )
                ? day[
                    category
                  ]
                : [];

            const used =
              dayItems.some(
                (
                  dayItem
                ) =>
                  getTripItemKey(
                    dayItem
                  ) === key
              );

            return used
              ? dayIndex + 1
              : null;
          }
        )
        .filter(Boolean);
    };


  const handleRemove =
    (item) => {
      setItems(
        removeTripItem(
          item
        )
      );
    };


  const handleClear =
    () => {
      if (!items.length) {
        return;
      }

      if (
        !window.confirm(
          "Remove all saved trip items?"
        )
      ) {
        return;
      }

      clearTripItems();

      setItems([]);
    };


  const handleAdd =
    (item) => {
      if (
        typeof onAddToDay !==
        "function"
      ) {
        return;
      }

      const itemKey =
        getTripItemKey(
          item
        );

      const selected =
        selectedDayByItem[
          itemKey
        ];

      const dayIndex =
        selected ===
          undefined ||
        selected === ""
          ? 0
          : Number(selected);

      onAddToDay(
        dayIndex,
        item
      );
    };


  const handleNavigateAway =
    () => {
      if (
        typeof onNavigateAway ===
        "function"
      ) {
        onNavigateAway();
      }

      setOpen(
        false
      );
    };


  const renderItem =
    (item) => {
      const itemKey =
        getTripItemKey(
          item
        );

      const image =
        assetUrl(
          getTripItemImage(
            item
          )
        );

      const link =
        getTripItemLink(
          item
        );

      const usageDays =
        getUsageDays(
          item
        );

      const category =
        getTripItemCategoryKey(
          item
        );

      const firstSuitableDayIndex =
        category ===
        "destinations"
          ? 0
          : Math.max(
              0,
              days.findIndex(
                (day) =>
                  Array.isArray(
                    day?.destinations
                  ) &&
                  day.destinations
                    .length > 0
              )
            );

      const selectedDay =
        selectedDayByItem[
          itemKey
        ] ??
        String(
          firstSuitableDayIndex
        );

      const selectedDayNumber =
        Number(
          selectedDay
        ) + 1;

      const alreadyOnSelectedDay =
        usageDays.includes(
          selectedDayNumber
        );

      return (
        <article
          key={
            itemKey
          }
          className="trip-basket-item"
        >
          <div className="trip-basket-item-media">
            {image ? (
              <ContentImage
                src={
                  image
                }
                alt={
                  item.name ||
                  getTripItemTypeLabel(
                    item
                  )
                }
              />
            ) : (
              <div className="trip-basket-item-placeholder">
                {
                  getTripItemTypeLabel(
                    item
                  )
                }
              </div>
            )}
          </div>


          <div className="trip-basket-item-main">
            <div className="trip-basket-item-topline">
              <span>
                {
                  getTripItemTypeLabel(
                    item
                  )
                }
              </span>

              {formatCost(
                item.estimatedCost
              ) && (
                <b>
                  {formatCost(
                    item.estimatedCost
                  )}
                </b>
              )}
            </div>

            <strong>
              {item.name ||
                "Saved trip item"}
            </strong>

            <p>
              {
                getTripItemLocation(
                  item
                )
              }
            </p>

            {usageDays.length >
              0 && (
              <small>
                Added to{" "}
                {usageDays
                  .map(
                    (
                      day
                    ) =>
                      `Day ${day}`
                  )
                  .join(", ")}
              </small>
            )}


            <div className="trip-basket-item-actions">
              {link && (
                <Link
                  to={
                    link
                  }
                  className="trip-basket-view-link"
                  onClick={
                    handleNavigateAway
                  }
                >
                  <ExternalLink
                    size={14}
                  />

                  View
                </Link>
              )}

              <button
                type="button"
                className="trip-basket-remove"
                onClick={() =>
                  handleRemove(
                    item
                  )
                }
              >
                <Trash2
                  size={14}
                />

                Remove
              </button>
            </div>


            {embedded &&
              typeof onAddToDay ===
                "function" &&
              days.length > 0 && (
              <div className="trip-basket-day-action">
                <select
                  value={
                    selectedDay
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setSelectedDayByItem(
                        (
                          current
                        ) => ({
                          ...current,

                          [itemKey]:
                            event
                              .target
                              .value,
                        })
                      )
                  }
                  aria-label={`Choose day for ${item.name}`}
                >
                  {days.map(
                    (
                      day,
                      dayIndex
                    ) => (
                      <option
                        key={
                          day.dayNumber ||
                          dayIndex
                        }
                        value={
                          String(
                            dayIndex
                          )
                        }
                      >
                        Day{" "}
                        {
                          dayIndex +
                          1
                        }
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="trip-basket-add-day"
                  disabled={
                    alreadyOnSelectedDay
                  }
                  onClick={() =>
                    handleAdd(
                      item
                    )
                  }
                >
                  <Plus
                    size={15}
                  />

                  {alreadyOnSelectedDay
                    ? "Added"
                    : "Add to day"}
                </button>
              </div>
            )}
          </div>
        </article>
      );
    };


  const basketContent = (
    <>
      <div className="trip-basket-tabs">
        {groups.map(
          (
            group
          ) => {
            const Icon =
              CATEGORY_ICONS[
                group.key
              ] ||
              ShoppingBag;

            return (
              <button
                key={
                  group.key
                }
                type="button"
                className={
                  activeCategory ===
                  group.key
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(
                    group.key
                  )
                }
              >
                <Icon
                  size={16}
                />

                <span>
                  {
                    group.label
                  }
                </span>

                <b>
                  {
                    group.items
                      .length
                  }
                </b>
              </button>
            );
          }
        )}
      </div>


      {activeGroup
        ?.items?.length ? (
        <div className="trip-basket-list">
          {activeGroup.items.map(
            renderItem
          )}
        </div>
      ) : (
        <div className="trip-basket-category-empty">
          <strong>
            No{" "}
            {activeGroup?.label
              ?.toLowerCase() ||
              "items"}{" "}
            saved yet
          </strong>

          <span>
            Explore and save items to use them here.
          </span>
        </div>
      )}


      <div className="trip-basket-explore">
        {EXPLORE_LINKS.map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.key
                }
                to={
                  item.to
                }
                onClick={
                  handleNavigateAway
                }
              >
                <Icon
                  size={15}
                />

                {
                  item.label
                }
              </Link>
            );
          }
        )}
      </div>


      {items.length > 0 && (
        <div className="trip-basket-foot">
          <span>
            {items.length} saved{" "}
            {items.length === 1
              ? "item"
              : "items"}
          </span>

          <button
            type="button"
            onClick={
              handleClear
            }
          >
            Clear all
          </button>
        </div>
      )}
    </>
  );


  if (embedded) {
    return (
      <>
        <style>
          {
            basketCss
          }
        </style>

        <div className="trip-basket-embedded">
          <div className="trip-basket-embedded-head">
            <div>
              <span>
                {
                  sourceLabel
                }
              </span>

              <h3>
                Saved trip items
              </h3>
            </div>

            <div className="trip-basket-count">
              <ShoppingBag
                size={16}
              />

              {
                items.length
              }
            </div>
          </div>

          {
            basketContent
          }
        </div>
      </>
    );
  }


  if (
    location.pathname.startsWith(
      "/trip-planner"
    )
  ) {
    return null;
  }


  return (
    <>
      <style>
        {
          basketCss
        }
      </style>

      <button
        type="button"
        className={`trip-basket-fab ${
          items.length
            ? "has-items"
            : ""
        }`}
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        aria-label={
          open
            ? "Close trip basket"
            : "Open trip basket"
        }
      >
        <ShoppingBag
          size={18}
        />

        <strong>
          Trip Basket
        </strong>

        <b>
          {
            items.length
          }
        </b>
      </button>


      {open && (
        <aside
          className="trip-basket-panel"
          style={panelBounds}
          aria-label="Saved trip basket"
        >
          <div className="trip-basket-head">
            <div>
              <span>
                {
                  sourceLabel
                }
              </span>

              <h3>
                Saved for trip
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(
                  false
                )
              }
              aria-label="Close trip basket"
            >
              <X
                size={18}
              />
            </button>
          </div>

          <div className="trip-basket-panel-content">
            {basketContent}
          </div>

          <div className="trip-basket-open-planner">
            <Link
              to="/trip-planner"
              onClick={() =>
                setOpen(
                  false
                )
              }
            >
              Open trip planner
            </Link>
          </div>
        </aside>
      )}
    </>
  );
}


const basketCss = `
.trip-basket-fab{
  position:fixed;
  right:24px;
  bottom:24px;
  z-index:72;
  min-height:48px;
  padding:0 10px 0 15px;
  display:flex;
  align-items:center;
  gap:9px;
  border:1px solid #cbded8;
  border-radius:999px;
  background:#ffffff;
  color:#173f3b;
  box-shadow:0 12px 32px rgba(25,55,50,.15);
  cursor:pointer;
  font:inherit;
}
.trip-basket-fab:hover{
  border-color:#94bdb4;
  box-shadow:0 16px 36px rgba(25,55,50,.2);
}
.trip-basket-fab strong{
  font-size:12px;
  font-weight:750;
}
.trip-basket-fab b{
  min-width:28px;
  height:28px;
  display:grid;
  place-items:center;
  border-radius:999px;
  background:#0f766e;
  color:#ffffff;
  font-size:11px;
}
.trip-basket-fab.has-items b{
  background:#0b625b;
}

.trip-basket-panel{
  position:fixed;
  right:24px;
  bottom:var(--trip-basket-bottom,84px);
  width:min(430px,calc(100vw - 32px));
  max-height:min(680px,var(--trip-basket-available,calc(100dvh - 200px)));
  z-index:10002;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  border:1px solid #d9e5e1;
  border-radius:18px;
  background:#ffffff;
  box-shadow:0 24px 70px rgba(28,52,48,.2);
}

/* The outer panel is bounded; its middle section can scroll even on short screens.
   The item list gets its own scroll area whenever space permits. */
.trip-basket-panel > .trip-basket-head,
.trip-basket-panel > .trip-basket-open-planner{
  flex:none;
}
.trip-basket-panel-content{
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:auto;
  overscroll-behavior:contain;
}
.trip-basket-panel-content > :not(.trip-basket-list){
  flex:none;
}
.trip-basket-panel-content .trip-basket-list{
  flex:1 1 auto;
  min-height:120px;
  overscroll-behavior:contain;
}
.trip-basket-panel .trip-basket-open-planner{
  padding-top:10px;
}

.trip-basket-head,
.trip-basket-embedded-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
}
.trip-basket-head{
  padding:17px 18px;
  border-bottom:1px solid #e4ebe8;
  background:#ffffff;
}
.trip-basket-head span,
.trip-basket-embedded-head span{
  display:block;
  margin-bottom:4px;
  color:#0f766e;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.trip-basket-head h3,
.trip-basket-embedded-head h3{
  margin:0;
  color:#17211f;
  font-size:18px;
  line-height:1.25;
  letter-spacing:-.02em;
}
.trip-basket-head>button{
  width:34px;
  height:34px;
  display:grid;
  place-items:center;
  border:1px solid #dce5e2;
  border-radius:9px;
  background:#ffffff;
  color:#5f6d68;
  cursor:pointer;
}

.trip-basket-tabs{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:7px;
  padding:12px;
}
.trip-basket-tabs button{
  min-width:0;
  min-height:58px;
  padding:8px 5px;
  display:grid;
  place-items:center;
  gap:3px;
  border:1px solid #dfe8e5;
  border-radius:10px;
  background:#fafcfb;
  color:#5e6d68;
  cursor:pointer;
  font:inherit;
}
.trip-basket-tabs button svg{
  color:#0f766e;
}
.trip-basket-tabs button span{
  overflow:hidden;
  max-width:100%;
  color:inherit;
  font-size:10px;
  font-weight:700;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.trip-basket-tabs button b{
  min-width:20px;
  height:20px;
  padding:0 5px;
  display:grid;
  place-items:center;
  border-radius:999px;
  background:#edf4f1;
  color:#52615c;
  font-size:9px;
}
.trip-basket-tabs button.active{
  border-color:#9ccdc2;
  background:#edf8f5;
  color:#115f57;
}
.trip-basket-tabs button.active b{
  background:#0f766e;
  color:#ffffff;
}

.trip-basket-list{
  min-height:0;
  padding:0 12px 12px;
  display:grid;
  gap:9px;
  overflow:auto;
}

.trip-basket-item{
  display:grid;
  grid-template-columns:76px minmax(0,1fr);
  gap:11px;
  padding:10px;
  border:1px solid #e0e8e5;
  border-radius:11px;
  background:#ffffff;
}
.trip-basket-item-media img,
.trip-basket-item-placeholder{
  width:76px;
  height:72px;
  border-radius:8px;
  object-fit:cover;
  background:#edf2ef;
}
.trip-basket-item-placeholder{
  display:grid;
  place-items:center;
  padding:6px;
  color:#65726e;
  font-size:10px;
  font-weight:700;
  text-align:center;
}
.trip-basket-item-main{
  min-width:0;
}
.trip-basket-item-topline{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}
.trip-basket-item-topline span{
  color:#0f766e;
  font-size:9px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
}
.trip-basket-item-topline b{
  color:#55635f;
  font-size:10px;
  font-weight:700;
}
.trip-basket-item-main>strong{
  display:block;
  margin-top:3px;
  overflow:hidden;
  color:#1d2926;
  font-size:13px;
  font-weight:750;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.trip-basket-item-main>p{
  margin:3px 0 0;
  overflow:hidden;
  color:#75817d;
  font-size:10px;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.trip-basket-item-main>small{
  display:block;
  margin-top:5px;
  color:#2b6e64;
  font-size:9px;
  font-weight:700;
}

.trip-basket-item-actions{
  margin-top:7px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.trip-basket-view-link,
.trip-basket-remove{
  min-height:29px;
  padding:0 9px;
  display:inline-flex;
  align-items:center;
  gap:5px;
  border-radius:7px;
  font-size:10px;
  font-weight:700;
  text-decoration:none;
}
.trip-basket-view-link{
  border:1px solid #d7e2de;
  background:#ffffff;
  color:#35534d;
}
.trip-basket-remove{
  border:1px solid #efdad6;
  background:#fff8f7;
  color:#9b463c;
  cursor:pointer;
}

.trip-basket-day-action{
  margin-top:8px;
  display:grid;
  grid-template-columns:minmax(95px,.8fr) minmax(110px,1.2fr);
  gap:7px;
}
.trip-basket-day-action select,
.trip-basket-add-day{
  min-width:0;
  height:34px;
  border-radius:8px;
  font:inherit;
}
.trip-basket-day-action select{
  border:1px solid #d9e3df;
  background:#ffffff;
  color:#41504c;
  padding:0 7px;
  font-size:10px;
}
.trip-basket-add-day{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  border:1px solid #0f766e;
  background:#0f766e;
  color:#ffffff;
  font-size:10px;
  font-weight:750;
  cursor:pointer;
}
.trip-basket-add-day:disabled{
  border-color:#cfdad6;
  background:#edf2ef;
  color:#7c8984;
  cursor:default;
}

.trip-basket-category-empty{
  min-height:120px;
  padding:24px 16px;
  display:grid;
  place-items:center;
  align-content:center;
  text-align:center;
}
.trip-basket-category-empty strong{
  color:#394743;
  font-size:13px;
}
.trip-basket-category-empty span{
  margin-top:4px;
  color:#86908d;
  font-size:10px;
}

.trip-basket-explore{
  padding:12px;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
  border-top:1px solid #e8eeeb;
}
.trip-basket-explore a{
  min-height:38px;
  padding:0 10px;
  display:flex;
  align-items:center;
  gap:7px;
  border:1px solid #dce6e2;
  border-radius:9px;
  background:#fafcfb;
  color:#31514a;
  font-size:10px;
  font-weight:700;
  text-decoration:none;
}
.trip-basket-explore a:hover{
  border-color:#add2c8;
  background:#f1f9f6;
}

.trip-basket-foot{
  padding:10px 12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border-top:1px solid #e8eeeb;
  background:#fafbf9;
}
.trip-basket-foot span{
  color:#75807c;
  font-size:10px;
}
.trip-basket-foot button{
  border:0;
  background:transparent;
  color:#9a4037;
  font-size:10px;
  font-weight:700;
  cursor:pointer;
}

.trip-basket-open-planner{
  padding:0 12px 12px;
}
.trip-basket-open-planner a{
  min-height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:9px;
  background:#0f766e;
  color:#ffffff;
  font-size:11px;
  font-weight:750;
  text-decoration:none;
}

.trip-basket-embedded{
  overflow:hidden;
  border:1px solid #dce5e2;
  border-radius:12px;
  background:#ffffff;
}
.trip-basket-embedded-head{
  padding:16px 17px 7px;
}
.trip-basket-count{
  min-height:34px;
  padding:0 10px;
  display:flex;
  align-items:center;
  gap:6px;
  border:1px solid #d9e5e1;
  border-radius:8px;
  background:#f8fbfa;
  color:#31534c;
  font-size:11px;
  font-weight:750;
}
.trip-basket-embedded .trip-basket-list{
  max-height:390px;
  grid-template-columns:repeat(2,minmax(0,1fr));
}
.trip-basket-embedded .trip-basket-item{
  min-width:0;
}

@media(max-width:980px){
  .trip-basket-embedded .trip-basket-list{
    grid-template-columns:1fr;
  }
}
@media(max-width:680px){
  .trip-basket-fab{
    right:14px;
    bottom:16px;
  }
  .trip-basket-fab strong{
    display:none;
  }
  .trip-basket-panel{
    right:12px;
    bottom:var(--trip-basket-bottom,74px);
    width:calc(100vw - 24px);
  }
  .trip-basket-tabs{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .trip-basket-explore{
    grid-template-columns:1fr;
  }
  .trip-basket-day-action{
    grid-template-columns:1fr;
  }
  .trip-basket-item{
    grid-template-columns:64px minmax(0,1fr);
  }
  .trip-basket-item-media img,
  .trip-basket-item-placeholder{
    width:64px;
    height:62px;
  }
}
`;


export default TripBasketWidget;
