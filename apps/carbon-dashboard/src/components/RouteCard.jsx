import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function FitBounds({ positions }) {

  const map = useMap();

  useEffect(() => {

    if (positions.length > 1) {

      map.fitBounds(positions, {
        padding: [50, 50],
      });

    }

  }, [positions, map]);

  return null;
}

export default function RouteMap({

  origin,

  destination,

  route,

}) {

  if (!origin || !destination) {

    return (

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-[550px] flex justify-center items-center">

        <h2 className="text-xl font-semibold text-slate-500">

          Select source and destination warehouse

        </h2>

      </div>

    );

  }

  const positions = [];

  if (route?.geometry?.coordinates) {

    route.geometry.coordinates.forEach((point) => {

      positions.push([
        point[1],
        point[0],
      ]);

    });

  }

  return (

    <MapContainer

      center={[origin.lat, origin.lng]}

      zoom={6}

      style={{

        height: "550px",

        borderRadius: "24px",

      }}

    >

      <TileLayer

        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      />

      <Marker position={[origin.lat, origin.lng]}>

        <Popup>

          {origin.name}

        </Popup>

      </Marker>

      <Marker position={[destination.lat, destination.lng]}>

        <Popup>

          {destination.name}

        </Popup>

      </Marker>

      {positions.length > 0 && (

        <Polyline

          positions={positions}

          pathOptions={{

            color: "#16a34a",

            weight: 6,

          }}

        />

      )}

      <FitBounds positions={positions} />

    </MapContainer>

  );

}