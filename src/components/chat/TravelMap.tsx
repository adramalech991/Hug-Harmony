import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js/Leaflet
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

interface TravelMapProps {
    route: [number, number][];
    markers: { from?: [number, number]; to?: [number, number] };
}

// Component to handle map updates
const MapUpdater = ({ route, markers }: TravelMapProps) => {
    const map = useMap();

    useEffect(() => {
        if (route.length > 0) {
            // Create bounds from route points
            const bounds = L.latLngBounds(route);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (markers.from || markers.to) {
            // If no route but markers exist, fly to them
            const points: [number, number][] = [];
            if (markers.from) points.push(markers.from);
            if (markers.to) points.push(markers.to);

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                if (points.length === 1) {
                    map.flyTo(points[0], 13);
                } else {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        }
    }, [route, markers, map]);

    return null;
};

const TravelMap: React.FC<TravelMapProps> = ({ route, markers }) => {
    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Map Updater to handle view changes */}
            <MapUpdater route={route} markers={markers} />

            {route.length > 0 && (
                <Polyline positions={route} color="#F3CFC6" weight={5} opacity={0.7} />
            )}

            {markers.from && <Marker position={markers.from} icon={defaultIcon} />}
            {markers.to && <Marker position={markers.to} icon={defaultIcon} />}
        </MapContainer>
    );
};

export default TravelMap;
