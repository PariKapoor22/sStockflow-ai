package com.stockflow.weather

data class RouteWeatherForecastView(
    val locationLabel: String,
    val forecastTime: String?,
    val condition: String,
    val iconUrl: String?,
    val temperatureCelsius: Double,
    val feelsLikeCelsius: Double,
    val precipitationProbabilityPercent: Int,
    val precipitationMillimeters: Double,
    val thunderstormProbabilityPercent: Int,
    val windSpeedKph: Double,
    val windGustKph: Double,
    val visibilityKm: Double,
    val humidityPercent: Int,
    val riskScore: Int,
    val riskLevel: String,
    val operationalAdvice: String,
    val source: String = "GOOGLE_WEATHER_API",
    val attribution: String = "Source: Includes weather data from Google"
)
