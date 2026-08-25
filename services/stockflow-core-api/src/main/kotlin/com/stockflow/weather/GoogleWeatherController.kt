package com.stockflow.weather

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/integrations/google-weather")
class GoogleWeatherController(private val client: GoogleWeatherClient) {
    @GetMapping("/route-forecast")
    fun routeForecast(
        @RequestHeader("X-Tenant-ID") tenantId: String,
        @RequestParam latitude: Double,
        @RequestParam longitude: Double,
        @RequestParam(defaultValue = "0") etaMinutes: Int,
        @RequestParam(defaultValue = "Route destination") locationLabel: String
    ): RouteWeatherForecastView {
        if (tenantId.isBlank()) throw GoogleWeatherException(HttpStatus.BAD_REQUEST, "TENANT_REQUIRED", "A tenant ID is required")
        if (!latitude.isFinite() || latitude !in -90.0..90.0 || !longitude.isFinite() || longitude !in -180.0..180.0) {
            throw GoogleWeatherException(HttpStatus.BAD_REQUEST, "INVALID_WEATHER_LOCATION", "Weather forecast coordinates are invalid")
        }
        if (etaMinutes !in 0..1380) throw GoogleWeatherException(HttpStatus.BAD_REQUEST, "INVALID_WEATHER_ETA", "Weather ETA must be between 0 and 1380 minutes")
        return client.routeForecast(latitude, longitude, etaMinutes, locationLabel.take(80))
    }
}
