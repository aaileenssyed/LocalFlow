import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Itinerary } from '../types';

// Fix for default markers in some bundlers, though CDN usually handles it.
// We are setting global options just in case.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  itinerary: Itinerary;
  currentLocation?: { lat: number; lng: number };
}

// Helper component to auto-fit bounds
function MapUpdater({ stops, currentLocation }: { stops: any[], currentLocation?: {lat: number, lng: number} }) {
   const map = useMap();
   
   useEffect(() => {
     if (stops.length === 0) return;

     const points = stops.map(s => [s.location.lat, s.location.lng] as [number, number]);
     if (currentLocation && currentLocation.lat) {
         points.push([currentLocation.lat, currentLocation.lng]);
     }

     // Filter out invalid coords (0,0 or null)
     const validPoints = points.filter(p => p[0] !== 0 && p[1] !== 0);

     if (validPoints.length > 0) {
       const bounds = L.latLngBounds(validPoints);
       map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
     }
   }, [stops, currentLocation, map]);

   return null;
}

export const ItineraryMap: React.FC<Props> = ({ itinerary, currentLocation }) => {
    
  // Filter valid stops
  const validStops = useMemo(() => {
      return itinerary.stops.filter(s => s.location && s.location.lat && s.location.lng);
  }, [itinerary]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-stone-800 shadow-2xl relative z-0">
       <MapContainer 
         center={[40.7128, -74.0060]} 
         zoom={13} 
         style={{ height: '100%', width: '100%', background: '#1c1917' }}
         scrollWheelZoom={false}
       >
          {/* Dark Matter Tiles for the Vibe */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapUpdater stops={validStops} currentLocation={currentLocation} />

          {/* Path Line */}
          <Polyline 
            positions={validStops.map(s => [s.location.lat, s.location.lng])} 
            pathOptions={{ color: '#f59e0b', dashArray: '5, 10', weight: 3, opacity: 0.6 }} 
          />

          {/* User Location */}
          {currentLocation && currentLocation.lat !== 0 && (
             <CircleMarker 
                center={[currentLocation.lat, currentLocation.lng]} 
                radius={8}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 }}
             >
                <Popup className="text-stone-900">
                    <span className="font-bold">You are here</span>
                </Popup>
             </CircleMarker>
          )}

          {/* Stops */}
          {validStops.map((stop, index) => (
            <Marker 
                key={stop.id} 
                position={[stop.location.lat, stop.location.lng]}
            >
              <Popup>
                <div className="min-w-[150px]">
                    <div className="font-bold text-sm mb-1 text-amber-500">{index + 1}. {stop.name}</div>
                    <div className="text-xs text-stone-300 mb-2">{stop.startTime} - {stop.endTime}</div>
                    <div className="text-[10px] text-stone-400 border-t border-stone-700 pt-1">
                        {stop.description.substring(0, 50)}...
                    </div>
                </div>
              </Popup>
            </Marker>
          ))}
       </MapContainer>
    </div>
  );
};