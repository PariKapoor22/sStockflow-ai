package com.stockflow.orders

import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomerOrderControllerTest(
    @Autowired private val mockMvc: MockMvc
) {
    @Test
    fun `orders workspace can list inspect create and advance persisted orders`() {
        mockMvc.get("/api/v1/orders") {
            header("X-Tenant-ID", "TEN-ACME-PHARMA")
            header("X-StockFlow-User-ID", "local-prototype-user")
        }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(greaterThanOrEqualTo(5)) }
            jsonPath("$[?(@.orderNumber == 'SO-10840')].status") { value("ALLOCATED") }
        }

        mockMvc.get("/api/v1/orders/10842000-0000-0000-0000-000000000001") {
            header("X-Tenant-ID", "TEN-ACME-PHARMA")
            header("X-StockFlow-User-ID", "local-prototype-user")
        }.andExpect {
            status { isOk() }
            jsonPath("$.order.orderNumber") { value("SO-10842") }
            jsonPath("$.events.length()") { value(3) }
        }

        val created = mockMvc.post("/api/v1/orders") {
            header("X-Tenant-ID", "TEN-ACME-PHARMA")
            header("X-StockFlow-User-ID", "local-prototype-user")
            header("Idempotency-Key", "controller-test-order-lifecycle")
            contentType = MediaType.APPLICATION_JSON
            content = """{
                "customerName":"API Test Pharmacy",
                "customerCity":"Shillong",
                "channel":"API",
                "warehouseId":"WH-GUWAHATI",
                "skuId":"SKU-PARA-650",
                "quantity":10,
                "promisedAt":"2027-01-15T10:00:00"
            }"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.order.status") { value("ALLOCATED") }
            jsonPath("$.order.quantity") { value(10) }
            jsonPath("$.events.length()") { value(1) }
        }.andReturn()

        val orderId = Regex("\\\"orderId\\\":\\\"([^\\\"]+)").find(created.response.contentAsString)!!.groupValues[1]
        mockMvc.post("/api/v1/orders/$orderId/advance") {
            header("X-Tenant-ID", "TEN-ACME-PHARMA")
            header("X-StockFlow-User-ID", "local-prototype-user")
            contentType = MediaType.APPLICATION_JSON
            content = """{"comment":"Advanced by Orders workspace test"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.order.status") { value("PICKING") }
            jsonPath("$.order.fulfilmentPercent") { value(50) }
            jsonPath("$.events.length()") { value(2) }
            jsonPath("$.events[1].comment") { value("Advanced by Orders workspace test") }
        }
    }

}
