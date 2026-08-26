package com.stockflow.intelligence.application

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.slf4j.LoggerFactory
import tools.jackson.databind.JsonNode
import java.net.http.HttpClient
import java.math.BigDecimal
import java.time.Duration
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

@Component
class DecisionIntelligenceClient(
    @Value("\${stockflow.decision-intelligence.enabled:false}") private val enabled: Boolean,
    @Value("\${stockflow.decision-intelligence.api-url:http://127.0.0.1:8092}") apiUrl: String,
    @Value("\${stockflow.decision-intelligence.connect-timeout-seconds:2}") connectTimeoutSeconds: Long,
    @Value("\${stockflow.decision-intelligence.read-timeout-seconds:25}") readTimeoutSeconds: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val requestFactory = JdkClientHttpRequestFactory(
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(connectTimeoutSeconds.coerceIn(1, 30))).build()
    ).apply { setReadTimeout(Duration.ofSeconds(readTimeoutSeconds.coerceIn(5, 120))) }
    private val client = RestClient.builder().baseUrl(apiUrl.trimEnd('/')).requestFactory(requestFactory).build()

    fun modelHazards(): ModelHazardsResponse {
        if (!enabled) return ModelHazardsResponse()
        return client.get().uri("/api/v1/hazards/model-outlooks")
            .retrieve().body(ModelHazardsResponse::class.java) ?: ModelHazardsResponse()
    }

    fun optimiseTransfers(request: NetworkTransferRequest): NetworkTransferResponse? {
        if (!enabled) return null
        return try {
            client.post().uri("/api/v1/transfers/optimize").body(request)
                .retrieve().body(NetworkTransferResponse::class.java)
        } catch (error: Exception) {
            logger.warn("OR-Tools service unavailable; using governed deterministic fallback: {}", error.message)
            null
        }
    }

    fun inventoryPolicy(request: InventoryPolicyRequest): InventoryPolicyResponse? {
        if (!enabled) return null
        return try {
            client.post().uri("/api/v1/inventory/policy").body(request)
                .retrieve().body(InventoryPolicyResponse::class.java)
        } catch (error: Exception) {
            logger.warn("Stockpyl service unavailable; using governed deterministic replenishment fallback: {}", error.message)
            null
        }
    }

    fun scoreAnomalies(request: AnomalyScoreRequest): AnomalyScoreResponse? {
        if (!enabled || request.observations.size < 8) return null
        return try {
            client.post().uri("/api/v1/anomalies/score").body(request)
                .retrieve().body(AnomalyScoreResponse::class.java)
        } catch (error: Exception) {
            logger.warn("PyOD service unavailable; returning rule-based risks without anomaly scores: {}", error.message)
            null
        }
    }

    fun optimiseRoutes(tenantId: String, request: JsonNode): JsonNode {
        requireDecisionService()
        return callRouteService("recalculate route candidates") {
            client.post().uri("/api/v1/routes/optimise")
                .header("X-Tenant-ID", tenantId)
                .body(request).retrieve().body(JsonNode::class.java)
        }
    }

    fun updateRouteStatus(
        tenantId: String,
        actorId: String,
        runId: String,
        routeId: String,
        request: JsonNode
    ): JsonNode {
        requireDecisionService()
        return callRouteService("update the route status") {
            client.post().uri("/api/v1/routes/runs/{runId}/routes/{routeId}/status", runId, routeId)
                .header("X-Tenant-ID", tenantId)
                .header("X-User-ID", actorId)
                .body(request).retrieve().body(JsonNode::class.java)
        }
    }

    private fun requireDecisionService() {
        if (!enabled) throw ResponseStatusException(
            HttpStatus.SERVICE_UNAVAILABLE,
            "Route optimisation is disabled. Start StockFlow with RUN_ALL_WINDOWS.cmd."
        )
    }

    private fun callRouteService(operation: String, call: () -> JsonNode?): JsonNode = try {
        call() ?: throw ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "The route optimisation service returned an empty response."
        )
    } catch (error: ResponseStatusException) {
        throw error
    } catch (error: Exception) {
        logger.warn("Route optimisation service could not {}: {}", operation, error.message)
        throw ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "The route optimisation service could not $operation. Confirm that port 8102 is running.",
            error
        )
    }
}

data class InventoryPolicyRequest(
    val tenant_id: String,
    val warehouse_id: String,
    val sku_id: String,
    val demand_mean: Double,
    val demand_sd: Double,
    val lead_time_days: Int,
    val holding_cost: Double,
    val stockout_cost: Double,
    val inventory_position: Double,
    val reorder_multiple: Int
)

data class InventoryPolicyResponse(
    val model: String = "",
    val baseStockLevel: Double = 0.0,
    val targetStock: Long = 0,
    val recommendedOrderQuantity: Long = 0,
    val expectedCostPerPeriod: Double = 0.0,
    val constraintsChecked: List<String> = emptyList()
)

data class AnomalyScoreRequest(
    val tenantId: String,
    val observations: List<AnomalyObservation>,
    val contamination: Double = 0.1
)

data class AnomalyObservation(val observationId: String, val features: Map<String, Double>)

data class AnomalyScoreResponse(
    val model: String = "",
    val observations: List<AnomalyResult> = emptyList(),
    val anomalyCount: Int = 0
)

data class AnomalyResult(
    val observationId: String = "",
    val isAnomaly: Boolean = false,
    val anomalyScore: Double = 0.0,
    val rawScore: Double = 0.0
)

data class NetworkTransferRequest(
    val tenantId: String,
    val skuId: String,
    val positions: List<NetworkPosition>,
    val lanes: List<TransferLane>
)

data class NetworkPosition(
    val warehouseId: String,
    val availableUnits: Long,
    val safetyStockUnits: Long,
    val targetStockUnits: Long,
    val shortagePenaltyPerUnit: BigDecimal
)

data class TransferLane(
    val sourceWarehouseId: String,
    val destinationWarehouseId: String,
    val costPerUnit: BigDecimal,
    val capacityUnits: Long
)

data class NetworkTransferResponse(
    val model: String = "",
    val solverStatus: String = "",
    val transfers: List<OptimisedTransfer> = emptyList(),
    val unmetShortageUnits: Map<String, Long> = emptyMap(),
    val constraintsChecked: List<String> = emptyList()
)

data class OptimisedTransfer(
    val sourceWarehouseId: String = "",
    val destinationWarehouseId: String = "",
    val quantity: Long = 0,
    val cost: BigDecimal = BigDecimal.ZERO
)

data class ModelHazardsResponse(
    val alerts: List<ModelHazardAlert> = emptyList(),
    val count: Int = 0,
    val sources: List<ModelHazardSource> = emptyList(),
    val generatedAt: String? = null,
    val disclaimer: String = "Model outlooks support decisions but do not replace official warnings."
)

data class ModelHazardSource(
    val provider: String = "",
    val configured: Boolean = false,
    val live: Boolean = false,
    val count: Int = 0
)

data class ModelHazardAlert(
    val id: String = "",
    val title: String = "",
    val eventType: String = "",
    val hazardType: String = "",
    val areaName: String = "",
    val geometry: JsonNode? = null,
    val severity: String = "UNKNOWN",
    val confidence: Double? = null,
    val probability: Double? = null,
    val observedAt: String? = null,
    val validFrom: String? = null,
    val validUntil: String? = null,
    val phase: String = "FORECAST",
    val source: String = "",
    val model: String = "",
    val sourceUri: String? = null,
    val live: Boolean = false
)
