package com.stockflow.forecasting.application

import com.stockflow.forecasting.persistence.DemandPattern
import com.stockflow.forecasting.persistence.ForecastModelCode
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.math.BigDecimal
import java.net.http.HttpClient
import java.time.Duration
import java.time.Instant

@Component
class StatsForecastClient(
    @Value("\${stockflow.statsforecast.enabled:false}") private val enabled: Boolean,
    @Value("\${stockflow.statsforecast.api-url:http://127.0.0.1:8101}") private val apiUrl: String,
    @Value("\${stockflow.statsforecast.connect-timeout-seconds:2}") connectTimeoutSeconds: Long,
    @Value("\${stockflow.statsforecast.read-timeout-seconds:90}") readTimeoutSeconds: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val requestFactory = JdkClientHttpRequestFactory(
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds.coerceIn(1, 30)))
            .build()
    ).apply { setReadTimeout(Duration.ofSeconds(readTimeoutSeconds.coerceIn(5, 300))) }
    private val client = RestClient.builder().baseUrl(apiUrl.trimEnd('/')).requestFactory(requestFactory).build()

    @Volatile
    private var unavailableUntil: Instant = Instant.EPOCH

    fun candidates(request: StatsForecastRequest): List<StatsForecastCandidate> {
        if (!enabled || Instant.now().isBefore(unavailableUntil)) return emptyList()
        return try {
            val response = client.post()
                .uri("/api/v1/forecast/candidates")
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .header(HttpHeaders.ACCEPT, "application/json")
                .header("X-Tenant-ID", request.tenantId)
                .body(request)
                .retrieve()
                .body(StatsForecastResponse::class.java)
            if (response == null ||
                response.tenantId != request.tenantId ||
                response.warehouseId != request.warehouseId ||
                response.skuId != request.skuId
            ) {
                logger.warn("StatsForecast challenger returned mismatched request identifiers; ignoring response")
                return emptyList()
            }
            unavailableUntil = Instant.EPOCH
            response.candidates
        } catch (error: Exception) {
            unavailableUntil = Instant.now().plusSeconds(30)
            logger.warn("StatsForecast challenger unavailable; continuing with in-process models: {}", error.message)
            emptyList()
        }
    }
}

data class StatsForecastRequest(
    val tenantId: String,
    val warehouseId: String,
    val skuId: String,
    val modelHistory: List<BigDecimal>,
    val actualHistory: List<BigDecimal>,
    val horizonDays: Int,
    val backtestPeriods: Int,
    val minimumTrainingPeriods: Int,
    val seasonLength: Int,
    val demandPattern: DemandPattern,
    val modelCodes: List<ForecastModelCode> = listOf(
        ForecastModelCode.STATS_AUTO_ETS,
        ForecastModelCode.STATS_AUTO_ARIMA,
        ForecastModelCode.STATS_CROSTON_OPTIMIZED,
        ForecastModelCode.STATS_SEASONAL_NAIVE
    )
)

data class StatsForecastResponse(
    val tenantId: String = "",
    val warehouseId: String = "",
    val skuId: String = "",
    val engine: String = "",
    val engineVersion: String = "",
    val candidates: List<StatsForecastCandidate> = emptyList(),
    val failures: Map<String, String> = emptyMap()
)

data class StatsForecastCandidate(
    val modelCode: ForecastModelCode,
    val trainingSampleCount: Int,
    val backtestPoints: Int,
    val mae: BigDecimal,
    val rmse: BigDecimal,
    val mape: BigDecimal?,
    val wape: BigDecimal,
    val smape: BigDecimal,
    val mase: BigDecimal?,
    val rmsse: BigDecimal?,
    val bias: BigDecimal,
    val selectionScore: BigDecimal,
    val forecast: List<BigDecimal>,
    val lowerBounds: List<BigDecimal>,
    val upperBounds: List<BigDecimal>
)
