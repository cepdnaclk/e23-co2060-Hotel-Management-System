import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import {
  useEffect,
  useMemo,
} from "react";
import "leaflet/dist/leaflet.css";


const validNumber = (value) =>
  Number.isFinite(
    Number(value)
  );


const normalizeLineGeometry = (
  geometry
) => {
  if (!geometry) {
    return null;
  }

  if (
    geometry.type ===
    "Feature"
  ) {
    return normalizeLineGeometry(
      geometry.geometry
    );
  }

  if (
    geometry.type ===
      "FeatureCollection" &&
    Array.isArray(
      geometry.features
    )
  ) {
    const feature =
      geometry.features.find(
        (item) =>
          item?.geometry?.type ===
          "LineString"
      );

    return normalizeLineGeometry(
      feature?.geometry
    );
  }

  if (
    geometry.type !==
      "LineString" ||
    !Array.isArray(
      geometry.coordinates
    )
  ) {
    return null;
  }

  return geometry;
};


const geometryToLeaflet = (
  geometry
) => {
  const line =
    normalizeLineGeometry(
      geometry
    );

  if (!line) {
    return [];
  }

  return line.coordinates
    .filter(
      (coordinate) =>
        Array.isArray(
          coordinate
        ) &&
        coordinate.length >=
          2 &&
        validNumber(
          coordinate[0]
        ) &&
        validNumber(
          coordinate[1]
        )
    )
    .map(
      ([lng, lat]) => [
        Number(lat),
        Number(lng),
      ]
    );
};


const getConfiguredCenter = (
  mapConfig
) => {
  const center =
    mapConfig?.center;

  if (
    Array.isArray(center) &&
    center.length >= 2 &&
    validNumber(
      center[0]
    ) &&
    validNumber(
      center[1]
    )
  ) {
    /*
      Database stores map center as:
      [longitude, latitude]

      Leaflet expects:
      [latitude, longitude]
    */
    return [
      Number(
        center[1]
      ),
      Number(
        center[0]
      ),
    ];
  }

  if (
    validNumber(
      mapConfig?.centerLat
    ) &&
    validNumber(
      mapConfig?.centerLng
    )
  ) {
    return [
      Number(
        mapConfig.centerLat
      ),
      Number(
        mapConfig.centerLng
      ),
    ];
  }

  return [0, 0];
};


const createMarkerIcon = (
  label
) =>
  L.divIcon({
    className:
      "trip-map-marker-wrapper",

    html: `
      <div class="trip-map-marker">
        <span>${label}</span>
      </div>
    `,

    iconSize: [
      34,
      38,
    ],

    iconAnchor: [
      17,
      36,
    ],

    popupAnchor: [
      0,
      -34,
    ],
  });


function MapViewport({
  markers,
  currentLine,
  recommendedLine,
  minZoom,
  maxZoom,
  defaultCenter,
  defaultZoom,
}) {
  const map =
    useMap();


  useEffect(() => {
    const allPoints = [
      ...markers.map(
        (marker) => [
          marker.lat,
          marker.lng,
        ]
      ),

      ...currentLine,

      ...recommendedLine,
    ].filter(
      (point) =>
        Array.isArray(
          point
        ) &&
        validNumber(
          point[0]
        ) &&
        validNumber(
          point[1]
        )
    );


    if (
      !allPoints.length
    ) {
      if (
        defaultCenter.some(
          (value) =>
            Number(value) !==
            0
        )
      ) {
        map.setView(
          defaultCenter,
          defaultZoom
        );
      }

      return;
    }


    if (
      allPoints.length ===
      1
    ) {
      const targetZoom =
        Math.min(
          Number(maxZoom) ||
            18,

          Math.max(
            Number(minZoom) ||
              5,

            11
          )
        );


      map.setView(
        allPoints[0],
        targetZoom
      );

      return;
    }


    const bounds =
      L.latLngBounds(
        allPoints
      );


    map.fitBounds(
      bounds,
      {
        padding: [
          34,
          34,
        ],

        maxZoom:
          Math.min(
            Number(maxZoom) ||
              18,

            12
          ),
      }
    );
  }, [
    map,
    markers,
    currentLine,
    recommendedLine,
    minZoom,
    maxZoom,
    defaultCenter,
    defaultZoom,
  ]);


  return null;
}


function TripPlannerMap({
  days = [],
  mapConfig,
  routeAnalysis,
}) {
  const markers =
    useMemo(() => {
      const result = [];


      days.forEach(
        (
          day,
          dayIndex
        ) => {
          const destinations =
            Array.isArray(
              day.destinations
            )
              ? day.destinations
              : [];


          destinations.forEach(
            (
              destination,
              destinationIndex
            ) => {
              if (
                !validNumber(
                  destination.lat
                ) ||
                !validNumber(
                  destination.lng
                )
              ) {
                return;
              }


              result.push({
                key:
                  `${day.dayNumber}-${destination.id}-${destinationIndex}`,

                label:
                  destinations.length >
                  1
                    ? `${dayIndex + 1}.${destinationIndex + 1}`
                    : `${dayIndex + 1}`,

                dayNumber:
                  dayIndex + 1,

                name:
                  destination.name,

                city:
                  destination.city,

                district:
                  destination.district,

                lat:
                  Number(
                    destination.lat
                  ),

                lng:
                  Number(
                    destination.lng
                  ),
              });
            }
          );
        }
      );


      return result;
    }, [
      days,
    ]);


  const currentLine =
    useMemo(
      () =>
        geometryToLeaflet(
          routeAnalysis
            ?.current
            ?.geometry
        ),
      [
        routeAnalysis,
      ]
    );


  const recommendedLine =
    useMemo(
      () =>
        routeAnalysis
          ?.improved
          ? geometryToLeaflet(
              routeAnalysis
                ?.recommended
                ?.geometry
            )
          : [],
      [
        routeAnalysis,
      ]
    );


  const configuredCenter =
    useMemo(
      () =>
        getConfiguredCenter(
          mapConfig
        ),
      [
        mapConfig,
      ]
    );


  const initialCenter =
    markers.length
      ? [
          markers[0].lat,
          markers[0].lng,
        ]
      : configuredCenter;


  const initialZoom =
    Number(
      mapConfig?.zoom
    ) ||
    Number(
      mapConfig?.minZoom
    ) ||
    5;


  const hasCurrentRoute =
    currentLine.length > 1;


  if (
    !mapConfig?.tileUrl
  ) {
    return (
      <div className="trip-map-empty">
        <strong>
          Map configuration unavailable
        </strong>

        <p>
          The map configuration could not be loaded from the database.
        </p>
      </div>
    );
  }


  return (
    <div className="trip-map-shell">
      <MapContainer
        center={
          initialCenter
        }
        zoom={
          initialZoom
        }
        minZoom={
          Number(
            mapConfig.minZoom
          ) ||
          5
        }
        maxZoom={
          Number(
            mapConfig.maxZoom
          ) ||
          18
        }
        scrollWheelZoom
        className="trip-map"
      >
        <TileLayer
          url={
            mapConfig.tileUrl
          }
          attribution={
            mapConfig.attribution ||
            ""
          }
        />


        {hasCurrentRoute && (
          <Polyline
            positions={
              currentLine
            }
            pathOptions={{
              color:
                "#64748b",

              weight:
                5,

              opacity:
                0.72,

              dashArray:
                routeAnalysis
                  ?.improved
                  ? "8 10"
                  : undefined,
            }}
          />
        )}


        {recommendedLine.length >
          1 && (
          <Polyline
            positions={
              recommendedLine
            }
            pathOptions={{
              color:
                "#0f766e",

              weight:
                6,

              opacity:
                0.95,
            }}
          />
        )}


        {markers.map(
          (marker) => (
            <Marker
              key={
                marker.key
              }
              position={[
                marker.lat,
                marker.lng,
              ]}
              icon={
                createMarkerIcon(
                  marker.label
                )
              }
            >
              <Popup>
                <div className="trip-map-popup">
                  <strong>
                    Day{" "}
                    {
                      marker.dayNumber
                    }
                  </strong>

                  <b>
                    {
                      marker.name
                    }
                  </b>

                  <span>
                    {[
                      marker.city,
                      marker.district,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " • "
                      )}
                  </span>
                </div>
              </Popup>
            </Marker>
          )
        )}


        <MapViewport
          markers={
            markers
          }
          currentLine={
            currentLine
          }
          recommendedLine={
            recommendedLine
          }
          minZoom={
            mapConfig.minZoom
          }
          maxZoom={
            mapConfig.maxZoom
          }
          defaultCenter={
            configuredCenter
          }
          defaultZoom={
            initialZoom
          }
        />
      </MapContainer>


      {!hasCurrentRoute &&
        markers.length >= 2 && (
        <div className="trip-map-route-status">
          Route not analyzed
        </div>
      )}


      {hasCurrentRoute && (
        <div className="trip-map-legend">
          <span>
            <i className="current" />
            Current route
          </span>

          {routeAnalysis
            ?.improved && (
            <span>
              <i className="recommended" />
              Recommended
            </span>
          )}
        </div>
      )}
    </div>
  );
}


export default TripPlannerMap;
