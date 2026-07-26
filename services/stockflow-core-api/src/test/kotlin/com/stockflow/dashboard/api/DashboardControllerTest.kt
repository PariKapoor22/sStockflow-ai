package com.stockflow.dashboard.api

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerTest(
    @Autowired private val mockMvc: MockMvc
) {
    @Test
    fun `dashboard overview returns KPI data`() {
        mockMvc.get("/api/v1/dashboard/overview")
            .andExpect {
                status { isOk() }
                jsonPath("$.riskTotal") { value(356) }
                jsonPath("$.kpis.length()") { value(5) }
            }
    }
}
