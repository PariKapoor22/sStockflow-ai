import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

export default function RouteMap({ route }) {

  const defaultCenter = [13.0827, 80.2707];

  if (!route) {

    return (

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-[500px] flex items-center justify-center">

        <p>Select a route to display the map.</p>

      </div>

    );

  }

  const source = [
    route.origin_lat,
    route.origin_lon,
  ];

  const destination = [
    route.destination_lat,
    route.destination_lon,
  ];

  return (

    <MapContainer
      center={source}
      zoom={6}
      style={{
        height: "500px",
        borderRadius: "24px",
      }}
    >

      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={source}>
        <Popup>
          Source Warehouse
        </Popup>
      </Marker>

      <Marker position={destination}>
        <Popup>
          Destination Warehouse
        </Popup>
      </Marker>

      <Polyline
        positions={[source, destination]}
      />

    </MapContainer>

  );

}