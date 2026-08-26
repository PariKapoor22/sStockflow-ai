package com.stockflow.district

import tools.jackson.databind.ObjectMapper
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DistrictService(
    private val districtRepository: DistrictRepository,
    private val objectMapper: ObjectMapper
) {
    private val canonicalFixture: DistrictFeatureCollection by lazy {
        ClassPathResource("fixtures/districts.json").inputStream.use { input ->
            objectMapper.readValue(input, DistrictFeatureCollection::class.java)
        }
    }

    @Transactional(readOnly = true)
    fun getDistrictsByTenant(tenantId: String): DistrictFeatureCollection {
        val persisted = districtRepository.findByTenantId(tenantId).associateBy { it.districtId }
        if (persisted.isEmpty()) return canonicalFixture

        return canonicalFixture.copy(features = canonicalFixture.features.map { feature ->
            val district = persisted[feature.properties.districtId] ?: return@map feature
            feature.copy(
                geometry = objectMapper.readTree(district.geometryJson),
                properties = feature.properties.copy(
                    name = district.name,
                    status = district.status,
                    provenance = feature.properties.provenance.copy(
                        source = district.source,
                        extractedAt = district.extractedAt.toString(),
                        validUntil = district.validUntil.toString(),
                        confidenceScore = district.confidenceScore.toDouble()
                    )
                )
            )
        })
    }
}
