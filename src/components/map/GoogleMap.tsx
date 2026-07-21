"use client";

import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import { Shield, Zap, Info, CloudRain } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -23.561,
  lng: -46.656
};

// ... Dark theme omitted for brevity (will keep it from original file)
const darkTheme = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const defaultOptions = {
  styles: darkTheme,
  disableDefaultUI: true,
  zoomControl: false,
};

interface TxdMapProps {
  pickupCoords?: { lat: number, lng: number } | null;
  destinationCoords?: { lat: number, lng: number } | null;
  directions?: google.maps.DirectionsResult | null;
}

export default function TxdGoogleMap({ pickupCoords, destinationCoords, directions }: TxdMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY" // Fallback to avoid breaking if missing
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [layers, setLayers] = useState({
    traffic: false,
    weather: false,
    incidents: false,
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={pickupCoords || center}
        zoom={14}
        options={defaultOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {pickupCoords && !directions && (
          <Marker position={pickupCoords} icon={{ url: '/marker-pickup.png', scaledSize: new window.google.maps.Size(32, 32) }} />
        )}
        {destinationCoords && !directions && (
          <Marker position={destinationCoords} icon={{ url: '/marker-dest.png', scaledSize: new window.google.maps.Size(32, 32) }} />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: { strokeColor: '#10b981', strokeWeight: 5 }
            }}
          />
        )}
      </GoogleMap>

      {/* Road Intelligence Toggles */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={() => setLayers(l => ({ ...l, traffic: !l.traffic }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.traffic ? 'bg-primary text-black border-primary' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Trânsito ao vivo"
        >
          <Zap className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setLayers(l => ({ ...l, incidents: !l.incidents }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.incidents ? 'bg-primary text-black border-primary' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Acidentes / Obras"
        >
          <Shield className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setLayers(l => ({ ...l, weather: !l.weather }))}
          className={`p-2 rounded-full shadow-lg border transition-colors ${layers.weather ? 'bg-blue-500 text-white border-blue-500' : 'bg-card-bg text-gray-400 border-card-border hover:bg-card-bg/80'}`}
          title="Clima (Chuva)"
        >
          <CloudRain className="w-5 h-5" />
        </button>
      </div>
    </div>
  ) : <div className="w-full h-full bg-[#0a1628] flex items-center justify-center text-white">Carregando mapa...</div>;
}
