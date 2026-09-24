export const SAVED_TRIP_ITEMS_KEY = "tourismhub_trip_places";

export const SAVED_TRIP_EVENT = "tourismhub:saved-places";

export const TRIP_CATEGORY_ORDER = [
  {
    key: "destinations",
    label: "Destinations",
    icon: "destination",
  },
  {
    key: "hotels",
    label: "Hotels",
    icon: "hotel",
  },
  {
    key: "events",
    label: "Events",
    icon: "event",
  },
  {
    key: "guides",
    label: "Guides",
    icon: "guide",
  },
];


const cleanString = (value) =>
  String(
    value ?? ""
  ).trim();


export const getTripItemCategoryKey = (
  item
) => {
  const type =
    cleanString(
      item?.tripItemType ||
        item?.itemType ||
        item?.item_type ||
        item?.type ||
        "destination"
    ).toLowerCase();


  if (
    type === "hotel" ||
    type === "accommodation" ||
    type === "stay" ||
    type === "property"
  ) {
    return "hotels";
  }


  if (
    type === "event"
  ) {
    return "events";
  }


  if (
    type === "guide" ||
    type === "tourist-guide" ||
    type === "tourist_guide"
  ) {
    return "guides";
  }


  return "destinations";
};


export const getTripItemTypeLabel = (
  item
) => {
  const category =
    getTripItemCategoryKey(
      item
    );


  if (
    category === "hotels"
  ) {
    return "Hotel";
  }


  if (
    category === "events"
  ) {
    return "Event";
  }


  if (
    category === "guides"
  ) {
    return "Guide";
  }


  return "Destination";
};


export const getTripItemSourceId = (
  item
) => {
  if (
    !item
  ) {
    return null;
  }


  const category =
    getTripItemCategoryKey(
      item
    );


  const candidates =
    category === "events"
      ? [
          item.touristEventId,
          item.tourist_event_id,
          item.eventId,
          item.event_id,
          item.databaseId,
          item.sourceId,
          item.source_id,
        ]
      : category === "hotels"
      ? [
          item.propertyId,
          item.property_id,
          item.sourceId,
          item.source_id,
        ]
      : category === "guides"
      ? [
          item.partnerGuideId,
          item.partner_guide_id,
          item.guideId,
          item.guide_id,
          item.sourceId,
          item.source_id,
        ]
      : [
          item.explorePlaceId,
          item.explore_place_id,
          item.placeId,
          item.place_id,
          item.sourceId,
          item.source_id,
        ];


  for (
    const value of
      candidates
  ) {
    if (
      value === undefined ||
      value === null ||
      !cleanString(
        value
      )
    ) {
      continue;
    }


    const numeric =
      Number(
        value
      );


    if (
      Number.isFinite(
        numeric
      )
    ) {
      return numeric;
    }


    if (
      category !==
      "events"
    ) {
      return value;
    }
  }


  const rawId =
    item.id;


  if (
    rawId === undefined ||
    rawId === null ||
    !cleanString(
      rawId
    )
  ) {
    return null;
  }


  const numeric =
    Number(
      rawId
    );


  if (
    Number.isFinite(
      numeric
    )
  ) {
    return numeric;
  }


  const match =
    cleanString(
      rawId
    ).match(
      /(\d+)$/
    );


  if (
    match
  ) {
    return Number(
      match[1]
    );
  }


  return category ===
    "events"
    ? null
    : rawId;
};

export const getTripItemKey = (
  item
) => {
  if (
    !item
  ) {
    return "";
  }


  const category =
    getTripItemCategoryKey(
      item
    );


  const sourceId =
    getTripItemSourceId(
      item
    );


  if (
    sourceId !== null &&
    sourceId !== undefined &&
    cleanString(
      sourceId
    )
  ) {
    return `${category}:${cleanString(
      sourceId
    )}`;
  }


  return `${category}:${cleanString(
    item.id ||
      item.name ||
      "item"
  )}`;
};


export const getTripItemImage = (
  item
) =>
  item?.image ||
  item?.imageUrl ||
  item?.image_url ||
  item?.main_image ||
  item?.hero_image ||
  item?.logo_url ||
  "";


export const getTripItemLocation = (
  item
) =>
  [
    item?.city,
    item?.district,
    item?.region,
  ]
    .map(
      cleanString
    )
    .filter(
      Boolean
    )
    .filter(
      (
        value,
        index,
        array
      ) =>
        array.indexOf(
          value
        ) === index
    )
    .join(
      " • "
    ) ||
  "Sri Lanka";


export const getTripItemLink = (
  item
) => {
  if (
    item?.link
  ) {
    return item.link;
  }


  const category =
    getTripItemCategoryKey(
      item
    );


  const sourceId =
    getTripItemSourceId(
      item
    );


  if (
    category ===
      "destinations" &&
    sourceId
  ) {
    return `/explore/${sourceId}`;
  }


  if (
    category ===
      "hotels" &&
    sourceId
  ) {
    return `/hotels/${sourceId}`;
  }


  if (
    category ===
    "events"
  ) {
    const eventSlug =
      cleanString(
        item?.slug ||
        item?.eventSlug ||
        item?.event_slug
      );


    return eventSlug
      ? `/events/${encodeURIComponent(
          eventSlug
        )}`
      : "/events";
  }


  if (
    category ===
    "guides"
  ) {
    return "/tourist-guides";
  }


  return "";
};


const normalizeTripItem = (
  item
) => {
  if (
    !item
  ) {
    return null;
  }


  const category =
    getTripItemCategoryKey(
      item
    );


  const sourceId =
    getTripItemSourceId(
      item
    );


  const tripItemType =
    category === "hotels"
      ? "hotel"
      : category ===
        "events"
      ? "event"
      : category ===
        "guides"
      ? "guide"
      : "destination";


  const normalized = {
    ...item,

    sourceId:
      sourceId ??
      item.sourceId ??
      item.id ??
      null,

    tripItemType,
  };


  if (
    category ===
      "events" &&
    Number.isFinite(
      Number(sourceId)
    )
  ) {
    normalized.touristEventId =
      Number(sourceId);
  }


  return normalized;
};


export const readTripItems = () => {
  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          SAVED_TRIP_ITEMS_KEY
        ) ||
          "[]"
      );


    if (
      !Array.isArray(
        saved
      )
    ) {
      return [];
    }


    const unique =
      new Map();


    saved
      .filter(
        Boolean
      )
      .map(
        normalizeTripItem
      )
      .filter(
        Boolean
      )
      .forEach(
        (
          item
        ) => {
          unique.set(
            getTripItemKey(
              item
            ),
            item
          );
        }
      );


    return [
      ...unique.values(),
    ];
  } catch {
    return [];
  }
};


export const writeTripItems = (
  items
) => {
  const unique =
    new Map();


  (
    Array.isArray(
      items
    )
      ? items
      : []
  )
    .filter(
      Boolean
    )
    .map(
      normalizeTripItem
    )
    .filter(
      Boolean
    )
    .forEach(
      (
        item
      ) => {
        unique.set(
          getTripItemKey(
            item
          ),
          item
        );
      }
    );


  const cleanItems = [
    ...unique.values(),
  ];


  localStorage.setItem(
    SAVED_TRIP_ITEMS_KEY,
    JSON.stringify(
      cleanItems
    )
  );


  window.dispatchEvent(
    new Event(
      SAVED_TRIP_EVENT
    )
  );


  return cleanItems;
};


export const isTripItemSaved = (
  itemOrId,
  items = readTripItems()
) => {
  if (
    itemOrId &&
    typeof itemOrId ===
      "object"
  ) {
    const targetKey =
      getTripItemKey(
        itemOrId
      );


    return items.some(
      (
        item
      ) =>
        getTripItemKey(
          item
        ) ===
        targetKey
    );
  }


  return items.some(
    (
      item
    ) =>
      String(
        item.id
      ) ===
        String(
          itemOrId
        ) ||
      String(
        getTripItemSourceId(
          item
        )
      ) ===
        String(
          itemOrId
        )
  );
};


export const toggleTripItem = (
  item
) => {
  const normalized =
    normalizeTripItem(
      item
    );


  if (
    !normalized ||
    !getTripItemSourceId(
      normalized
    )
  ) {
    return {
      saved: false,
      items:
        readTripItems(),
    };
  }


  const current =
    readTripItems();


  const targetKey =
    getTripItemKey(
      normalized
    );


  const exists =
    current.some(
      (
        savedItem
      ) =>
        getTripItemKey(
          savedItem
        ) ===
        targetKey
    );


  const nextItems =
    exists
      ? current.filter(
          (
            savedItem
          ) =>
            getTripItemKey(
              savedItem
            ) !==
            targetKey
        )
      : [
          ...current,
          normalized,
        ];


  const written =
    writeTripItems(
      nextItems
    );


  return {
    saved:
      !exists,
    items:
      written,
  };
};


export const removeTripItem = (
  itemOrId
) => {
  const current =
    readTripItems();


  const targetKey =
    itemOrId &&
    typeof itemOrId ===
      "object"
      ? getTripItemKey(
          itemOrId
        )
      : "";


  const nextItems =
    current.filter(
      (
        item
      ) => {
        if (
          targetKey
        ) {
          return (
            getTripItemKey(
              item
            ) !==
            targetKey
          );
        }


        return (
          String(
            item.id
          ) !==
            String(
              itemOrId
            ) &&
          String(
            getTripItemSourceId(
              item
            )
          ) !==
            String(
              itemOrId
            )
        );
      }
    );


  return writeTripItems(
    nextItems
  );
};


export const clearTripItems = () => {
  writeTripItems(
    []
  );
};


export const groupTripItemsByType = (
  items = [],
  {
    includeEmpty = false,
  } = {}
) => {
  const buckets = {
    destinations: [],
    hotels: [],
    events: [],
    guides: [],
  };


  items
    .filter(
      Boolean
    )
    .forEach(
      (
        item
      ) => {
        buckets[
          getTripItemCategoryKey(
            item
          )
        ].push(
          item
        );
      }
    );


  return TRIP_CATEGORY_ORDER
    .map(
      ({
        key,
        label,
        icon,
      }) => ({
        key,
        label,
        icon,
        items:
          buckets[
            key
          ],
      })
    )
    .filter(
      (
        group
      ) =>
        includeEmpty ||
        group.items.length >
          0
    );
};