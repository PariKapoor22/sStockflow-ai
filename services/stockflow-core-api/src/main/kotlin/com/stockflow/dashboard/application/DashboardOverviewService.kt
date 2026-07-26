package com.stockflow.dashboard.application

import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets

@Service
class DashboardOverviewService {
    fun getOverviewJson(): String =
        ClassPathResource("fixtures/dashboard-overview.json")
            .inputStream
            .bufferedReader(StandardCharsets.UTF_8)
            .use { it.readText() }
}
