package com.stockflow.intelligence.api

import com.stockflow.intelligence.application.DecisionIntelligenceClient
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.JsonNode

@RestController
@RequestMapping("/api/v1/routes")
class RouteOptimizationController(private val client: DecisionIntelligenceClient) {
    @PostMapping("/optimise")
    fun optimise(
        @RequestHeader("X-Tenant-ID") tenantId: String,
        @RequestBody request: JsonNode
    ): JsonNode = client.optimiseRoutes(tenantId, request)

    @PostMapping("/runs/{runId}/routes/{routeId}/status")
    fun updateStatus(
        @RequestHeader("X-Tenant-ID") tenantId: String,
        @RequestHeader("X-User-ID", defaultValue = "demo-planner") actorId: String,
        @PathVariable runId: String,
        @PathVariable routeId: String,
        @RequestBody request: JsonNode
    ): JsonNode = client.updateRouteStatus(tenantId, actorId, runId, routeId, request)
}
