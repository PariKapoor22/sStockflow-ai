package com.stockflow.district

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DistrictControllerTest(
    @Autowired private val mockMvc: MockMvc
) {
    @Test
    fun `district endpoint publishes the canonical GeoJSON contract`() {
        mockMvc.get("/api/v1/districts") {
            header("X-Tenant-ID", "TEN-ACME-PHARMA")
        }.andExpect {
            status { isOk() }
            jsonPath("$.type") { value("FeatureCollection") }
            jsonPath("$.features.length()") { value(8) }
            jsonPath("$.features[0].type") { value("Feature") }
            jsonPath("$.features[0].geometry.type") { value("Polygon") }
            jsonPath("$.features[0].properties.districtId") { value("d-in-as-kam") }
            jsonPath("$.features[0].properties.status") { value("OPEN") }
            jsonPath("$.features[0].properties.provenance.classification") { value("MOCK") }
        }
    }
}
