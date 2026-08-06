import { emissionFactors } from "../data/emissionFactors";

export function calculateEmission({
  electricity,
  fuel,
  transport,
  waste,
}) {
  const electricityEmission =
    electricity * emissionFactors.electricity;

  const fuelEmission =
    fuel * emissionFactors.petrol;

  const transportEmission =
    transport * emissionFactors.transport;

  const wasteEmission =
    waste * emissionFactors.waste;

  const total =
    electricityEmission +
    fuelEmission +
    transportEmission +
    wasteEmission;

  return {
    electricityEmission,
    fuelEmission,
    transportEmission,
    wasteEmission,
    total,
  };
}