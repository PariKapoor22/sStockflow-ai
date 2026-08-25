export interface RouteWeatherForecast {
  locationLabel: string;
  forecastTime: string | null;
  condition: string;
  iconUrl: string | null;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  precipitationProbabilityPercent: number;
  precipitationMillimeters: number;
  thunderstormProbabilityPercent: number;
  windSpeedKph: number;
  windGustKph: number;
  visibilityKm: number;
  humidityPercent: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  operationalAdvice: string;
  source: 'GOOGLE_WEATHER_API';
  attribution: string;
}
