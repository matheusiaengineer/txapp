"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Coord {
  lat: number;
  lng: number;
}

interface DriverMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  eta?: string;
  modality?: string;
  heading?: number;
}

interface RouteData {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

interface MapProps {
  center?: Coord;
  zoom?: number;
  drivers?: DriverMarker[];
  pickup?: Coord | null;
  destination?: Coord | null;
  route?: RouteData | null;
  showUserLocation?: boolean;
  userLocation?: Coord | null;
  onCenterChange?: (center: Coord) => void;
  onMapClick?: (coord: Coord) => void;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  height?: string;
}

function createDriverIcon(label?: string): L.DivIcon {
  return L.divIcon({
    className: "txd-driver-marker",
    html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#3ECB8E,#2da874);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(62,203,142,0.5);border:2px solid #fff;font-size:14px;font-weight:bold;color:#000;">${label || "T"}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

function createDriverHeadingIcon(label: string | undefined, heading: number): L.DivIcon {
  return L.divIcon({
    className: "txd-driver-heading-marker",
    html: `<div style="position:relative;width:44px;height:44px;">
      <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(${heading}deg);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #3ECB8E;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));"></div>
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#3ECB8E,#2da874);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(62,203,142,0.5),0 0 0 3px rgba(62,203,142,0.2);border:2px solid #fff;font-size:14px;font-weight:bold;color:#000;">${label || "T"}</div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

function createPickupIcon(): L.DivIcon {
  return L.divIcon({
    className: "txd-pickup-marker",
    html: `<div style="width:18px;height:18px;background:#3ECB8E;border-radius:50%;box-shadow:0 0 0 4px rgba(62,203,142,0.3),0 2px 8px rgba(0,0,0,0.3);border:3px solid #fff;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createDestIcon(): L.DivIcon {
  return L.divIcon({
    className: "txd-dest-marker",
    html: `<div style="width:18px;height:18px;background:#EF4444;border-radius:50%;box-shadow:0 0 0 4px rgba(239,68,68,0.3),0 2px 8px rgba(0,0,0,0.3);border:3px solid #fff;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "txd-user-marker",
    html: `<div style="width:22px;height:22px;background:#3B82F6;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);border:3px solid #fff;position:relative;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:#fff;border-radius:50%;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MapController({ center, zoom, pickup, destination }: {
  center?: Coord;
  zoom?: number;
  pickup?: Coord | null;
  destination?: Coord | null;
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (pickup && destination && !hasFitted.current) {
      hasFitted.current = true;
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, animate: true });
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  useEffect(() => {
    if (center && !pickup && !destination) {
      map.setView([center.lat, center.lng], zoom || map.getZoom(), { animate: true });
    }
  }, [center?.lat, center?.lng]);

  return null;
}

function ClickHandler({ onClick }: { onClick?: (coord: Coord) => void }) {
  useMapEvents({
    click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

export function OpenStreetMap({
  center,
  zoom = 14,
  drivers = [],
  pickup,
  destination,
  route,
  showUserLocation = false,
  userLocation,
  onCenterChange,
  onMapClick,
  className = "",
  style,
  interactive = true,
  height = "100%",
}: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`bg-[#1a1a2e] flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={{ height, ...style }}
      >
        Carregando mapa...
      </div>
    );
  }

  const defaultCenter: [number, number] = center
    ? [center.lat, center.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-23.561, -46.656];

  return (
    <div className={`relative ${className}`} style={{ height, ...style }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={false}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController center={center} zoom={zoom} pickup={pickup} destination={destination} />
        <ClickHandler onClick={onMapClick} />

        {showUserLocation && userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationIcon()}>
            <Popup>Minha localização</Popup>
          </Marker>
        )}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={createPickupIcon()}>
            <Popup>Origem</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={createDestIcon()}>
            <Popup>Destino</Popup>
          </Marker>
        )}

        {route && route.coordinates.length > 1 && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: "#3ECB8E",
              weight: 4,
              opacity: 0.8,
              dashArray: "1 12",
              lineCap: "round",
            }}
          />
        )}

        {route && route.coordinates.length > 1 && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: "#3ECB8E",
              weight: 6,
              opacity: 0.25,
              lineCap: "round",
            }}
          />
        )}

        {drivers.map(d => (
          <Marker
            key={d.id}
            position={[d.lat, d.lng]}
            icon={d.heading != null ? createDriverHeadingIcon(d.label?.[0] || "T", d.heading) : createDriverIcon(d.label?.[0] || "T")}
          >
            <Popup>
              <div className="text-sm font-medium">{d.label || "Motorista"}</div>
              {d.eta && <div className="text-xs text-gray-500">ETA: {d.eta}</div>}
              {d.modality && <div className="text-xs text-gray-500">{d.modality}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
