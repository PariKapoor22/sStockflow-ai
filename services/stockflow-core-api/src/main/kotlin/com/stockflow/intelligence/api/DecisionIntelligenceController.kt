package com.stockflow.intelligence.api

import com.stockflow.intelligence.application.DecisionIntelligenceClient
import com.stockflow.intelligence.application.ModelHazardAlert
import com.stockflow.weather.HazardAlertView
import com.stockflow.weather.HazardAlertsView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/integrations/model-hazards")
class DecisionIntelligenceController(private val client: DecisionIntelligenceClient) {
    @GetMapping
    fun hazards(@RequestHeader("X-Tenant-ID") tenantId: String): HazardAlertsView {
        require(tenantId.isNotBlank()) { "X-Tenant-ID is required" }
        val response = client.modelHazards()
        return HazardAlertsView(
            alerts = response.alerts.map(::toView),
            count = response.alerts.size,
            monitoredLocations = 0,
            regionCodes = response.sources.map { it.provider }.toSet(),
            source = "OPEN_SOURCE_HAZARD_MODELS",
            disclaimer = response.disclaimer
        )
    }

    private fun toView(alert: ModelHazardAlert): HazardAlertView {
        val point = alert.geometry?.takeIf { it.path("type").asText() == "Point" }?.path("coordinates")
        return HazardAlertView(
            id = alert.id, title = alert.title, eventType = alert.eventType, hazardType = alert.hazardType,
            areaName = alert.areaName, polygonGeoJson = alert.geometry?.toString(), severity = alert.severity,
            certainty = alert.confidence?.let { "${(it * 100).toInt()}% model confidence" } ?: "MODELLED",
            urgency = if (alert.phase == "ACTIVE") "IMMEDIATE" else "EXPECTED",
            description = buildString {
                append("${alert.model} outlook")
                alert.probability?.let { append(" · ${(it * 100).toInt()}% probability") }
                append(if (alert.live) " · live configured feed" else " · non-live feed")
            },
            instruction = "Review official authority warnings and field reports before changing a route.",
            startTime = alert.validFrom ?: alert.observedAt, expirationTime = alert.validUntil,
            phase = alert.phase, matchedLatitude = point?.get(1)?.asDouble() ?: 0.0,
            matchedLongitude = point?.get(0)?.asDouble() ?: 0.0,
            dataSourceName = "${alert.source} · ${alert.model}", dataSourceUri = alert.sourceUri
        )
    }
}
