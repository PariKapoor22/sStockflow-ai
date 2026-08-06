export function calculateCarbon(distanceKm, mileageKmPerLitre) {

  const fuelUsed = distanceKm / mileageKmPerLitre;

  const carbonEmission = fuelUsed * 2.68;

  return {
    fuelUsed: Number(fuelUsed.toFixed(2)),
    carbonEmission: Number(carbonEmission.toFixed(2)),
  };

}