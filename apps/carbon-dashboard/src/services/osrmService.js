import axios from "axios";

export async function getOptimizedRoute(origin, destination) {

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;

  const response = await axios.get(url);

  return response.data.routes[0];
}